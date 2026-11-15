-- Corner Rx online tables: question flags and the leaderboard. No player login.
--
-- SETUP (about 5 minutes, free tier is plenty):
--   1. supabase.com > New project. Pick any name and region, save the database password somewhere.
--   2. Edit the line below that says CHANGE-ME-... : put a long random phrase there. That is your admin key.
--      You type it once into the game's Question flags page to resolve flags. Keep it private.
--   3. Supabase > SQL Editor > New query > paste this whole file > Run. Safe to run again later.
--   4. Supabase > Project Settings > API: copy the Project URL and the "anon public" key
--      into RX_NET in src/net.js. Both are meant to be public.
--
-- How it stays safe without logins: the tables have row level security on and NO policies, so the public key
-- cannot read or write them directly. The game only calls the functions below, and each one checks and trims
-- its input. A player proves a leaderboard row is theirs with a secret token that never leaves their browser
-- (it travels inside the save code, so moving to another device keeps the same row).

create table if not exists flags (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  qk text, cat text, topic text,
  q text, a text, picked text,
  reason text, note text,
  pid text, nick text, v int,
  resolved boolean not null default false
);
create index if not exists flags_open on flags (resolved, created_at desc);
create index if not exists flags_pid on flags (pid, created_at desc);

create table if not exists scores (
  pid text primary key,
  tok text not null,             -- secret that proves the row is yours
  name text not null,
  mastered int not null default 0,
  best int not null default 0,
  correct int not null default 0,
  earned bigint not null default 0,   -- total money made, all time
  week_key text,
  week_xp int not null default 0,
  v int,
  updated_at timestamptz not null default now()
);


create table if not exists admin (key text primary key);
insert into admin (key) values ('CHANGE-ME-to-a-long-random-phrase') on conflict do nothing;

alter table scores add column if not exists earned bigint not null default 0;
alter table flags enable row level security;
alter table scores enable row level security;
alter table admin enable row level security;
-- (no policies on purpose: the public key has no direct access to any table)
revoke all on flags, scores, admin from anon, authenticated;
revoke usage, select on sequence flags_id_seq from anon, authenticated;

create or replace function rx_is_admin(k text) returns boolean language sql security definer set search_path = public as $$
  select coalesce(length(k) >= 12 and k <> 'CHANGE-ME-to-a-long-random-phrase' and exists (select 1 from admin where key = k), false);
$$;

-- one flag from a player. At most 12 an hour per player id, and 600 an hour overall as a spam brake.
create or replace function submit_flag(p jsonb) returns boolean language plpgsql security definer set search_path = public as $$
declare who text := left(coalesce(p->>'pid', ''), 64);
begin
  if length(who) < 8 then return false; end if;
  if (select count(*) from flags where pid = who and created_at > now() - interval '1 hour') >= 12 then return false; end if;
  if (select count(*) from flags where created_at > now() - interval '1 hour') >= 600 then return false; end if;
  insert into flags (qk, cat, topic, q, a, picked, reason, note, pid, nick, v)
  values (left(p->>'qk', 80), left(p->>'cat', 40), left(p->>'topic', 120), left(p->>'q', 800), left(p->>'a', 400),
          left(p->>'picked', 400), left(coalesce(p->>'reason', 'other'), 20), left(p->>'note', 600), who,
          left(p->>'nick', 24), nullif(p->>'v', '')::int);
  return true;
end $$;

-- create or update the caller's leaderboard row: nickname and total money made. The number is clamped and can only go up.
drop function if exists push_score(text, text, text, int, int, int, text, int, int);
create or replace function push_score(p_pid text, p_tok text, p_name text, p_earned bigint, p_v int)
returns boolean language plpgsql security definer set search_path = public as $$
declare nm text := left(btrim(regexp_replace(coalesce(p_name, ''), '[[:cntrl:]]', '', 'g')), 24);
begin
  if length(coalesce(p_pid, '')) < 8 or length(coalesce(p_tok, '')) < 16 or length(nm) < 1 then return false; end if;
  insert into scores as s (pid, tok, name, earned, v)
  values (left(p_pid, 64), left(p_tok, 64), nm, greatest(0, least(coalesce(p_earned, 0), 10000000000000)), p_v)
  on conflict (pid) do update
    set name = excluded.name, earned = greatest(s.earned, excluded.earned), v = excluded.v, updated_at = now()
    where s.tok = excluded.tok;
  return exists (select 1 from scores where pid = left(p_pid, 64) and tok = left(p_tok, 64));
end $$;

create or replace function leave_board(p_pid text, p_tok text) returns boolean language plpgsql security definer set search_path = public as $$
begin
  delete from scores where pid = p_pid and tok = p_tok;
  return true;
end $$;

-- the public board: top 100 by total money made. The token is never returned.
drop function if exists get_board(text);
create or replace function get_board() returns table (pid text, name text, earned bigint)
language sql security definer set search_path = public as $$
  select s.pid, s.name, s.earned from scores s order by s.earned desc, s.updated_at asc limit 100;
$$;

-- admin only (needs your key): the live flag list, resolve or reopen a flag, and remove a player from the board
create or replace function admin_flags(k text) returns setof flags language plpgsql security definer set search_path = public as $$
begin
  if not rx_is_admin(k) then return; end if;
  return query select * from flags order by created_at desc limit 300;
end $$;

create or replace function resolve_flag(fid bigint, k text, done boolean) returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not rx_is_admin(k) then return false; end if;
  update flags set resolved = done where id = fid;
  return true;
end $$;

create or replace function admin_remove_player(k text, p_pid text) returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not rx_is_admin(k) then return false; end if;
  delete from scores where pid = p_pid;
  return true;
end $$;

revoke all on function rx_is_admin(text) from public, anon, authenticated;
grant execute on function submit_flag(jsonb) to anon;
grant execute on function push_score(text, text, text, bigint, int) to anon;
grant execute on function leave_board(text, text) to anon;
grant execute on function get_board() to anon;
grant execute on function admin_flags(text) to anon;
grant execute on function resolve_flag(bigint, text, boolean) to anon;
grant execute on function admin_remove_player(text, text) to anon;

create index if not exists scores_earned on scores (earned desc);
