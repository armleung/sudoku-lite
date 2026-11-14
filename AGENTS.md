# AGENTS.md

Guidance for AI agents working in this repo. `SPEC.md` is the approved v1 contract (scope + out-of-scope list); `README.md` is stale Vite boilerplate — ignore it.

## Commands

```bash
npm run dev        # dev server — app is served under the base path:
                   #   http://localhost:5173/sudoku-lite/   (not /!)
npm test           # vitest run — 46 engine/game-logic tests, no browser needed
npx vitest run src/lib/engine/solverAC3.test.ts   # single file
npx vitest run -t "test name"                     # single test
npx tsc -b       # typecheck (also runs as part of build)
npm run lint     # oxlint (NOT eslint)
npm run build && npm run preview
                 # production + PWA verification: http://localhost:4173/sudoku-lite/
                 # The service worker is NOT registered in dev mode — verify
                 # offline/install behavior only via preview or the deployed site.
```

## PWA & deployment (critical gotchas)

- `base: '/sudoku-lite/'` in `vite.config.ts` is load-bearing: the manifest (`start_url`/`scope`), service-worker navigation fallback, and GitHub Pages subpath must all agree. Wrong base → service worker silently fails → app is not installable.
- The manifest is **generated** by `vite-plugin-pwa` into `dist/`. Do not add a hand-written `public/manifest.webmanifest` — it would conflict.
- Deploy: push to `main` → `.github/workflows/deploy.yml` (tests + build + GitHub Pages). The repo is **private**; Pages source must be "GitHub Actions" (repo Settings → Pages). Site: `https://armleung.github.io/sudoku-lite/`.

## Architecture

- **No router.** The two views (`playing` | `selecting`) live in `GameContext.view`; overlays (pause/win) are driven by `GameContext.phase`.
- Provider nesting order in `src/App.tsx` matters: `BoardProvider > GameProvider > PreferencesProvider > TimerProvider` (Timer calls `useGame`).
- Board is `Cell[81]`, flat index = `y * 9 + x`. `BoardContext.history` is newest-first; `historyIndex: 0` = current; any new move discards the redo stack.
- Session init happens at module load in `src/App.tsx` (`SAVED = loadActiveGame()`): resumes a saved game **paused**, or opens a random easy puzzle.
- Keyboard shortcuts: `src/hooks/useGameKeyboard.ts` (1-9, arrows, Backspace/Delete, N notes, H hint, Esc pause/resume, mod-Z / mod-Shift-Z / mod-Y).
- **Known deviation:** the mistake counter (`GameContext.mistakes`) only ever increments; undo/redo do NOT decrement it, although SPEC §6.10 requires it to be undo-aware.

## Data & persistence

- Puzzle bank: `src/data/puzzles/<tier>.txt`, one 81-char line per puzzle (`0` = empty), imported via `?raw` and solved at module load by the AC3 solver (`src/lib/bank.ts`). An unsolvable line throws at load and breaks the whole app — validate puzzle lines before committing.
- Adding puzzles: append lines. Adding a tier: update the `Tier` union (`state/GameContext.tsx`), `RAW_BANKS`/`BANK`/`TIERS` (`lib/bank.ts`), the tier validation in `lib/storage.ts`, and `puzzleCards` in `App.tsx` (SelectScreen).
- localStorage keys are versioned (`sudoku_lite_v1_*`) in `src/lib/storage.ts`. Do not rename or repurpose v1 keys without writing a migration.
- Engine + `SudokuGame.ts` were lifted from the MIT-licensed super-sudoku project (read-only reference clone at `~/GitHub/sudoku` — never modify it).

## Toolchain quirks

- TypeScript 7 strict flags: `verbatimModuleSyntax` (use `import type` for types) and `erasableSyntaxOnly` (no enums/namespaces/parameter properties — use `as const` objects + type unions).
- oxlint warnings that are **intentional, do not "fix" them**: `only-export-components` in `src/state/*.tsx` (provider + hooks co-located by design) and `set-state-in-effect` in `TimerContext.tsx` (wall-clock anchor sync, lifted pattern).
- `lodash-es` is used on purpose (`throttle`, `groupBy`, `uniq`, `flatten`, `sortBy`) — keep lifts consistent.
- No i18n: UI strings are hardcoded English (deliberate, SPEC §6). No e2e suite yet (Playwright smoke test deferred, SPEC §6.21).
- Icons: source of truth is `design/icon-source-1024.png` (do not commit large PNGs to `public/`); `public/icon-{192,512,180}.png` are `sips -z N N` resizes. Regenerate all three from the source if it changes.
