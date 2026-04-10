import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LEVELS,
  MineSolver,
  formatLossExplanation,
  lossConflictHighlightCells,
  lossExplosionMarkCells,
  lossUiTopologyFromLevel,
  mergeTopologyWithDynamicMines,
  mineSolverTopologyFromLevel,
} from '../gameLogic';
import {
  logicNeighborKeys,
  neighborModeForGridSystem,
  withinForcedRevealZone,
} from '../levelData/gridTopology';
import {
  EXPLOSION_RESOLVE_MS,
  FORCED_AUTO_REVEAL_CHEBYSHEV_RADIUS,
  LAST_COUNTDOWN_SOUND_SECONDS,
  LOSS_EXPLOSION_CHAIN_SETTLE_MS,
  LOSS_EXPLOSION_FIRST_DELAY_MS,
  LOSS_EXPLOSION_STAGGER_MS,
  SOLDIER_MOVE_MS,
} from './constants';
import { sortLossExplosionCells, timeoutLossExplosionKeys } from './lossExplosionChain';
import { playExplosionPop } from './playExplosionPop';
import { playCountdownTick, playPlaceNumberSound, playTimeUpChirp } from './playGameSfx';
import { generateHand } from './generateHand';
import { signalJammingDisplayedDigit } from './signalJamming';
import type { GameState } from './types';

/**
 * 深海要塞：在鄰居皆無已放數字的空格中隨機挑一格作為新增地雷位置。
 * 回傳 cellKey（"x,y"）或 null（無合法位置時不新增）。
 */
function pickDynamicMinePosition(
  cells: { x: number; y: number }[],
  placedNumbers: { x: number; y: number }[],
  occupied: Set<string>,
  validKeys: Set<string>,
  boardW: number,
  boardH: number,
  neighborMode: ReturnType<typeof neighborModeForGridSystem>,
): string | null {
  const numberKeys = new Set(placedNumbers.map((p) => `${p.x},${p.y}`));
  const candidates: string[] = [];
  for (const cell of cells) {
    const key = `${cell.x},${cell.y}`;
    if (occupied.has(key)) continue;
    const nbs = logicNeighborKeys(cell.x, cell.y, validKeys, neighborMode, boardW, boardH);
    if (nbs.some((nk) => numberKeys.has(nk))) continue;
    candidates.push(key);
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

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
      lossSequentialExplosionKeys: [],
      lossExplosionWaveIndex: -1,
      secondsLeft: limit > 0 ? limit : null,
      timerStarted: false,
      rewardedMineTargets: new Set(),
      dynamicMines: new Set(),
      jammingEpochMs: level.definition.commandSlotReceiveJamming ? Date.now() : 0,
      jammingLockedSlot: null,
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
        if (next > 0) {
          if (next <= LAST_COUNTDOWN_SOUND_SECONDS) {
            queueMicrotask(() => playCountdownTick(next));
          }
          return { ...prev, secondsLeft: next };
        }
        queueMicrotask(() => playTimeUpChirp());
        return {
          ...prev,
          status: 'exploding',
          message: '時限已盡，雷區未能完成佈署——引爆！長官：「撤！」',
          secondsLeft: 0,
          conflictCells: [],
          explosionMarkCells: [],
          lossSequentialExplosionKeys: timeoutLossExplosionKeys(
            prev.revealedMines,
            prev.dynamicMines,
            prev.level.definition.forcedMineCells,
          ),
          lossExplosionWaveIndex: -1,
        };
      });
    }, 1000);

    return () => clearInterval(id);
  }, [gameState?.gameId, gameState?.status, gameState?.timerStarted]);

  useEffect(() => {
    if (!gameState || gameState.status !== 'exploding') return;
    const seq = gameState.lossSequentialExplosionKeys;
    const wi = gameState.lossExplosionWaveIndex;

    if (seq.length === 0) {
      const t = window.setTimeout(() => {
        setGameState((prev) => (prev?.status === 'exploding' ? { ...prev, status: 'lost' } : prev));
      }, EXPLOSION_RESOLVE_MS);
      return () => clearTimeout(t);
    }

    if (wi >= seq.length) {
      const t = window.setTimeout(() => {
        setGameState((prev) => (prev?.status === 'exploding' ? { ...prev, status: 'lost' } : prev));
      }, LOSS_EXPLOSION_CHAIN_SETTLE_MS);
      return () => clearTimeout(t);
    }

    const delay = wi < 0 ? LOSS_EXPLOSION_FIRST_DELAY_MS : LOSS_EXPLOSION_STAGGER_MS;
    const t = window.setTimeout(() => {
      const nextIdx = wi + 1;
      playExplosionPop(nextIdx);
      setGameState((prev) => {
        if (!prev || prev.status !== 'exploding') return prev;
        return { ...prev, lossExplosionWaveIndex: nextIdx };
      });
    }, delay);
    return () => clearTimeout(t);
  }, [gameState?.gameId, gameState?.status, gameState?.lossExplosionWaveIndex, gameState?.lossSequentialExplosionKeys]);

  const selectHand = useCallback((index: number) => {
    setSelectedHandIndex(index);
    setGameState((prev) => {
      if (!prev) return prev;
      const jam = Boolean(prev.level.definition.commandSlotReceiveJamming && prev.jammingEpochMs > 0);
      const jammingLockedSlot = jam
        ? {
            slotIndex: index,
            value: signalJammingDisplayedDigit(
              prev.jammingEpochMs,
              index,
              Date.now(),
              prev.level.definition.commandSlotJammingStepMs,
            ),
          }
        : null;

      if (prev.secondsLeft === null) {
        return { ...prev, jammingLockedSlot };
      }
      if (!prev.timerStarted) {
        return { ...prev, timerStarted: true, jammingLockedSlot };
      }
      return jam ? { ...prev, jammingLockedSlot } : prev;
    });
  }, []);

  const handleCellClick = async (x: number, y: number) => {
    if (!gameState || gameState.status !== 'playing' || selectedHandIndex === null || movingSoldier) return;

    const cellKey = `${x},${y}`;
    if (gameState.placedNumbers.some((p) => p.x === x && p.y === y)) return;
    if (gameState.revealedMines.has(cellKey)) return;
    if (gameState.dynamicMines.has(cellKey)) return;

    const jamActive =
      Boolean(gameState.level.definition.commandSlotReceiveJamming) && gameState.jammingEpochMs > 0;
    let newValue: number;
    if (jamActive) {
      const lock = gameState.jammingLockedSlot;
      if (!lock || lock.slotIndex !== selectedHandIndex) {
        setGameState((prev) =>
          prev
            ? {
                ...prev,
                message: '先點一道長官電報，鎖定當下數字，再點格佈雷。',
              }
            : null,
        );
        return;
      }
      newValue = lock.value;
    } else {
      newValue = gameState.hand[selectedHandIndex];
    }

    setMovingSoldier({ x, y, value: newValue });
    await new Promise((resolve) => setTimeout(resolve, SOLDIER_MOVE_MS));

    const newPlacedNumbers = [...gameState.placedNumbers, { x, y, value: newValue }];
    const baseTopo = mineSolverTopologyFromLevel(gameState.level);
    const mineTopo = mergeTopologyWithDynamicMines(baseTopo, gameState.dynamicMines);
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
      const lossSequentialExplosionKeys = sortLossExplosionCells(explosionMarkCells, { x, y });
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
              lossSequentialExplosionKeys,
              lossExplosionWaveIndex: -1,
            }
          : null
      );

      setMovingSoldier(null);
      return;
    }

    playPlaceNumberSound(newValue);

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

    const newDynamicMines = new Set(gameState.dynamicMines);
    if (gameState.level.definition.dynamicMinePerMove) {
      const occupiedKeys = new Set<string>();
      for (const p of newPlacedNumbers) occupiedKeys.add(`${p.x},${p.y}`);
      for (const k of newRevealedMines) occupiedKeys.add(k);
      for (const k of newDynamicMines) occupiedKeys.add(k);
      for (const k of mineTopo.forcedMineKeys ?? []) occupiedKeys.add(k);
      for (const k of mineTopo.ghostMineKeys ?? []) occupiedKeys.add(k);
      const validKeys = new Set(gameState.level.cells.map((c) => `${c.x},${c.y}`));
      const nMode = neighborModeForGridSystem(gameState.level.definition.gridSystem);
      const mineKey = pickDynamicMinePosition(
        gameState.level.cells,
        newPlacedNumbers,
        occupiedKeys,
        validKeys,
        gameState.level.width,
        gameState.level.height,
        nMode,
      );
      if (mineKey) newDynamicMines.add(mineKey);
    }

    if (nextPlacedInTurn === 2) {
      finalHand = generateHand(gameState.level, newPlacedNumbers, newDynamicMines);
      finalPlacedInTurn = 0;
    }

    const totalKnown = newPlacedNumbers.length + newRevealedMines.size + newRevealedClear.size + newDynamicMines.size;
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
              dynamicMines: newDynamicMines,
              jammingLockedSlot: null,
            }
          : null
      );
    } else {
      const dynamicMineMsg =
        newDynamicMines.size > gameState.dynamicMines.size ? '　⚠ 暗流推入一顆廢雷！' : '';
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
              dynamicMines: newDynamicMines,
              jammingLockedSlot: null,
              message:
                gainedSeconds > 0
                  ? `目標雷格確認，時限 +${gainedSeconds} 秒。${
                      finalPlacedInTurn === 0
                        ? '嘀——新電報到達，請選下一個數字。'
                        : '此格已依令安放。請先選下一封電報上的數字，再標座標。'
                    }${dynamicMineMsg}`
                  : `${
                      finalPlacedInTurn === 0
                        ? '嘀——新電報到達，請選下一個數字。'
                        : '此格已依令安放。請先選下一封電報上的數字，再標座標。'
                    }${dynamicMineMsg}`,
            }
          : null
      );
    }

    setMovingSoldier(null);
    setSelectedHandIndex(null);
  };

  const fillPercentage = gameState
    ? ((gameState.placedNumbers.length + gameState.revealedMines.size + gameState.revealedClear.size + gameState.dynamicMines.size) /
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
