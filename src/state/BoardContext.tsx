import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type ReactNode,
} from "react";
import type {Cell, CellCoordinates} from "../lib/engine/types";
import {squareIndex} from "../lib/engine/utility";

export interface BoardState {
  current: Cell[];
  history: Cell[][];
  historyIndex: number;
}

/**
 * Lifted from super-sudoku (MIT): setting a number removes that digit from
 * the pencil notes of every cell sharing its row, column, or 3x3 box.
 */
function fixSudokuNotes(sudoku: Cell[], newCell: Cell): Cell[] {
  let result = sudoku.map((cell) => {
    if (cell.x === newCell.x) {
      return {...cell, notes: cell.notes.filter((n) => n !== newCell.number)};
    }
    return cell;
  });

  result = result.map((cell) => {
    if (cell.y === newCell.y) {
      return {...cell, notes: cell.notes.filter((n) => n !== newCell.number)};
    }
    return cell;
  });

  return result.map((cell) => {
    if (squareIndex(cell.x, cell.y) === squareIndex(newCell.x, newCell.y)) {
      return {...cell, notes: cell.notes.filter((n) => n !== newCell.number)};
    }
    return cell;
  });
}

type BoardAction =
  | {type: "SET_BOARD"; cells: Cell[]}
  | {type: "SET_NUMBER"; cell: CellCoordinates; number: number}
  | {type: "SET_NOTES"; cell: CellCoordinates; notes: number[]}
  | {type: "CLEAR_NUMBER"; cell: CellCoordinates}
  | {type: "CLEAR_CELL"; cell: CellCoordinates}
  | {type: "HINT"; cell: CellCoordinates}
  | {type: "UNDO"}
  | {type: "REDO"};

function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case "SET_BOARD":
      return {current: action.cells, history: [action.cells], historyIndex: 0};
    case "UNDO":
      if (state.historyIndex < state.history.length - 1) {
        return {
          ...state,
          current: state.history[state.historyIndex + 1],
          historyIndex: state.historyIndex + 1,
        };
      }
      return state;
    case "REDO":
      if (state.historyIndex > 0) {
        return {
          ...state,
          current: state.history[state.historyIndex - 1],
          historyIndex: state.historyIndex - 1,
        };
      }
      return state;
    default: {
      const {x, y} = action.cell;
      let newGrid = state.current.map((cell) => {
        const isCell = cell.x === x && cell.y === y;
        if (isCell && !cell.initial) {
          switch (action.type) {
            case "SET_NUMBER":
              return {...cell, number: action.number, notes: []};
            case "SET_NOTES":
              return {...cell, notes: action.notes, number: 0};
            case "CLEAR_NUMBER":
              return {...cell, number: 0};
            case "CLEAR_CELL":
              return {...cell, number: 0, notes: []};
            case "HINT":
              return {...cell, number: cell.solution, notes: []};
            default:
              return cell;
          }
        }
        return cell;
      });

      if (action.type === "SET_NUMBER") {
        const placed = newGrid.find((c) => c.x === x && c.y === y);
        if (placed) {
          newGrid = fixSudokuNotes(newGrid, placed);
        }
      }

      // Newest state first; redo history is dropped on any new move.
      return {current: newGrid, history: [newGrid, ...state.history], historyIndex: 0};
    }
  }
}

interface BoardContextType {
  state: BoardState;
  canUndo: boolean;
  canRedo: boolean;
  setBoard: (cells: Cell[]) => void;
  setNumber: (cell: CellCoordinates, number: number) => void;
  setNotes: (cell: CellCoordinates, notes: number[]) => void;
  clearNumber: (cell: CellCoordinates) => void;
  clearCell: (cell: CellCoordinates) => void;
  hint: (cell: CellCoordinates) => void;
  undo: () => void;
  redo: () => void;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export function BoardProvider({
  initial,
  children,
}: {
  initial: Cell[];
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(
    boardReducer,
    initial,
    (cells) => ({current: cells, history: [cells], historyIndex: 0}),
  );

  const setBoard = useCallback((cells: Cell[]) => dispatch({type: "SET_BOARD", cells}), []);
  const setNumber = useCallback(
    (cell: CellCoordinates, number: number) =>
      dispatch({type: "SET_NUMBER", cell, number}),
    [],
  );
  const setNotes = useCallback(
    (cell: CellCoordinates, notes: number[]) => dispatch({type: "SET_NOTES", cell, notes}),
    [],
  );
  const clearNumber = useCallback(
    (cell: CellCoordinates) => dispatch({type: "CLEAR_NUMBER", cell}),
    [],
  );
  const clearCell = useCallback(
    (cell: CellCoordinates) => dispatch({type: "CLEAR_CELL", cell}),
    [],
  );
  const hint = useCallback((cell: CellCoordinates) => dispatch({type: "HINT", cell}), []);
  const undo = useCallback(() => dispatch({type: "UNDO"}), []);
  const redo = useCallback(() => dispatch({type: "REDO"}), []);

  return (
    <BoardContext.Provider
      value={{
        state,
        canUndo: state.historyIndex < state.history.length - 1,
        canRedo: state.historyIndex > 0,
        setBoard,
        setNumber,
        setNotes,
        clearNumber,
        clearCell,
        hint,
        undo,
        redo,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error("useBoard must be used within a BoardProvider");
  }
  return context;
}
