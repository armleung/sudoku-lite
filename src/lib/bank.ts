import {solve} from "./engine/solverAC3";
import {parseSudoku, simpleSudokuToCells, stringifySudoku} from "./engine/utility";
import type {Cell, SimpleSudoku} from "./engine/types";
import type {Tier} from "../state/GameContext";
import easyRaw from "../data/puzzles/easy.txt?raw";
import mediumRaw from "../data/puzzles/medium.txt?raw";

/**
 * File-based puzzle bank (SPEC §4). One 81-char line per puzzle, solutions
 * computed once at load with the AC3 solver, so the whole bank ships inside
 * the JS bundle and the app stays fully offline.
 */
export interface PuzzleEntry {
  tier: Tier;
  /** 0-based position within the tier file */
  index: number;
  givens: SimpleSudoku;
  solution: SimpleSudoku;
  /** 81-char string of the givens — stable key for localStorage */
  key: string;
}

const RAW_BANKS: Record<Tier, string> = {easy: easyRaw, medium: mediumRaw};

function buildTier(tier: Tier): PuzzleEntry[] {
  return RAW_BANKS[tier]
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const givens = parseSudoku(line);
      const solved = solve(givens);
      if (solved.sudoku === null) {
        throw new Error(`Puzzle #${index + 1} in "${tier}" is not solvable`);
      }
      return {tier, index, givens, solution: solved.sudoku, key: stringifySudoku(givens)};
    });
}

export const TIERS: Tier[] = ["easy", "medium"];

export const BANK: Record<Tier, PuzzleEntry[]> = {
  easy: buildTier("easy"),
  medium: buildTier("medium"),
};

export function getPuzzles(tier: Tier): PuzzleEntry[] {
  return BANK[tier];
}

export function getPuzzle(tier: Tier, index: number): PuzzleEntry {
  const entry = BANK[tier][index];
  if (!entry) {
    throw new Error(`No puzzle #${index} in "${tier}"`);
  }
  return entry;
}

export function randomPuzzleIndex(tier: Tier): number {
  return Math.floor(Math.random() * BANK[tier].length);
}

export function buildCells(entry: PuzzleEntry): Cell[] {
  return simpleSudokuToCells(entry.givens, entry.solution);
}
