import {useEffect, useRef} from "react";
import {useGameActions} from "./useGameActions";

/**
 * Desktop keyboard support: 1-9 place/note, Backspace erase, arrows move,
 * n notes, h hint, Escape pause/resume, Ctrl/Cmd+Z undo,
 * Ctrl/Cmd+Shift+Z / Ctrl/Cmd+Y redo.
 */
export function useGameKeyboard() {
  const actions = useGameActions();
  const ref = useRef(actions);
  useEffect(() => {
    ref.current = actions;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const a = ref.current;
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) a.redo();
        else a.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        a.redo();
        return;
      }
      if (mod) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          a.moveSelection(0, -1);
          break;
        case "ArrowDown":
          e.preventDefault();
          a.moveSelection(0, 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          a.moveSelection(-1, 0);
          break;
        case "ArrowRight":
          e.preventDefault();
          a.moveSelection(1, 0);
          break;
        case "Backspace":
        case "Delete":
          e.preventDefault();
          a.erase();
          break;
        case "n":
        case "N":
          a.toggleNotes();
          break;
        case "h":
        case "H":
          a.hint();
          break;
        case "Escape":
          a.togglePause();
          break;
        default:
          if (e.key >= "1" && e.key <= "9") {
            a.placeNumber(Number(e.key));
          }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
