import {cellsToSimpleSudoku, stringifySudoku} from "./engine/utility";
import type {Cell} from "./engine/types";
import type {Tier} from "../state/GameContext";

/**
 * localStorage persistence (SPEC §5.4). Versioned keys from day one so
 * future schema changes can migrate without clobbering user data.
 */
const STATE_PREFIX = "sudoku_lite_v1_state_";
const ACTIVE_KEY = "sudoku_lite_v1_active";

export interface SavedGame {
  board: Cell[];
  mistakes: number;
  secondsPlayed: number;
  tier: Tier;
  puzzleIndex: number;
}

/** Stable key for a board: the 81-char string of its given numbers only. */
export function puzzleKey(board: Cell[]): string {
  return stringifySudoku(cellsToSimpleSudoku(board));
}

export function saveGame(key: string, game: SavedGame): void {
  try {
    localStorage.setItem(STATE_PREFIX + key, JSON.stringify(game));
    localStorage.setItem(ACTIVE_KEY, key);
  } catch (error) {
    console.error("Could not save game state", error);
  }
}

export function loadGame(key: string): SavedGame | null {
  try {
    const raw = localStorage.getItem(STATE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGame;
    if (!Array.isArray(parsed.board) || parsed.board.length !== 81) return null;
    if (parsed.tier !== "easy" && parsed.tier !== "medium") return null;
    if (typeof parsed.mistakes !== "number" || typeof parsed.secondsPlayed !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function loadActiveGame(): SavedGame | null {
  let key: string | null = null;
  try {
    key = localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
  if (!key) return null;
  return loadGame(key);
}

export function clearGame(key: string): void {
  try {
    localStorage.removeItem(STATE_PREFIX + key);
  } catch (error) {
    console.error("Could not clear saved game", error);
  }
}
