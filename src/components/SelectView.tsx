import {useState} from "react";
import type {SimpleSudoku} from "../lib/engine/types";
import type {Tier} from "../state/GameContext";


/** Tiny read-only board used on the select-game screen. */
export function MiniBoard({givens}: {givens: SimpleSudoku}) {
  return (
    <div className="grid aspect-square w-full grid-cols-9 overflow-hidden rounded-md border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900">
      {givens.flat().map((n, i) => (
        <div
          key={i}
          className={n !== 0 ? "bg-teal-600" : "bg-transparent dark:bg-slate-900"}
        />
      ))}
    </div>
  );
}

interface SelectViewProps {
  tiers: Tier[];
  puzzles: Record<Tier, {index: number; givens: SimpleSudoku}[]>;
  saved: {tier: Tier; puzzleIndex: number; seconds: number; mistakes: number} | null;
  onPlay: (tier: Tier, index: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function SelectView({tiers, puzzles, saved, onPlay, onContinue, onBack}: SelectViewProps) {
  const [activeTier, setActiveTier] = useState<Tier>(tiers[0]);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col gap-4 p-4 sm:max-w-lg">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Select Game</h1>
        <button
          type="button"
          onClick={onBack}
          data-testid="back"
          className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
        >
          ◀ Back
        </button>
      </header>

      {saved && (
        <button
          type="button"
          data-testid="continue-card"
          onClick={onContinue}
          className="rounded-lg bg-teal-50 p-3 text-left shadow-sm ring-1 ring-teal-200 transition-colors hover:bg-teal-100 dark:bg-teal-900/30 dark:ring-teal-800"
        >
          <div className="text-sm font-semibold capitalize text-teal-800 dark:text-teal-200">
            Continue: {saved.tier} #{saved.puzzleIndex + 1}
          </div>
          <div className="text-xs text-teal-700 dark:text-teal-300">
            {Math.floor(saved.seconds / 60)}:{String(saved.seconds % 60).padStart(2, "0")} played ·{" "}
            {saved.mistakes} mistakes
          </div>
        </button>
      )}

      <div className="flex gap-1">
        {tiers.map((tier) => (
          <button
            key={tier}
            type="button"
            onClick={() => setActiveTier(tier)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold capitalize transition-colors ${
              tier === activeTier
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
            }`}
          >
            {tier}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3" data-testid={`puzzles-${activeTier}`}>
        {puzzles[activeTier].map((puzzle) => (
          <button
            key={puzzle.index}
            type="button"
            data-testid={`puzzle-${puzzle.index}`}
            onClick={() => onPlay(activeTier, puzzle.index)}
            className="rounded-lg bg-white p-2.5 text-left shadow-sm ring-1 ring-slate-200 transition-colors hover:ring-teal-400 dark:bg-slate-800 dark:ring-slate-700"
          >
            <MiniBoard givens={puzzle.givens} />
            <div className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              #{puzzle.index + 1}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
