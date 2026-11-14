import {useGameActions} from "../hooks/useGameActions";
import {useGame} from "../state/GameContext";

export function Controls() {
  const {erase, hint, toggleNotes, undo, redo, canUndo, canRedo} = useGameActions();
  const {state: game} = useGame();
  const won = game.phase === "won";

  const base =
    "flex h-12 items-center justify-center gap-1 rounded-lg bg-white text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50 active:bg-teal-100 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700";
  const activeStyle = "bg-teal-600 text-white ring-teal-600 hover:bg-teal-600 active:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-600";

  return (
    <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
      <button
        type="button"
        aria-label="Erase"
        data-testid="erase"
        className={base}
        onClick={erase}
        disabled={won}
      >
        Erase
      </button>
      <button
        type="button"
        aria-label="Toggle notes"
        aria-pressed={game.notesMode}
        disabled={won}
        data-testid="notes"
        className={`${base} ${game.notesMode ? activeStyle : ""}`}
        onClick={toggleNotes}
      >
        ✎ Notes
      </button>
      <button
        type="button"
        aria-label="Hint"
        data-testid="hint"
        className={base}
        onClick={hint}
        disabled={won}
      >
        Hint
      </button>
      <button
        type="button"
        aria-label="Undo"
        data-testid="undo"
        className={base}
        onClick={undo}
        disabled={won || !canUndo}
      >
        Undo
      </button>
      <button
        type="button"
        aria-label="Redo"
        data-testid="redo"
        className={base}
        onClick={redo}
        disabled={won || !canRedo}
      >
        Redo
      </button>
    </div>
  );
}
