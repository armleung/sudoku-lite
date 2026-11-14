import {useGameActions} from "../hooks/useGameActions";

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function NumberPad() {
  const {placeNumber} = useGameActions();

  return (
    <div className="grid grid-cols-9 gap-1 sm:gap-1.5">
      {NUMBERS.map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Set ${n}`}
          data-testid={`number-${n}`}
          onClick={() => placeNumber(n)}
          className="flex h-12 items-center justify-center rounded-lg bg-white text-xl font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50 active:bg-teal-100 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700 dark:active:bg-teal-900/50"
        >
          {n}
        </button>
      ))}
    </div>
  );
}
