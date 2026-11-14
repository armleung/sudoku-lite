import {throttle} from "lodash-es";
import {useEffect, useMemo} from "react";
import {clearGame, puzzleKey, saveGame} from "../lib/storage";
import {useBoard} from "../state/BoardContext";
import {useGame} from "../state/GameContext";

/**
 * Autosave (SPEC §6.14): one write at most every 2 s while a game is in
 * progress; flushes when the tab hides or the page unloads; on win the
 * pending write is cancelled and the saved state cleared (replaying means a
 * fresh start).
 */
export function SaveManager() {
  const {state: board} = useBoard();
  const {state: game} = useGame();

  const throttledSave = useMemo(() => throttle(saveGame, 2000), []);

  // Throttled write on every board / timer / mistake change.
  useEffect(() => {
    if (game.phase === "won") return;
    throttledSave(puzzleKey(board.current), {
      board: board.current,
      mistakes: game.mistakes,
      secondsPlayed: Math.floor(game.secondsPlayed),
      tier: game.tier,
      puzzleIndex: game.puzzleIndex,
    });
  }, [
    board,
    game.mistakes,
    game.secondsPlayed,
    game.phase,
    game.tier,
    game.puzzleIndex,
    throttledSave,
  ]);

  // Win: drop any pending write and clear the saved state for this puzzle.
  useEffect(() => {
    if (game.phase === "won") {
      throttledSave.cancel();
      clearGame(puzzleKey(board.current));
    }
  }, [game.phase, board, throttledSave]);

  // Flush pending writes when the tab hides or the page unloads.
  useEffect(() => {
    const flush = () => throttledSave.flush();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", flush);
    };
  }, [throttledSave]);

  return null;
}
