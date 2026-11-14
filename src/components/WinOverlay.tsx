import {formatDuration} from "../utils/format";

export function WinOverlay({
  seconds,
  mistakes,
  onNewGame,
}: {
  seconds: number;
  mistakes: number;
  onNewGame: () => void;
}) {
  return (
    <div
      data-testid="win-overlay"
      className="absolute inset-0 z-30 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm dark:bg-black/80"
    >
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        <div className="text-3xl" aria-hidden>
          🎉
        </div>
        <div className="text-2xl font-bold">Congrats, you won!</div>
        <div className="text-slate-600 dark:text-slate-300">
          Time: {formatDuration(seconds)} · Mistakes: {mistakes}
        </div>
        {mistakes === 0 && (
          <div
            data-testid="no-mistakes-badge"
            className="rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-700 dark:bg-teal-900/50 dark:text-teal-300"
          >
            No mistakes
          </div>
        )}
        <button
          type="button"
          data-testid="new-game"
          onClick={onNewGame}
          className="mt-2 rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
        >
          New game
        </button>
      </div>
    </div>
  );
}
