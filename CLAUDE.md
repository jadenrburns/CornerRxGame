# Corner Rx (pharmacy tycoon study game)

`index.html` is the deployed game (GitHub Pages). It is **generated** from the files in `src/`. Edit `src/`, never `index.html`.

## Build and ship
1. Bump `GAME_VERSION` in `src/game.js`.
2. `cd src && sh build.sh && node --check game.full.js` (builds `src/corner-rx.html`).
3. Run the tests from `src/` (see below).
4. `cp src/corner-rx.html ../index.html` and commit both `src/` and `index.html`.

`build.sh` concatenates, in order: `head.html`, the three.js r128 CDN tag, then `bank.js pt3*.js pt4.js th3.js th553.js him.js lab.js ind.js drugs.js shop.js deck.js crowd.js world.js game.full.js` into one page. `ext.js` is spliced into `game.js` at the `/*@EXT@*/` marker to make `game.full.js`. Add new question files to the list in `build.sh`.

## Files
- Questions: `Q(category, difficulty 1-3, question, correct, [3 wrongs], explanation, section)` in `bank.js`. Category files: `pt3*.js`, `pt4.js` (PharmTox), `th3.js` (Therapeutics Exam 3, category `TH3`), `th553.js` (`T553`), `him.js` (`HIM`, Himothy's heart failure questions), `lab.js`, `ind.js`. Weekly drug questions are generated from `drugs.js`.
- Categories are listed in `CATS` near the top of `game.js` (also `FLAVOR` and the topic chips). A new category needs entries there.
- `world.js`: the 3D pharmacy (three.js) with patients, queue, sky events, Himothy. `crowd.js`: movement and collisions. `ext.js`: events (visitors, inspector, driver), Himothy game logic, blessing buff. `game.js`: everything else (cards, menus, saves, awards).
- Dev mode: add `?dev=1` to the URL for the "Test:" buttons (events, Himothy walk / ascension / angel flyover / smash).

## Shop
`shop.js` holds the shop item lists (wall paint, floors, technician uniforms with buffs, decorations, pharmacist hairstyles, cyborg parts). Purchases are saved in `S.store` (`own` ids, equipped `walls`, `floor`, `uni`, `deco`). The UI is the Shop tab on the Character screen (`shopHTML`, `shopBuy`, `shopUse` in `game.js`). `world.js` draws it: `api.setStore` (walls, floor, decorations), `api.setStaffLook` (uniforms), cyborg parts in `buildCosm`/the arm loop, hair styles 12 and 13. Uniform buffs: `uniBuff()` feeds `techRate` and `buffPay`, and only applies with at least one technician. Never rename a shipped item id. Prices and buffs are placeholders; tune them in `shop.js`. Test: `te41`.

## Power-ups, daily goals, recall and regulars
- Power-ups (`PW` in `game.js`): hint pill, second chance, reference binder. Counts in `S.pw`, bought in the Shop tab ("Power-ups", `shopBuy` kind `pow`), used from the buttons under each question. The old Reference Library upgrade is gone; saves are migrated in `load()` (cost refunded, `hintsLeft` becomes `pw.hint`). Its wall space on the left is now the mastery shelf.
- Daily goals (`ext.js`, `DG`, `dailyState`, `dailyTick`): three goals per local day, seeded by date, stored in `S.daily`. Menu entry "Daily goals" opens view `daily`.
- Recall patients (`S.recall`): a missed question returns about a day later with the same seed/body (same look). Regulars (`S.reg`): mastering a whole week unlocks one, who asks questions from that week. Both are rolled by `specialRoll` (passed to `World.init`), ignore topic filters on purpose, and the card shows a purple (recall) or gold (regular) banner (`spBanner`). `World.setMastery(list)` draws one jar per regular on the left-wall mastery shelf.
- Dev (`?dev=1`): "Test: recall patient", "Test: regular patient". Tests: `te44` (power-ups), `te45` (daily goals), `te46` (recall and regulars).
- CSS goes inside the `<style>` block in `head.html`, above `</style>`. Anything appended after the markup is not applied.

## Study sources
`Q(...)` takes an optional 8th argument `s`, a short source like `IBD lecture, slides 33, 36`. It shows as "Study source" under the explanation. `th3.js`'s `T(section, d, q, a, w, e, s)` passes it through. When adding questions from a lecture deck, cite the slide numbers. The extracted slide text is not stored in the repo; ask the user to attach the deck again.

## Tests
Node + Playwright, run from `src/`: `node te38.js` etc. They load `corner-rx.html` with `three-stub2.js` standing in for three.js (so the 3D logic runs but nothing is drawn). Useful ones: `te19`, `te26`, `te28`, `te37` (folder switches), `te38` (Himothy events), `te39` (weekly quiz achievements). Look for `errs []` in the output. A `Failed to load resource` console line is just the blocked CDN.

## Conventions
- Wrong answers must not be arguably correct (for example an indication shared with the right drug). Keep the correct answer from being the longest option every time.
- Questions use plain language; no em dashes.
- 3D can be checked visually in the build environment: the user attaches `three.min.js` (r128, from cdnjs), then run `THREE_JS=/path/three.min.js SHOT_DIR=/some/dir node shot3d.js <dir-arg> dev-him-asc 12 900` from `src/` (args: ignored, dev button id, frame count, ms between frames; the first arg is only the scratchpad fallback path). It uses headless Chromium with SwiftShader. The sandbox cannot download three.js itself. Still confirm by playing with `?dev=1`.
- Saves live in the browser (`localStorage`); keep save-format changes backward compatible.

## Confidence and SM-2 review
- After picking an answer the card shows "How sure are you?" (Guess / Pretty sure / Certain, keys 1 to 3) before the result. `answer(idx, conf)` in `game.js` gates on `confNeeded()` (skipped for generated calc, Karen, Jim, elder, lab, callers, events, visitors, and when `S.set.conf === false`). `cur.pend` holds the pending pick; `confBar()` draws the buttons.
- `ext.js` has the SM-2 code: `srGrade` (grade 0 to 5 from correctness and confidence), `srUpdate` (fields on `S.mastery[k]`: `n` reps, `d` interval days, `ef` ease, `due` timestamp, `cw` certain-but-wrong flag, `gr` consecutive guess-rights), `srSeed` (starts older saves from their box), `reviewDue` (uses `due`, falls back to the old `iv`/`t` ladder), `calibNote` (accuracy by confidence, `S.cf`). The old Leitner `box` still drives mastery (>= 2); a guess-right does not raise it unless it happens twice in a row.
- Modes (`MODES`): Smart mix (`mixed`) and Individual review (`review`) use the confidence prompt and SM-2 (`srOn()`); Review misses and New only do not. The old Even shuffle / Linear mode (`even`) was removed, and `load()` moves saves that still have it to Smart mix. Individual review serves only `srDue` questions from every topic (ignores topic filters, no calc), shows a "Nothing due" card when empty, and `dueCount()` feeds the chip and the progress note. The prompt is skipped when the question was already answered today (`askedToday`, `m.lt`), so same-day repeats are quick practice; the first look and later reviews still ask. Smart mix weights `cw` questions up. An extra right answer before the review date (`m.due` in the future) does not lengthen the interval (found by the mode simulation); a wrong one still resets it. Tests: `te47`, `te48`. Other tests load `corner-rx.html?noconf=1` to skip the prompt.
