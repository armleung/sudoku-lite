import {parseSudoku, simpleSudokuToCells} from "./engine/utility";
import {solve} from "./engine/solverAC3";
import type {Cell, SimpleSudoku} from "./engine/types";

/**
 * TEMPORARY (build step 3): a single hard-coded sample puzzle so the board
 * can be developed without the puzzle bank. Step 8 replaces this with the
 * file-based bank in src/data/puzzles/.
 */
const SAMPLE_PUZZLE = "534920700060007309900000010008700000496803002721594806000200940800046100003000000";

const grid: SimpleSudoku = parseSudoku(SAMPLE_PUZZLE);
const solved = solve(grid);
if (solved.sudoku === null) {
  throw new Error("Sample puzzle is not solvable");
}

export const SAMPLE_TIER = "easy";
export const SOLUTION: SimpleSudoku = solved.sudoku;

export function initialCells(): Cell[] {
  return simpleSudokuToCells(grid, SOLUTION);
}
