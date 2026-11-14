import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type ReactNode,
} from "react";
import type {CellCoordinates} from "../lib/engine/types";

export type Phase = "running" | "paused" | "won";
export type View = "playing" | "selecting";
export type Tier = "easy" | "medium";

export interface GameState {
  view: View;
  tier: Tier;
  puzzleIndex: number;
  phase: Phase;
  activeCell?: CellCoordinates;
  notesMode: boolean;
  mistakes: number;
  secondsPlayed: number;
}

export const INITIAL_GAME_STATE: GameState = {
  view: "playing",
  tier: "easy",
  puzzleIndex: 0,
  phase: "running",
  activeCell: undefined,
  notesMode: false,
  mistakes: 0,
  secondsPlayed: 0,
};

type GameAction =
  | {type: "NEW_GAME"; tier: Tier; puzzleIndex: number}
  | {type: "WIN"}
  | {type: "PAUSE"}
  | {type: "RESUME"}
  | {type: "RESTART"}
  | {type: "SELECT_CELL"; cell: CellCoordinates | undefined}
  | {type: "TOGGLE_NOTES"}
  | {type: "BUMP_MISTAKE"}
  | {type: "UPDATE_TIMER"; seconds: number}
  | {type: "SET_VIEW"; view: View}
  | {type: "SET_GAME_STATE"; state: GameState};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_GAME_STATE":
      return action.state;
    case "NEW_GAME":
      return {...INITIAL_GAME_STATE, tier: action.tier, puzzleIndex: action.puzzleIndex};
    case "WIN":
      return {...state, phase: "won"};
    case "PAUSE":
      return state.phase === "running" ? {...state, phase: "paused"} : state;
    case "RESUME":
      return state.phase === "paused" ? {...state, phase: "running"} : state;
    case "RESTART":
      return {...state, phase: "running", mistakes: 0, secondsPlayed: 0, activeCell: undefined};
    case "SELECT_CELL":
      return {...state, activeCell: action.cell};
    case "TOGGLE_NOTES":
      return {...state, notesMode: !state.notesMode};
    case "BUMP_MISTAKE":
      return state.phase === "running" ? {...state, mistakes: state.mistakes + 1} : state;
    case "UPDATE_TIMER":
      return {...state, secondsPlayed: action.seconds};
    case "SET_VIEW":
      return {...state, view: action.view};
  }
}

interface GameContextType {
  state: GameState;
  newGame: (tier: Tier, puzzleIndex: number) => void;
  win: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  selectCell: (cell: CellCoordinates | undefined) => void;
  toggleNotes: () => void;
  bumpMistake: () => void;
  updateTimer: (seconds: number) => void;
  setView: (view: View) => void;
  setGameState: (state: GameState) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({
  children,
  initial = INITIAL_GAME_STATE,
}: {
  children: ReactNode;
  initial?: GameState;
}) {
  const [state, dispatch] = useReducer(gameReducer, initial);

  const newGame = useCallback(
    (tier: Tier, puzzleIndex: number) => dispatch({type: "NEW_GAME", tier, puzzleIndex}),
    [],
  );
  const win = useCallback(() => dispatch({type: "WIN"}), []);
  const pause = useCallback(() => dispatch({type: "PAUSE"}), []);
  const resume = useCallback(() => dispatch({type: "RESUME"}), []);
  const restart = useCallback(() => dispatch({type: "RESTART"}), []);
  const selectCell = useCallback(
    (cell: CellCoordinates | undefined) => dispatch({type: "SELECT_CELL", cell}),
    [],
  );
  const toggleNotes = useCallback(() => dispatch({type: "TOGGLE_NOTES"}), []);
  const bumpMistake = useCallback(() => dispatch({type: "BUMP_MISTAKE"}), []);
  const updateTimer = useCallback(
    (seconds: number) => dispatch({type: "UPDATE_TIMER", seconds}),
    [],
  );
  const setView = useCallback((view: View) => dispatch({type: "SET_VIEW", view}), []);
  const setGameState = useCallback((s: GameState) => dispatch({type: "SET_GAME_STATE", state: s}), []);

  return (
    <GameContext.Provider
      value={{
        state,
        newGame,
        win,
        pause,
        resume,
        restart,
        selectCell,
        toggleNotes,
        bumpMistake,
        updateTimer,
        setView,
        setGameState,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
