import {useEffect} from "react";
import {Board} from "./components/Board";
import {InstallHint} from "./components/InstallHint";
import {Controls} from "./components/Controls";
import {NumberPad} from "./components/NumberPad";
import {OfflineIndicator} from "./components/OfflineIndicator";
import {PauseOverlay} from "./components/PauseOverlay";
import {SaveManager} from "./components/SaveManager";
import {SelectView} from "./components/SelectView";
import {SettingsPanel} from "./components/SettingsPanel";
import {WinOverlay} from "./components/WinOverlay";
import {useGameKeyboard} from "./hooks/useGameKeyboard";
import {BANK, buildCells, getPuzzle, randomPuzzleIndex, TIERS} from "./lib/bank";
import type {SimpleSudoku} from "./lib/engine/types";
import {loadActiveGame} from "./lib/storage";
import SudokuGame from "./lib/game/SudokuGame";
import {BoardProvider, useBoard} from "./state/BoardContext";
import {
  GameProvider,
  INITIAL_GAME_STATE,
  useGame,
  type GameState,
  type Tier,
} from "./state/GameContext";
import {PreferencesProvider} from "./state/PreferencesContext";
import {TimerProvider, useTimer} from "./state/TimerContext";
import {formatDuration} from "./utils/format";

// Session init (SPEC §5.4): resume a saved game — paused — or open a fresh
// random easy puzzle. Computed once per page load.
const SAVED = loadActiveGame();
const INITIAL_GAME: GameState = SAVED
  ? {
      view: "playing",
      tier: SAVED.tier,
      puzzleIndex: SAVED.puzzleIndex,
      phase: "paused",
      activeCell: undefined,
      notesMode: false,
      mistakes: SAVED.mistakes,
      secondsPlayed: SAVED.secondsPlayed,
    }
  : {
      ...INITIAL_GAME_STATE,
      puzzleIndex: randomPuzzleIndex("easy"),
    };
const INITIAL_BOARD = SAVED
  ? SAVED.board
  : buildCells(getPuzzle(INITIAL_GAME.tier, INITIAL_GAME.puzzleIndex));

const headerButton =
  "h-9 rounded-lg px-3 text-sm font-medium shadow-sm ring-1 transition-colors bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700";

function GameHeader() {
  const {state: game, pause, resume, restart, setView} = useGame();
  const {setBoard} = useBoard();
  const {displaySeconds} = useTimer();

  const handleRestart = () => {
    if (window.confirm("Restart this puzzle? Your progress will be lost.")) {
      setBoard(buildCells(getPuzzle(game.tier, game.puzzleIndex)));
      restart();
    }
  };

  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold">Sudoku Lite</h1>
        <span className="text-sm capitalize text-slate-500 dark:text-slate-400">
          {game.tier} · #{game.puzzleIndex + 1}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-3 text-sm text-slate-600 dark:text-slate-300">
          <span data-testid="timer">{formatDuration(displaySeconds)}</span>
          <span data-testid="mistakes" aria-label="Mistakes">
            ✗ {game.mistakes}
          </span>
        </div>
        <div className="flex gap-1.5">
          {game.phase === "running" && (
            <button type="button" data-testid="pause" className={headerButton} onClick={pause}>
              Pause
            </button>
          )}
          {game.phase === "paused" && (
            <button type="button" data-testid="resume" className={headerButton} onClick={resume}>
              Resume
            </button>
          )}
          {game.phase !== "won" && (
            <button type="button" data-testid="restart" className={headerButton} onClick={handleRestart}>
              Restart
            </button>
          )}
          <button
            type="button"
            data-testid="new-game-button"
            className={`${headerButton} bg-teal-600 text-white ring-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700`}
            onClick={() => {
              if (game.phase === "running") pause();
              setView("selecting");
            }}
          >
            New game
          </button>
        </div>
      </div>
    </header>
  );
}

function GameScreen() {
  useGameKeyboard();
  const {state: game, win, pause, resume, newGame} = useGame();
  const {state: board, setBoard} = useBoard();

  // Win detection (lifted pattern from super-sudoku).
  useEffect(() => {
    if (game.phase === "running" && SudokuGame.isSolved(board.current)) {
      win();
    }
  }, [board, game.phase, win]);

  // (Saved-state clearing on win is handled by SaveManager.)

  // Auto-pause when the tab hides (SPEC §6.8).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") pause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [pause]);

  const startNew = (tier: Tier, index: number) => {
    setBoard(buildCells(getPuzzle(tier, index)));
    newGame(tier, index);
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col gap-4 p-4 sm:max-w-lg">
      <GameHeader />
      <div className="relative">
        <Board />
        {game.phase === "paused" && <PauseOverlay onContinue={resume} />}
        {game.phase === "won" && (
          <WinOverlay
            seconds={game.secondsPlayed}
            mistakes={game.mistakes}
            onNewGame={() => startNew(game.tier, randomPuzzleIndex(game.tier))}
          />
        )}
      </div>
      <NumberPad />
      <Controls />
      <SettingsPanel />
    </div>
  );
}

type PuzzleCard = {index: number; givens: SimpleSudoku};

function SelectScreen() {
  const {setView, setGameState, newGame} = useGame();
  const {setBoard} = useBoard();

  // Fresh read: the saved game may have appeared since the page loaded.
  const saved = loadActiveGame();

  const puzzleCards: Record<Tier, PuzzleCard[]> = {
    easy: BANK.easy.map((p) => ({index: p.index, givens: p.givens})),
    medium: BANK.medium.map((p) => ({index: p.index, givens: p.givens})),
  };

  const play = (tier: Tier, index: number) => {
    setBoard(buildCells(getPuzzle(tier, index)));
    newGame(tier, index);
    setView("playing");
  };

  const continueGame = () => {
    if (!saved) return;
    setBoard(saved.board);
    setGameState({
      view: "playing",
      tier: saved.tier,
      puzzleIndex: saved.puzzleIndex,
      phase: "paused",
      activeCell: undefined,
      notesMode: false,
      mistakes: saved.mistakes,
      secondsPlayed: saved.secondsPlayed,
    });
  };

  return (
    <SelectView
      tiers={TIERS}
      puzzles={puzzleCards}
      saved={
        saved
          ? {
              tier: saved.tier,
              puzzleIndex: saved.puzzleIndex,
              seconds: saved.secondsPlayed,
              mistakes: saved.mistakes,
            }
          : null
      }
      onPlay={play}
      onContinue={continueGame}
      onBack={() => setView("playing")}
    />
  );
}

function AppShell() {
  const {state: game} = useGame();
  return (
    <>
      <OfflineIndicator />
      <div className="mx-auto w-full max-w-md px-4 sm:max-w-lg">
        <InstallHint />
      </div>
      <SaveManager />
      {game.view === "playing" ? <GameScreen /> : <SelectScreen />}
    </>
  );
}

export default function App() {
  return (
    <BoardProvider initial={INITIAL_BOARD}>
      <GameProvider initial={INITIAL_GAME}>
        <PreferencesProvider>
          <TimerProvider>
            <AppShell />
          </TimerProvider>
        </PreferencesProvider>
      </GameProvider>
    </BoardProvider>
  );
}
