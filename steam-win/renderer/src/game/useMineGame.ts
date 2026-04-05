import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LEVELS,
  MineSolver,
  formatLossExplanation,
  lossConflictHighlightCells,
  lossExplosionMarkCells,
  lossUiTopologyFromLevel,
  mineSolverTopologyFromLevel,
} from '../gameLogic';
import { withinForcedRevealZone } from '../levelData/gridTopology';
import { EXPLOSION_RESOLVE_MS, FORCED_AUTO_REVEAL_CHEBYSHEV_RADIUS, SOLDIER_MOVE_MS } from './constants';
import { generateHand } from './generateHand';
import type { GameState } from './types';

export function useMineGame(initialLevelIndex: number) {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(() => initialLevelIndex);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(null);
  const [movingSoldier, setMovingSoldier] = useState<{ x: number; y: number; value: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const initGame = useCallback((levelIndex: number) => {
    const level = LEVELS[levelIndex];
    const hints = level.initialHints ?? [];
    const limit = level.definition.timeLimit;
    setGameState({
      gameId: Date.now(),
      level,
      placedNumbers: [...hints],
      revealedMines: new Set(),
      revealedClear: new Set(),
      hand: generateHand(level, [...hints]),
      placedInTurn: 0,
      status: 'playing',
      message: '長官電報已收。先選一封電報上的數字，再標定佈雷座標。',
      conflictCells: [],
      explosionMarkCells: [],
      secondsLeft: limit > 0 ? limit : null,
      timerStarted: false,
    });
    setSelectedHandIndex(null);
    setMovingSoldier(null);
  }, []);

  useEffect(() => {
    initGame(currentLevelIndex);
  }, [currentLevelIndex, initGame]);

  useEffect(() => {
    if (!gameState || gameState.status !== 'playing' || gameState.secondsLeft === null) return;
    if (!gameState.timerStarted) return;

    const id = window.setInterval(() => {
      setGameState((prev) => {
        if (!prev || prev.status !== 'playing' || prev.secondsLeft === null) return prev;
        const next = prev.secondsLeft - 1;
        if (next > 0) return { ...prev, secondsLeft: next };
        return {
          ...prev,
          status: 'exploding',
          message: '時限已盡，雷區未能完成佈署——引爆！長官：「撤！」',
          secondsLeft: 0,
          conflictCells: [],
          explosionMarkCells: [],
        };
      });
    }, 1000);

    return () => clearInterval(id);
  }, [gameState?.gameId, gameState?.status, gameState?.timerStarted]);

  useEffect(() => {
    if (!gameState || gameState.status !== 'exploding') return;
    const t = window.setTimeout(() => {
      setGameState((prev) => (prev?.status === 'exploding' ? { ...prev, status: 'lost' } : prev));
    }, EXPLOSION_RESOLVE_MS);
    return () => clearTimeout(t);
  }, [gameState?.gameId, gameState?.status]);

  const selectHand = useCallback((index: number) => {
    setSelectedHandIndex(index);
    setGameState((prev) => {
      if (!prev || prev.secondsLeft === null || prev.timerStarted) return prev;
      return { ...prev, timerStarted: true };
    });
  }, []);

  const handleCellClick = async (x: number, y: number) => {
    if (!gameState || gameState.status !== 'playing' || selectedHandIndex === null || movingSoldier) return;

    const cellKey = `${x},${y}`;
    if (gameState.placedNumbers.some((p) => p.x === x && p.y === y)) return;
    if (gameState.revealedMines.has(cellKey)) return;

    const newValue = gameState.hand[selectedHandIndex];

    setMovingSoldier({ x, y, value: newValue });
    await new Promise((resolve) => setTimeout(resolve, SOLDIER_MOVE_MS));

    const newPlacedNumbers = [...gameState.placedNumbers, { x, y, value: newValue }];
    const mineTopo = mineSolverTopologyFromLevel(gameState.level);
    const solver = new MineSolver(gameState.level.cells, newPlacedNumbers, mineTopo);
    const conflictDetails = solver.getConflicts();

    if (conflictDetails) {
      const lossTopo = lossUiTopologyFromLevel(gameState.level);
      const conflictCells = lossConflictHighlightCells(conflictDetails, { x, y });
      const explosionMarkCells = lossExplosionMarkCells(
        gameState.level.cells,
        gameState.placedNumbers,
        { x, y },
        lossTopo
      );
      const message = formatLossExplanation(conflictDetails, { x, y, value: newValue }, lossTopo);
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              status: 'exploding',
              message,
              placedNumbers: newPlacedNumbers,
              conflictCells,
              explosionMarkCells,
            }
          : null
      );

      setMovingSoldier(null);
      return;
    }

    const forced = solver.findForced(newPlacedNumbers);
    const newRevealedMines = new Set(gameState.revealedMines);
    const newRevealedClear = new Set(gameState.revealedClear);
    const r = FORCED_AUTO_REVEAL_CHEBYSHEV_RADIUS;
    const validKeys = new Set(gameState.level.cells.map((c) => `${c.x},${c.y}`));
    const revealMode = mineTopo.neighborMode;
    const bw = gameState.level.width;
    const bh = gameState.level.height;
    for (const m of forced.mines) {
      if (withinForcedRevealZone(m, x, y, r, validKeys, revealMode, bw, bh)) newRevealedMines.add(m);
    }
    for (const c of forced.clear) {
      if (withinForcedRevealZone(c, x, y, r, validKeys, revealMode, bw, bh)) newRevealedClear.add(c);
    }

    const newHand = [...gameState.hand];
    newHand.splice(selectedHandIndex, 1);

    let nextPlacedInTurn = gameState.placedInTurn + 1;
    let finalHand = newHand;
    let finalPlacedInTurn = nextPlacedInTurn;

    if (nextPlacedInTurn === 2) {
      finalHand = generateHand(gameState.level, newPlacedNumbers);
      finalPlacedInTurn = 0;
    }

    const totalKnown = newPlacedNumbers.length + newRevealedMines.size + newRevealedClear.size;
    const fillPercentage = (totalKnown / gameState.level.cells.length) * 100;

    const winPct = gameState.level.definition.coverageGoal * 100;
    if (fillPercentage >= winPct) {
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              placedNumbers: newPlacedNumbers,
              revealedMines: newRevealedMines,
              revealedClear: newRevealedClear,
              hand: finalHand,
              placedInTurn: finalPlacedInTurn,
              status: 'won',
              message: '報告長官！依電報完成佈雷，任務圓滿達成！',
            }
          : null
      );
    } else {
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              placedNumbers: newPlacedNumbers,
              revealedMines: newRevealedMines,
              revealedClear: newRevealedClear,
              hand: finalHand,
              placedInTurn: finalPlacedInTurn,
              message:
                finalPlacedInTurn === 0
                  ? '嘀——新電報到達，請選下一個數字。'
                  : '此格已依令安放。請先選下一封電報上的數字，再標座標。',
            }
          : null
      );
    }

    setMovingSoldier(null);
    setSelectedHandIndex(null);
  };

  const fillPercentage = gameState
    ? ((gameState.placedNumbers.length + gameState.revealedMines.size + gameState.revealedClear.size) /
        gameState.level.cells.length) *
      100
    : 0;

  return {
    LEVELS,
    boardRef,
    currentLevelIndex,
    setCurrentLevelIndex,
    gameState,
    selectedHandIndex,
    selectHand,
    movingSoldier,
    initGame,
    handleCellClick,
    fillPercentage,
  } as const;
}
