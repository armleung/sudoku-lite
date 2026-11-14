# Sudoku Lite — Specification

Status: **Approved contract** (agreed with owner on 2026-11-15)
This document is the single source of truth for the v1 build. Anything not listed here is out of scope.

---

## 1. Product overview

Sudoku Lite is a personal, phone-first Sudoku Progressive Web App.

- **Primary use case**: install to the phone home screen and play fully offline.
- **Secondary use case**: play in any desktop browser (keyboard support included).
- **Non-goals**: accounts, cloud sync, sharing with other users, monetization, app-store distribution.
- **License**: MIT.

### Reference codebase (read-only)

A clone of `TN1ck/super-sudoku` (MIT, 156★) lives at `~/GitHub/sudoku`. It is a **read-only reference** — never modify it. From it we lift:

| Asset | From (super-sudoku) | How it lands here |
|---|---|---|
| Sudoku engine | `src/lib/engine/` (AC3 solver, backtracking solver + solution counter, generator, seeded random, utilities, types) | Copied into `src/lib/engine/`, adapted imports, kept MIT attribution comment |
| Game logic helpers | `src/lib/game/SudokuGame.ts` (conflicts, highlights, note positions, isSolved) | Copied, trimmed (no circle-menu path drawing needed) |
| Engine unit tests | `src/lib/engine/*.test.ts`, `src/lib/game/*.test.ts` | Copied, run under Vitest |
| State patterns | Context + `useReducer` providers | Recreated per §5 (Game/Board/Timer/Preferences) |
| PWA plumbing | `vite-plugin-pwa` Workbox setup in `vite.config.ts` | Recreated, reconfigured for GitHub Pages base path |

The reference's UI, i18n, collections, URL-sharing, and tooling are **not** lifted.

---

## 2. Goals & success criteria

1. **Installable on phone**: Android Chrome shows the install banner; iPhone Safari gets an in-app instruction overlay (no auto-prompt on iOS).
2. **Fully offline**: after one online visit, the app launches, lists puzzles, and plays end-to-end with no network.
3. **Never lose a game**: closing/reloading the browser mid-game restores the exact board, timer, and mistake count.
4. **Engine correctness**: all lifted engine unit tests pass.
5. **Deployed**: live and installable at `https://armleung.github.io/sudoku-lite`.

---

## 3. Tech stack (locked)

| Concern | Choice | Notes |
|---|---|---|
| Build tool | Vite 8 | `base: '/sudoku-lite/'` for GitHub Pages subpath — **critical**, a wrong base silently breaks the service worker scope and installation |
| UI framework | React 19 | Functional components + hooks |
| Language | TypeScript (latest stable) | Strict mode. If the very latest major causes toolchain friction, pin the previous major — no architectural difference |
| Styling | Tailwind CSS 4 | CSS-first config; `@custom-variant dark (&:where(.dark, .dark *));` for class-based dark mode |
| State | React Context + `useReducer` | Four providers, see §5. No Redux/Zustand |
| Routing | **None** | Two views (`playing`, `selecting`) held in game context; modals are components. No URL state, no hash routing |
| PWA | vite-plugin-pwa 2.0 | Manifest + Workbox service worker generated at build. `registerType: 'autoUpdate'`, precache all build assets, navigation fallback to `index.html` |
| Unit tests | Vitest | Engine tests now (§8). Playwright e2e is explicitly deferred — add one smoke test only after v1 is running |
| Lint/format | ESLint + Prettier | Sensible defaults from `npm create vite` |
| Deploy | GitHub Pages via GitHub Actions | Publish `dist/` to `main` (or `gh-pages` — decide at build step 9; action template handles both) |
| i18n | **None** | English only, hardcoded strings |

---

## 4. Puzzle data

### 4.1 Bank format

- One puzzle per line, 81 characters: digits 1–9, `0` = empty cell. Row-major, top-left to bottom-right.
- Static files in `src/data/puzzles/<tier>.txt`, imported with Vite `?raw` (same approach as the reference → ships inside the JS bundle → zero runtime fetches → fully offline).
- Solution is **not** stored; it is computed at load time by the AC3 solver (fast, and gives hints + wrong-entry checks for free).
- A future big bank (hundreds per tier) drops in as the same file format. No code change required.

### 4.2 Sample data (v1)

| Tier | Puzzle (81 chars) |
|---|---|
| `easy` | `534920700060007309900000010008700000496803002721594806000200940800046100003000000` |
| `medium` | `502000000003400000000005093700006002000003608008021070870032504106080020400070300` |

Both are taken from the reference's verified puzzle bank.

### 4.3 Generation — out of scope (now)

The engine's generator module (`generate.ts`, `seededRandom.ts`) is still **lifted and unit-tested** (self-contained, MIT, and it is the tool for the owner's later "generate my own bank" goal), but v1 ships **no** generation UI and no generation dev script.

---

## 5. Architecture

### 5.1 State: four contexts

**GameContext** — the game session and machine:
```
state: {
  view: 'playing' | 'selecting'
  tier: 'easy' | 'medium'
  puzzleIndex: number              // position within the tier bank
  phase: 'running' | 'paused' | 'won'
  activeCell?: {x, y}
  notesMode: boolean
  mistakes: number                 // see §6.10
  secondsPlayed: number
}
```
Actions: `NEW_GAME(tier, puzzleIndex)`, `SELECT_TIER`, `SELECT_PUZZLE`, `PAUSE`, `RESUME`, `WIN`, `RESTART`, `SELECT_CELL`, `TOGGLE_NOTES_MODE`, `BUMP_MISTAKE`, `UPDATE_TIMER`, `SHOW_VIEW`.
Undo/redo of `mistakes` is free: the counter is part of the board history entry (§5.2), so `UNDO`/`REDO` restore it.

**BoardContext** — the 81-cell board + history (reference's `SudokuContext` pattern):
```
state: { current: Cell[]; history: Cell[][]; historyIndex: number }
Cell: { x, y, number, notes: number[], initial: boolean, solution: number }
```
Actions: `SET_NUMBER`, `SET_NOTES`, `CLEAR_NUMBER`, `CLEAR_CELL`, `GET_HINT`, `UNDO`, `REDO`, `SET_BOARD`.
Rules:
- `initial` cells (givens) are immutable to every mutating action.
- Setting a number clears that cell's notes **and** removes that digit from the notes of all cells sharing its row/column/box (smart cleanup — lifted from reference `fixSudokuNotes`).
- Undo/redo walk the history stack; each history entry also carries the mistake count at that moment.

**TimerContext** — display timer ticking every 200 ms while `phase === 'running'`; persists whole seconds into GameContext once per second (lifted pattern).

**PreferencesContext** — persisted user settings (lifted pattern):
```
{ darkMode: boolean | 'system', showWrongEntries: boolean,
  showConflicts: boolean, showOccurrences: boolean }
```
`darkMode` default: **follow system**; user toggle persists an explicit choice.

### 5.2 Component map

| Component | Responsibility |
|---|---|
| `App` | Error boundary (reload prompt) + `OfflineIndicator` + context providers + view switch |
| `GameView` | Header (tier #n · timer · mistakes · controls) + board + number pad + settings |
| `SelectView` | Tier tabs (Easy/Medium) + "Continue in progress" card (when a saved game exists) + puzzle card(s) per tier |
| `SudokuBoard` / `SudokuGrid` / `SudokuCell` | Rendered grid: given vs entered styling, active-cell ring, row/col/box highlight, same-number highlight, conflict + wrong-entry styling, notes in 3×3 cell positions |
| `NumberPad` | 1–9 buttons (with occurrence badges when enabled) + Erase + Undo + Redo + Note toggle + Hint |
| `SettingsPanel` | Dark mode + the three highlight toggles |
| `WinOverlay` | 🎉 · time · mistakes · "no mistakes" badge (if applicable) · New game |
| `PauseOverlay` | Centered Continue button (board is blanked underneath) |
| `InstallHint` | iPhone-only "Share → Add to Home Screen" card; auto-hides when `display-mode: standalone` |
| `OfflineIndicator` | Thin banner when `navigator.onLine` is false |

### 5.3 Interactions

**Touch**
- Tap empty cell → select (row/col/box + same-number highlights update)
- Tap digit on pad → place (or add note when notes mode on); tapping the same digit again erases
- Erase button / tap the selected cell's digit again → clear number (keep notes)
- Long-press not required anywhere

**Keyboard** (desktop; reference's set, minus copy/paste notes)
| Key | Action |
|---|---|
| `1`–`9` | Place / add note |
| `Backspace` / `Delete` | Erase number |
| Arrow keys | Move selection |
| `N` | Toggle notes mode |
| `H` | Hint on selected cell |
| `Esc` | Pause / resume |
| `Ctrl/Cmd+Z` / `Ctrl/Cmd+Y` | Undo / redo |

**Cell interaction details**
- Given numbers: bold, neutral color; user numbers: teal
- Wrong entry (when enabled): red text
- Conflict (when enabled): red cell background
- Active cell: outline ring; row/col/box: subtle tint; same number: soft highlight
- Number pad badges (when enabled): show how many of that digit remain to be placed (0 = dimmed)

### 5.4 Persistence (localStorage)

Versioned keys from day one (future migrations follow the reference's proven pattern):

| Key | Contents |
|---|---|
| `sudoku_lite_v1_active` | Stringified puzzle of the in-progress game (81 chars) |
| `sudoku_lite_v1_state_<puzzle>` | JSON: `{ board: Cell[], mistakes, secondsPlayed, phase }` for that puzzle |
| `sudoku_lite_v1_prefs` | JSON: PreferencesContext state |

- Save is throttled to every 2 s while running (reference pattern).
- On app load: if an active game exists → `SelectView` shows "Continue in progress"; opening it restores board, timer, mistakes, phase (paused).
- Win clears that puzzle's saved state (game is over; replay = fresh start).

---

## 6. Feature contract (v1)

Numbered to match the approved checklist.

### Board & input
1. 9×9 grid; given numbers immutable; tap or keyboard cell selection
2. Number pad (touch) + keyboard 1–9 entry; Erase button + Backspace
3. Pencil notes toggle (key `N`); notes rendered in 3×3 positions inside the cell; smart cleanup on number placement
4. Undo/Redo buttons + `Ctrl/Cmd+Z` / `Ctrl/Cmd+Y`
5. Hint (button + key `H`): fills the **selected** cell with its correct value (one cell per hint; no auto-hint)
6. Toggles (persisted): highlight wrong entries · highlight conflicts · number-occurrence badges on pad. Always on: active-cell row/col/box highlight · same-number highlight

### Game flow
7. Timer in header (H:MM:SS), starts on game start, survives reload
8. Pause/Resume (button + `Esc`); auto-pause when the tab becomes hidden; board **blanked** while paused (anti-cheat, reference behavior)
9. Restart button with confirmation dialog
10. Mistake counter in header: +1 when a placed value ≠ that cell's solution; undo of the offending placement decrements; "No mistakes" badge on the win overlay when counter is 0
11. Win overlay: 🎉 · final time · mistake count · optional no-mistake badge · "New game"

### Puzzle selection
12. Two tiers with puzzles: Easy, Medium (1 sample puzzle each in v1; file-based bank, §4)
13. New game: pick tier → random puzzle from that tier. "Continue in progress" card when a saved game exists
14. Autosave board + game state every 2 s (throttled), versioned storage key (§5.4)

### Settings
15. Dark mode (default: follow system) + the three highlight toggles. Nothing else.

### PWA
16. **Installable**:
    - Manifest: `name: "Sudoku Lite"`, `short_name: "Sudoku"`, `display: standalone`, `start_url: /sudoku-lite/`, `scope: /sudoku-lite/`, `background_color: #1F2937`, `theme_color: #1F2937`
    - Icons: 192×192 + 512×512 **maskable** PNGs (`purpose: "any maskable"`), 180×180 `apple-touch-icon`, favicons — generated artwork: minimal 9×9 grid with a few filled cells on teal `#0d9488`, content within the central 60% safe zone
    - Android: browser install banner (standard, no custom UI)
    - iOS: in-app instruction overlay ("Open in Safari → Share → Add to Home Screen"), shown once per browser session, auto-hidden when running in standalone mode
17. **Offline**: Workbox service worker precaches the entire build (all JS/CSS/HTML/icons — the puzzle bank is inside the JS bundle, so offline includes puzzle selection); navigation requests fall back to `index.html`
18. **Offline indicator**: thin top banner while offline
19. **GitHub Pages**: deployed at `https://armleung.github.io/sudoku-lite` via GitHub Actions; Vite `base` matches; service worker verified after deploy (install → airplane mode → full play)

### Testing
20. Engine unit tests (Vitest), lifted from the reference and kept green:
    - AC3 solver (solve + iteration reporting)
    - Backtracking solver / `countSolutions` + `isSudokuUnique`
    - `SudokuGame` helpers: `isSolved`, `correct`, `conflictingFields`, note positions
    - Utility round-trips: `stringifySudoku` / `parseSudoku`
    - (Generator tests come along with the generator module, §4.3)
21. Playwright e2e: **deferred**. After v1 runs, add one smoke test (enter a full solution → win overlay → state cleared).

### Out of scope — explicit cut list
Circle menu · auto-generated candidate notes · copy/paste notes · custom collections · create-your-own-puzzle (and its uniqueness web worker — the `isSudokuUnique` utility is still lifted into the engine for the future) · shareable puzzle URLs / URL↔board sync · i18n / language selector · daily puzzle · streaks · per-puzzle solve history / best times · achievements · push notifications · sound effects · haptics / vibration · first-run help card · "new version available" toast.

---

## 7. Branding

| Item | Value |
|---|---|
| App name (manifest, home screen) | Sudoku Lite |
| Background / theme color | `#1F2937` (dark slate) |
| Accent | `#0d9488` (teal-600) |
| Light background | white / `#f8fafc` family |
| Dark background | slate-900 family |
| Icon | minimal 9×9 grid, some cells filled, on teal; maskable-safe (central 60%) |

Header title on the app: **Sudoku Lite**.

---

## 8. Build order & checkpoints

Each step ends in something openable locally (`npm run dev`):

| # | Step | Done when |
|---|---|---|
| 1 | Scaffold: Vite 8 + React 19 + TS + Tailwind 4 + vite-plugin-pwa + Vitest; `base` set; ESLint/Prettier | `npm run dev` shows a placeholder page; `npm test` runs green |
| 2 | Engine: lift `lib/engine` + `SudokuGame` + unit tests | All engine tests green |
| 3 | Board UI: grid, cells, notes, highlights, number pad, controls | ⏸ **Checkpoint: playable board** (select, place, note, undo, erase — no persistence yet). Review with owner |
| 4 | Contexts: Game (with mistake counter), Board, Timer, Preferences wired to the board | Timer runs; mistake counter updates; settings toggles affect rendering |
| 5 | Persistence: throttled autosave + restore + versioned keys | Reload mid-game restores board/timer/mistakes exactly |
| 6 | Views: `SelectView` (tiers + continue card), `WinOverlay`, `PauseOverlay` (blanked board), `OfflineIndicator`, keyboard shortcut set | ⏸ **Checkpoint: full game loop** (select → play → pause → resume → win → restart → reload-restore). Review with owner |
| 7 | PWA: manifest, generated icons, service worker verified, `InstallHint` overlay | Lighthouse PWA installable; offline test passes in dev |
| 8 | Sample data files: `easy.txt` + `medium.txt` with §4.2 puzzles | Playable via the real bank (replaces step-3 hardcode) |
| 9 | GitHub Actions deploy → GitHub Pages; on-phone verification (install on Android + iPhone, airplane-mode play) | ⏸ **Checkpoint: installed on phone**. Review with owner |

Post-checkpoint backlog (not v1): owner-generated puzzle bank + dev script, Playwright smoke e2e, "next puzzle" cycling when a bank has many entries.

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| GitHub Pages base path wrong → service worker never registers → not installable | `base` set in scaffold step; **explicit install + offline test is part of checkpoint 9** (both Android and iPhone) |
| Lifted engine has hidden coupling to reference app (collections, i18n, lodash) | Step 2 includes a compile-and-test gate before any UI work; lodash usage is minimal (`groupBy`, `uniq`, `uniqBy`, `flatten`) — replace with tiny local helpers if import friction appears |
| iOS install is manual (no auto-prompt) | `InstallHint` overlay covers it; verified in checkpoint 9 |
| localStorage quota as owner adds many custom saved states in the future | Versioned keys + per-puzzle keys already isolate data; IndexedDB migration is a known later step (documented here, not scheduled) |
| Tailwind v4 vs reference's v3 class drift when lifting components | UI is **not** lifted wholesale; only patterns are. Copied snippets get restyled deliberately |
| Latest TypeScript major + toolchain incompatibility | Pin previous major at scaffold time; no feature loss |

---

## 10. Decisions log (how this spec was reached)

| Decision | Choice | Rationale |
|---|---|---|
| Build vs fork | Fresh scaffold; super-sudoku kept read-only at `~/GitHub/sudoku` | Owner choice (Q1); engine/state patterns still reused from reference |
| Languages | English only | Personal app (Q2) |
| Feature base | Reference inventory, kept: core board + notes + hints + highlights + tiers + autosave + PWA; cut: circle menu, auto-notes, copy/paste notes, custom collections, puzzle creator, share URLs, i18n | Q3 agreement |
| State framework | React 19 + Context/useReducer | Maximizes lift-ability from reference (Q12) |
| CSS | Tailwind 4 | Lift-ability + speed (Q13) |
| PWA | vite-plugin-pwa | Reference-proven, low maintenance (Q14) |
| Testing | Vitest now, e2e later | Engine is the risk; UI scope is slim (Q15) |
| Puzzle data | 2 sample puzzles, file bank; generation later by owner | Q7/Q16 |
| Daily/streak | Cut | Q9 |
| Mistake counter | Yes, undo-aware, no cap, no-mistake badge | Q10 |
| Sound/haptics/help card | All cut | Q11 |
| Host | GitHub Pages | Q8 |
| Branding | "Sudoku Lite", slate + teal, system-following dark mode, generated icons | Q17 |
