import { useCallback, useEffect, useRef, useState } from 'react';
import { LEVELS, MineSolver, formatLossExplanation, lossConflictHighlightCells } from '../gameLogic';
import { EXPLOSION_RESOLVE_MS, SOLDIER_MOVE_MS } from './constants';
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
    setGameState({
      gameId: Date.now(),
      level,
      placedNumbers: [...hints],
      revealedMines: new Set(),
      revealedClear: new Set(),
      hand: generateHand(level, [...hints]),
      placedInTurn: 0,
      status: 'playing',
      message: '長官電報已收。請先選電碼，再標定佈雷座標。',
      conflictCells: [],
    });
    setSelectedHandIndex(null);
    setMovingSoldier(null);
  }, []);

  useEffect(() => {
    initGame(currentLevelIndex);
  }, [currentLevelIndex, initGame]);

  const handleCellClick = async (x: number, y: number) => {
    if (!gameState || gameState.status !== 'playing' || selectedHandIndex === null || movingSoldier) return;

    const cellKey = `${x},${y}`;
    if (gameState.placedNumbers.some((p) => p.x === x && p.y === y)) return;
    if (gameState.revealedMines.has(cellKey)) return;

    const newValue = gameState.hand[selectedHandIndex];

    setMovingSoldier({ x, y, value: newValue });
    await new Promise((resolve) => setTimeout(resolve, SOLDIER_MOVE_MS));

    const newPlacedNumbers = [...gameState.placedNumbers, { x, y, value: newValue }];
    const solver = new MineSolver(gameState.level.cells, newPlacedNumbers);
    const conflictDetails = solver.getConflicts();

    if (conflictDetails) {
      const conflictCells = lossConflictHighlightCells(conflictDetails, { x, y });
      const message = formatLossExplanation(conflictDetails, { x, y, value: newValue });
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              status: 'exploding',
              message,
              placedNumbers: newPlacedNumbers,
              conflictCells,
            }
          : null
      );

      setTimeout(() => {
        setGameState((prev) => (prev ? { ...prev, status: 'lost' } : null));
      }, EXPLOSION_RESOLVE_MS);

      setMovingSoldier(null);
      return;
    }

    const forced = solver.findForced(newPlacedNumbers);
    const newRevealedMines = new Set(gameState.revealedMines);
    const newRevealedClear = new Set(gameState.revealedClear);
    forced.mines.forEach((m) => newRevealedMines.add(m));
    forced.clear.forEach((c) => newRevealedClear.add(c));

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
                  ? '嘀——新電報到達，請選下一道電碼。'
                  : '此格已依令安放。請選下一道電碼後再標座標。',
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
    setSelectedHandIndex,
    movingSoldier,
    initGame,
    handleCellClick,
    fillPercentage,
  } as const;
}
