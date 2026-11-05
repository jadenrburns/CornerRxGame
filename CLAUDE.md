# Corner Rx (pharmacy tycoon study game)

`index.html` is the deployed game (GitHub Pages). It is **generated** from the files in `src/`. Edit `src/`, never `index.html`.

## Build and ship
1. Bump `GAME_VERSION` in `src/game.js`.
2. `cd src && sh build.sh && node --check game.full.js` (builds `src/corner-rx.html`).
3. Run the tests from `src/` (see below).
4. `cp src/corner-rx.html ../index.html` and commit both `src/` and `index.html`.

`build.sh` concatenates, in order: `head.html`, the three.js r128 CDN tag, then `bank.js pt3*.js pt4.js th3.js th553.js him.js lab.js ind.js drugs.js deck.js crowd.js world.js game.full.js` into one page. `ext.js` is spliced into `game.js` at the `/*@EXT@*/` marker to make `game.full.js`. Add new question files to the list in `build.sh`.

## Files
- Questions: `Q(category, difficulty 1-3, question, correct, [3 wrongs], explanation, section)` in `bank.js`. Category files: `pt3*.js`, `pt4.js` (PharmTox), `th3.js` (Therapeutics Exam 3, category `TH3`), `th553.js` (`T553`), `him.js` (`HIM`, Himothy's heart failure questions), `lab.js`, `ind.js`. Weekly drug questions are generated from `drugs.js`.
- Categories are listed in `CATS` near the top of `game.js` (also `FLAVOR` and the topic chips). A new category needs entries there.
- `world.js`: the 3D pharmacy (three.js) with patients, queue, sky events, Himothy. `crowd.js`: movement and collisions. `ext.js`: events (visitors, inspector, driver), Himothy game logic, blessing buff. `game.js`: everything else (cards, menus, saves, awards).
- Dev mode: add `?dev=1` to the URL for the "Test:" buttons (events, Himothy walk / ascension / angel flyover / smash).

## Tests
Node + Playwright, run from `src/`: `node te38.js` etc. They load `corner-rx.html` with `three-stub2.js` standing in for three.js (so the 3D logic runs but nothing is drawn). Useful ones: `te19`, `te26`, `te28`, `te37` (folder switches), `te38` (Himothy events), `te39` (weekly quiz achievements). Look for `errs []` in the output. A `Failed to load resource` console line is just the blocked CDN.

## Conventions
- Wrong answers must not be arguably correct (for example an indication shared with the right drug). Keep the correct answer from being the longest option every time.
- Questions use plain language; no em dashes.
- 3D has not been verified visually from the build environment; check changes by playing with `?dev=1`.
- Saves live in the browser (`localStorage`); keep save-format changes backward compatible.
