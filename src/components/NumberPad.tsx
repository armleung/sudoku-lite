import {useGameActions} from "../hooks/useGameActions";
import {useBoard} from "../state/BoardContext";
import {useGame} from "../state/GameContext";
import {usePreferences} from "../state/PreferencesContext";

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function NumberPad() {
  const {placeNumber} = useGameActions();
  const {state: board} = useBoard();
  const {state: game} = useGame();
  const {state: prefs} = usePreferences();

  // How many times each digit is currently placed on the board (trivial O(81)).
  const counts = Array<number>(10).fill(0);
  for (const cell of board.current) {
    if (cell.number > 0) counts[cell.number]++;
  }

  const activeCell = game.activeCell
    ? board.current.find((c) => c.x === game.activeCell!.x && c.y === game.activeCell!.y)
    : undefined;

  return (
    <div className="grid grid-cols-9 gap-1 sm:gap-1.5">
      {NUMBERS.map((n) => {
        const count = counts[n];
        const complete = count === 9;
        const excess = count > 9;
        const isNote = game.notesMode && activeCell?.notes.includes(n) === true;
        return (
          <button
            key={n}
            type="button"
            aria-label={`Set ${n}`}
            data-testid={`number-${n}`}
            disabled={game.phase === "won"}
            onClick={() => placeNumber(n)}
            className={`relative flex h-12 items-center justify-center rounded-lg text-xl font-medium shadow-sm ring-1 transition-colors ${
              excess
                ? "bg-red-400 text-white ring-red-400 dark:bg-red-400"
                : complete
                  ? "bg-slate-300 text-slate-500 ring-slate-300 dark:bg-slate-700 dark:text-slate-400 dark:ring-slate-600"
                  : isNote
                    ? "bg-sky-500 text-white ring-sky-500"
                    : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 active:bg-teal-100 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700 dark:active:bg-teal-900/50"
            } ${game.phase === "won" ? "opacity-50" : ""}`}
          >
            {n}
            {prefs.showOccurrences && count > 0 && (
              <span
                data-testid={`occurrences-${n}`}
                className="absolute bottom-0.5 right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-teal-700 px-0.5 text-[9px] font-bold text-white sm:bottom-1 sm:right-1 sm:h-4 sm:min-w-4 sm:text-[10px]"
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
