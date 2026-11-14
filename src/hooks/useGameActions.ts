import {useMemo} from "react";
import {useBoard} from "../state/BoardContext";
import {useGame} from "../state/GameContext";
import type {Cell} from "../lib/engine/types";

/**
 * Shared place/erase/hint logic for the number pad, controls, and keyboard.
 * A placement that differs from the solution counts as a mistake.
 */
export function useGameActions() {
  const {state: board, canUndo, canRedo, setNumber, setNotes, clearNumber, hint, undo, redo} =
    useBoard();
  const {state: game, selectCell, toggleNotes, bumpMistake, pause, resume} = useGame();

  const activeCell: Cell | undefined = useMemo(() => {
    if (!game.activeCell) return undefined;
    return board.current.find(
      (c) => c.x === game.activeCell!.x && c.y === game.activeCell!.y,
    );
  }, [board.current, game.activeCell]);

  return {
    activeCell,
    canUndo,
    canRedo,
    placeNumber: (n: number) => {
      if (!activeCell || activeCell.initial || game.phase === "won") return;
      if (game.notesMode) {
        const notes = activeCell.notes.includes(n)
          ? activeCell.notes.filter((m) => m !== n)
          : [...activeCell.notes, n].sort((a, b) => a - b);
        setNotes(activeCell, notes);
      } else if (activeCell.number === n) {
        clearNumber(activeCell);
      } else {
        setNumber(activeCell, n);
        if (n !== activeCell.solution) bumpMistake();
      }
    },
    erase: () => {
      if (!activeCell || activeCell.initial) return;
      clearNumber(activeCell);
    },
    hint: () => {
      if (!activeCell || activeCell.initial) return;
      hint(activeCell);
    },
    moveSelection: (dx: number, dy: number) => {
      const x = Math.min(8, Math.max(0, (activeCell?.x ?? 0) + dx));
      const y = Math.min(8, Math.max(0, (activeCell?.y ?? 0) + dy));
      selectCell({x, y});
    },
    toggleNotes,
    togglePause: () => {
      if (game.phase === "running") pause();
      else if (game.phase === "paused") resume();
    },
    undo,
    redo,
  };
}
