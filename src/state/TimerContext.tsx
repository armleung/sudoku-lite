import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {useGame} from "./GameContext";

/**
 * Lifted timer pattern from super-sudoku (MIT): display ticks every 200ms
 * from a wall-clock anchor, whole seconds are persisted into GameContext at
 * most once per second.
 */
interface TimerContextType {
  displaySeconds: number;
  isRunning: boolean;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({children}: {children: ReactNode}) {
  const {state: game, updateTimer} = useGame();
  const [displaySeconds, setDisplaySeconds] = useState(game.secondsPlayed);
  const startTimeRef = useRef(0);
  const lastPersistedRef = useRef(0);
  const isRunning = game.phase === "running";

  // (Re)anchor whenever persisted seconds or phase change.
  useEffect(() => {
    startTimeRef.current = Date.now() - game.secondsPlayed * 1000;
    setDisplaySeconds(game.secondsPlayed);
    lastPersistedRef.current = Math.floor(game.secondsPlayed);
  }, [game.secondsPlayed, game.phase]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setDisplaySeconds(elapsed);
      const currentSecond = Math.floor(elapsed);
      if (currentSecond > lastPersistedRef.current) {
        updateTimer(currentSecond);
        lastPersistedRef.current = currentSecond;
      }
    }, 200);
    return () => clearInterval(interval);
  }, [isRunning, updateTimer]);

  return (
    <TimerContext.Provider value={{displaySeconds, isRunning}}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}
