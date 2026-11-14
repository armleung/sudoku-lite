import {flatten} from "lodash-es";
import {useMemo} from "react";
import SudokuGame from "../lib/game/SudokuGame";
import {simpleSudokuToCells, squareIndex} from "../lib/engine/utility";
import {useBoard} from "../state/BoardContext";
import {useGame} from "../state/GameContext";
import {usePreferences} from "../state/PreferencesContext";
import {CellView} from "./CellView";

// Blank board shown while paused (anti-cheat, SPEC §6.8).
const BLANK_CELLS = simpleSudokuToCells(
  Array.from({length: 9}, () => Array(9).fill(0)),
);
const NO_CONFLICTS = new Set<number>();

export function Board() {
  const {state: board} = useBoard();
  const {state: game, selectCell} = useGame();
  const {state: prefs} = usePreferences();

  const cells = game.phase === "paused" ? BLANK_CELLS : board.current;

  const active =
    game.phase === "paused"
      ? undefined
      : game.activeCell
        ? cells.find((c) => c.x === game.activeCell!.x && c.y === game.activeCell!.y)
        : undefined;

  // Conflict paths: all cells lying between duplicate numbers in a row or column.
  // Lifted computation from super-sudoku (MIT).
  const conflictSet = useMemo(() => {
    if (!prefs.showConflicts) return NO_CONFLICTS;
    const conflicting = SudokuGame.conflictingFields(cells);
    const uniquePaths = SudokuGame.uniquePaths(
      flatten(
        conflicting.map((c) => SudokuGame.getPathsFromConflicting(c, cells)),
      ),
    );
    const pathCells = flatten(
      uniquePaths.map((p) => SudokuGame.getPathBetweenCell(p.from, p.to)),
    );
    return new Set(pathCells.map((p) => p.y * 9 + p.x));
  }, [cells, prefs.showConflicts]);

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
            conflicting={conflictSet.has(cell.y * 9 + cell.x)}
            wrong={
              prefs.showWrongEntries &&
              !cell.initial &&
              cell.number !== 0 &&
              cell.number !== cell.solution
            }
            onSelect={(c) => selectCell({x: c.x, y: c.y})}
          />
        );
      })}
    </div>
  );
}
