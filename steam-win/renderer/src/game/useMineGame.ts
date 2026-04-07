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

function effectiveBonusTargetKeys(level: GameState['level']): Set<string> {
  const configuredBonusTargets = level.definition.mineBonusTargetCells;
  const effectiveBonusTargets =
    configuredBonusTargets && configuredBonusTargets.length > 0
      ? configuredBonusTargets
      : (level.definition.forcedMineCells ?? []);
  return new Set(effectiveBonusTargets.map(([tx, ty]) => `${tx},${ty}`));
}

export function useMineGame(initialLevelIndex: number) {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(() => initialLevelIndex);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(null);
  const [movingSoldier, setMovingSoldier] = useState<{ x: number; y: number; value: number } | null>(null);
  const [bonusFxKeys, setBonusFxKeys] = useState<string[]>([]);
  const bonusFxTimeoutsRef = useRef<Map<string, number>>(new Map());
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
      rewardedMineTargets: new Set(),
    });
    for (const t of bonusFxTimeoutsRef.current.values()) {
      window.clearTimeout(t);
    }
    bonusFxTimeoutsRef.current.clear();
    setBonusFxKeys([]);
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
    // 目標雷的「確認」只採玩家可見邏輯推論，不吃 hidden forced-mine 先驗。
    const logicOnlySolver = new MineSolver(gameState.level.cells, newPlacedNumbers, {
      ...mineTopo,
      forcedMineKeys: new Set<string>(),
    });
    const logicOnlyForcedMines = new Set(logicOnlySolver.findForced(newPlacedNumbers).mines);
    const bonusTargetKeys = effectiveBonusTargetKeys(gameState.level);
    const newRevealedMines = new Set(gameState.revealedMines);
    const newRevealedClear = new Set(gameState.revealedClear);
    const newlyConfirmedMines: string[] = [];
    const r = FORCED_AUTO_REVEAL_CHEBYSHEV_RADIUS;
    const validKeys = new Set(gameState.level.cells.map((c) => `${c.x},${c.y}`));
    const revealMode = mineTopo.neighborMode;
    const bw = gameState.level.width;
    const bh = gameState.level.height;
    for (const m of forced.mines) {
      if (!withinForcedRevealZone(m, x, y, r, validKeys, revealMode, bw, bh)) continue;
      // 所有紅雷顯示都只採用玩家可見資訊可推得的結果，避免 hidden 先驗讓雷提早變紅。
      if (!logicOnlyForcedMines.has(m)) continue;
      if (!newRevealedMines.has(m)) newlyConfirmedMines.push(m);
      newRevealedMines.add(m);
    }
    for (const targetKey of bonusTargetKeys) {
      if (!logicOnlyForcedMines.has(targetKey)) continue;
      if (!newRevealedMines.has(targetKey)) newlyConfirmedMines.push(targetKey);
      newRevealedMines.add(targetKey);
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
    const bonusSecondsPerMine = gameState.level.definition.mineBonusSeconds ?? 5;
    const newlyRewardedTargets = newlyConfirmedMines.filter(
      (k) => bonusTargetKeys.has(k) && !gameState.rewardedMineTargets.has(k)
    );
    const gainedSeconds =
      gameState.secondsLeft !== null && bonusSecondsPerMine > 0
        ? newlyRewardedTargets.length * bonusSecondsPerMine
        : 0;
    const nextRewardedMineTargets = new Set(gameState.rewardedMineTargets);
    for (const k of newlyRewardedTargets) nextRewardedMineTargets.add(k);
    if (newlyRewardedTargets.length > 0) {
      setBonusFxKeys((prev) => Array.from(new Set([...prev, ...newlyRewardedTargets])));
      for (const key of newlyRewardedTargets) {
        const prevTimeout = bonusFxTimeoutsRef.current.get(key);
        if (prevTimeout !== undefined) window.clearTimeout(prevTimeout);
        const timeoutId = window.setTimeout(() => {
          setBonusFxKeys((prev) => prev.filter((k) => k !== key));
          bonusFxTimeoutsRef.current.delete(key);
        }, 850);
        bonusFxTimeoutsRef.current.set(key, timeoutId);
      }
    }

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
              message:
                gainedSeconds > 0
                  ? `報告長官！目標雷區確認，時限 +${gainedSeconds} 秒；依電報完成佈雷，任務圓滿達成！`
                  : '報告長官！依電報完成佈雷，任務圓滿達成！',
              secondsLeft:
                prev.secondsLeft === null ? null : Math.max(0, prev.secondsLeft + gainedSeconds),
              rewardedMineTargets: nextRewardedMineTargets,
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
              secondsLeft:
                prev.secondsLeft === null ? null : Math.max(0, prev.secondsLeft + gainedSeconds),
              rewardedMineTargets: nextRewardedMineTargets,
              message:
                gainedSeconds > 0
                  ? `目標雷格確認，時限 +${gainedSeconds} 秒。${
                      finalPlacedInTurn === 0
                        ? '嘀——新電報到達，請選下一個數字。'
                        : '此格已依令安放。請先選下一封電報上的數字，再標座標。'
                    }`
                  : finalPlacedInTurn === 0
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
    bonusFxKeys,
  } as const;
}
