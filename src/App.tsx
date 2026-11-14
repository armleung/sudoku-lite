import {Board} from "./components/Board";
import {Controls} from "./components/Controls";
import {NumberPad} from "./components/NumberPad";
import {useGameKeyboard} from "./hooks/useGameKeyboard";
import {initialCells} from "./lib/puzzle";
import {BoardProvider} from "./state/BoardContext";
import {GameProvider, useGame} from "./state/GameContext";

const INITIAL_BOARD = initialCells();

function GameScreen() {
  useGameKeyboard();
  const {state: game} = useGame();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col gap-4 p-4 sm:max-w-lg">
      <header className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold">Sudoku Lite</h1>
        <p className="text-sm text-slate-500 capitalize dark:text-slate-400">
          {game.tier} · mistakes {game.mistakes}
        </p>
      </header>

      <Board />
      <NumberPad />
      <Controls />
    </div>
  );
}

export default function App() {
  return (
    <BoardProvider initial={INITIAL_BOARD}>
      <GameProvider>
        <GameScreen />
      </GameProvider>
    </BoardProvider>
  );
}
