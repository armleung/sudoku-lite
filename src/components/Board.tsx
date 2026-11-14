import {flatten} from "lodash-es";
import {useMemo} from "react";
import SudokuGame from "../lib/game/SudokuGame";
import type {Cell} from "../lib/engine/types";
import {squareIndex} from "../lib/engine/utility";
import {useBoard} from "../state/BoardContext";
import {useGame} from "../state/GameContext";
import {CellView} from "./CellView";

export function Board() {
  const {state: board} = useBoard();
  const {state: game, selectCell} = useGame();
  const cells = board.current;

  const active = game.activeCell
    ? cells.find((c) => c.x === game.activeCell!.x && c.y === game.activeCell!.y)
    : undefined;

  // Conflict paths: all cells lying between duplicate numbers in a row or column.
  // Lifted computation from super-sudoku (MIT).
  const conflictCells = useMemo(() => {
    const conflicting = SudokuGame.conflictingFields(cells);
    const uniquePaths = SudokuGame.uniquePaths(
      flatten(
        conflicting.map((c) => SudokuGame.getPathsFromConflicting(c, cells)),
      ),
    );
    const pathCells = flatten(
      uniquePaths.map((p) => SudokuGame.getPathBetweenCell(p.from, p.to)),
    );
    const set = new Set(pathCells.map((p) => p.y * 9 + p.x));
    return (c: Cell) => set.has(c.y * 9 + c.x);
  }, [cells]);

  return (
    <div
      data-testid="sudoku-board"
      role="grid"
      aria-label="Sudoku board"
      className="grid aspect-square w-full grid-cols-9 grid-rows-9 overflow-hidden rounded-lg border-2 border-slate-400 bg-white shadow-sm dark:border-slate-500 dark:bg-slate-900"
    >
      {cells.map((cell) => {
        const inSquare =
          active !== undefined &&
          squareIndex(cell.x, cell.y) === squareIndex(active.x, active.y);
        const highlighted =
          active !== undefined && (cell.x === active.x || cell.y === active.y || inSquare);
        const sameNumber =
          active !== undefined &&
          active.number !== 0 &&
          cell.number === active.number &&
          cell !== active;
        return (
          <CellView
            key={`${cell.x}-${cell.y}`}
            cell={cell}
            active={cell === active}
            highlighted={highlighted}
            sameNumber={sameNumber}
            conflicting={conflictCells(cell)}
            wrong={!cell.initial && cell.number !== 0 && cell.number !== cell.solution}
            onSelect={(c) => selectCell({x: c.x, y: c.y})}
          />
        );
      })}
    </div>
  );
}
