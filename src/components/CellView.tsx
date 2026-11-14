import {memo} from "react";
import type {Cell} from "../lib/engine/types";

interface CellViewProps {
  cell: Cell;
  active: boolean;
  highlighted: boolean; // same row/column/box as the active cell
  sameNumber: boolean; // matches the active cell's number
  conflicting: boolean; // part of a duplicate path
  wrong: boolean; // user number differs from the solution
  onSelect: (cell: Cell) => void;
}

function noteGridPosition(n: number): {col: number; row: number} {
  // 1..3 top row, 4..6 middle row, 7..9 bottom row
  return {col: ((n - 1) % 3) + 1, row: Math.floor((n - 1) / 3) + 1};
}

export const CellView = memo(function CellView({
  cell,
  active,
  highlighted,
  sameNumber,
  conflicting,
  wrong,
  onSelect,
}: CellViewProps) {
  const {x, y} = cell;

  const borderRight =
    x < 8 ? (x % 3 === 2 ? "border-r-2" : "border-r") : "";
  const borderBottom =
    y < 8 ? (y % 3 === 2 ? "border-b-2" : "border-b") : "";
  const borderTone = "border-slate-300 dark:border-slate-600";

  const background = conflicting
    ? "bg-red-100 dark:bg-red-950/60"
    : sameNumber
      ? "bg-teal-100 dark:bg-teal-900/50"
      : highlighted
        ? "bg-slate-100 dark:bg-slate-800"
        : "bg-transparent";

  return (
    <button
      type="button"
      aria-label={`Cell row ${y + 1} column ${x + 1}${
        cell.number === 0 ? ", empty" : `, value ${cell.number}`
      }`}
      data-testid={`cell-${x}-${y}`}
      data-cell-active={active || undefined}
      onClick={() => onSelect(cell)}
      className={`relative flex select-none items-center justify-center border-0 bg-transparent p-0 ${borderRight} ${borderBottom} ${borderTone} ${background} ${
        active ? "z-10 ring-2 ring-inset ring-teal-500" : ""
      }`}
    >
      {cell.number !== 0 && (
        <span
          className={`text-xl sm:text-2xl ${
            cell.initial ? "font-bold text-slate-800 dark:text-slate-100" : ""
          } ${!cell.initial && wrong ? "text-red-600 dark:text-red-400" : ""} ${
            !cell.initial && !wrong ? "text-teal-700 dark:text-teal-400" : ""
          }`}
        >
          {cell.number}
        </span>
      )}
      {cell.number === 0 && cell.notes.length > 0 && (
        <span className="absolute inset-0.5 grid grid-cols-3 grid-rows-3 sm:inset-1">
          {cell.notes.map((n) => {
            const pos = noteGridPosition(n);
            return (
              <span
                key={n}
                style={{gridColumn: pos.col, gridRow: pos.row}}
                className="flex items-center justify-center text-[10px] text-slate-400 sm:text-xs dark:text-slate-500"
              >
                {n}
              </span>
            );
          })}
        </span>
      )}
    </button>
  );
});
