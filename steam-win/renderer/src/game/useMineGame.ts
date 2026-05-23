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
  NEIGHBOR_PLACED_BONUS_AFTER_LAND_MS,
  NEIGHBOR_PLACED_BONUS_FLIGHT_MS,
  NEIGHBOR_PLACED_BONUS_HOLD_BASE_MS,
  BOBBY_DOWNSHIFT_FX_MS,
  SOLDIER_MOVE_MS,
} from './constants';
import type { BobbyDownshiftFxState } from './BobbyDownshiftFxOverlay';
import {
  fallbackLossExplosionCellsFromRevealedKeys,
  sortLossExplosionCells,
  timeoutLossExplosionKeys,
} from './lossExplosionChain';

function mergeExplosionMarkCells(
  markCells: { x: number; y: number }[],
  revealedMines: ReadonlySet<string>,
  anchor: { x: number; y: number },
): { x: number; y: number }[] {
  if (markCells.length > 0) return markCells;
  return fallbackLossExplosionCellsFromRevealedKeys(revealedMines, anchor);
}
import { judgeMedal, resolveMedalThresholds, type Medal } from './medalThresholds';
import { weightedFirepowerSumAndPct } from './mineCombatVisual';
import { emit } from '../audio/AudioEngine';
import {
  bobbyDownshiftResolvedValue,
  canAttemptBobbyDownshift,
  initialBobbyDownshiftRemaining,
} from './bobbyDownshift';
import { generateHand } from './generateHand';
import { pickHeroAfterPlaceLine, pickHeroGameStatusLine, pickHeroVictoryStatusLine } from './heroGameStatusLines';
import { sub } from './gameFixedMessages';
import { signalJammingDisplayedDigit } from './signalJamming';
import { createSeededRngFromSeed, createSeededRngFromState } from './seededRng';
import {
  getStoredHeroId,
  HERO_CHANGED_EVENT,
  heroFirepowerDigitWeightMode,
  telegraphHandSlotCount,
} from '../heroes';
import type { GameState, MovingSoldierState } from './types';

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
  nextInt: (maxExclusive: number) => number,
  excludeKeys?: Set<string>,
): string | null {
  const numberKeys = new Set(placedNumbers.map((p) => `${p.x},${p.y}`));
  const candidates: string[] = [];
  for (const cell of cells) {
    const key = `${cell.x},${cell.y}`;
    if (excludeKeys?.has(key)) continue;
    if (occupied.has(key)) continue;
    const nbs = logicNeighborKeys(cell.x, cell.y, validKeys, neighborMode, boardW, boardH);
    if (nbs.some((nk) => numberKeys.has(nk))) continue;
    candidates.push(key);
  }
  if (candidates.length === 0) return null;
  return candidates[nextInt(candidates.length)];
}

/**
 * 火力：加權計分／總格（上限 100%）。每顆已確定雷依「與幾格已佈數字邏輯相鄰」加權：capTwo 封頂 2；賽琳娜格網倍乘為 min(2^(n−1),8)（n≥2）。
 * mineCount 仍為雷格數（副標「地雷 x/y」）。
 */
export function destructivePowerFromGameState(
  gs: GameState,
  heroId: string = getStoredHeroId(),
): {
  pct: number;
  mineCount: number;
  totalCells: number;
  weightedSum: number;
  overlapExtra: number;
} {
  const totalCells = gs.level.cells.length;
  if (totalCells <= 0)
    return { pct: 0, mineCount: 0, totalCells: 0, weightedSum: 0, overlapExtra: 0 };
  const mineKeys = new Set<string>(gs.revealedMines);
  const digitMode = heroFirepowerDigitWeightMode(heroId);
  const { pct, weightedSum } = weightedFirepowerSumAndPct(
    mineKeys,
    gs.placedNumbers,
    gs.level.cells,
    gs.level.definition.gridSystem,
    gs.level.width,
    gs.level.height,
    digitMode,
  );
  const mineCount = mineKeys.size;
  const overlapExtra = Math.max(0, weightedSum - mineCount);
  return { pct, mineCount, totalCells, weightedSum, overlapExtra };
}

function effectiveBonusTargetKeys(level: GameState['level']): Set<string> {
  const configuredBonusTargets = level.definition.mineBonusTargetCells;
  const effectiveBonusTargets =
    configuredBonusTargets && configuredBonusTargets.length > 0
      ? configuredBonusTargets
      : (level.definition.forcedMineCells ?? []);
  return new Set(effectiveBonusTargets.map(([tx, ty]) => `${tx},${ty}`));
}

/** 據點格不得為已揭示地雷或動態廢雷（畫面上皆為「炸彈」）。 */
function resolveDigitOutpostMineViolation(
  revealedMines: Set<string>,
  dynamicMines: Set<string>,
  digitOutposts: [number, number][] | undefined,
): { anchor: { x: number; y: number }; conflictCells: { x: number; y: number }[] } | null {
  const outs = digitOutposts ?? [];
  if (outs.length === 0) return null;
  const conflictCells: { x: number; y: number }[] = [];
  for (const [ox, oy] of outs) {
    const k = `${ox},${oy}`;
    if (revealedMines.has(k) || dynamicMines.has(k)) conflictCells.push({ x: ox, y: oy });
  }
  if (conflictCells.length === 0) return null;
  return { anchor: conflictCells[0], conflictCells };
}

export function useMineGame(initialLevelIndex: number) {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(() => initialLevelIndex);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(null);
  const [movingSoldier, setMovingSoldier] = useState<MovingSoldierState | null>(null);
  const [bonusFxKeys, setBonusFxKeys] = useState<string[]>([]);
  const [bobbyDownshiftFx, setBobbyDownshiftFx] = useState<BobbyDownshiftFxState | null>(null);
  const bonusFxTimeoutsRef = useRef<Map<string, number>>(new Map());
  const boardRef = useRef<HTMLDivElement>(null);

  const initGame = useCallback((levelIndex: number, runSeed?: string) => {
    const level = LEVELS[levelIndex];
    const actualRunSeed = runSeed ?? `lv${level.id}-t${Date.now()}`;
    const rng = createSeededRngFromSeed(actualRunSeed);
    const hints = level.initialHints ?? [];
    const limit = level.definition.timeLimit;
    const initBlastCountdown = new Map<string, number>();
    for (const bp of level.definition.blastPoints ?? []) {
      initBlastCountdown.set(`${bp.pos[0]},${bp.pos[1]}`, bp.countdownSec);
    }

    setGameState({
      gameId: Date.now(),
      runSeed: actualRunSeed,
      rngState: rng.state(),
      level,
      placedNumbers: [...hints],
      revealedMines: new Set(),
      revealedClear: new Set(),
      hand: generateHand(level, [...hints], rng, undefined, telegraphHandSlotCount(getStoredHeroId())),
      placedInTurn: 0,
      status: 'playing',
      message: pickHeroGameStatusLine(getStoredHeroId(), 'initTelegraph'),
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
      blastPointsCountdown: initBlastCountdown,
      buckEmergencyAvailable: getStoredHeroId() === 'laozhang',
      bobbyDownshiftRemaining: initialBobbyDownshiftRemaining(getStoredHeroId()),
      settledMedal: null,
      settledFillPercentage: null,
      settledSecondsLeft: null,
    });
    for (const t of bonusFxTimeoutsRef.current.values()) {
      window.clearTimeout(t);
    }
    bonusFxTimeoutsRef.current.clear();
    setBonusFxKeys([]);
    setBobbyDownshiftFx(null);
    setSelectedHandIndex(null);
    setMovingSoldier(null);
  }, []);

  useEffect(() => {
    initGame(currentLevelIndex);
  }, [currentLevelIndex, initGame]);

  /** 開局倒數未啟動前切換幹員：重抽電報手牌並更新開場台詞／老張加固狀態 */
  useEffect(() => {
    const onHeroChanged = (e: Event) => {
      const id = (e as CustomEvent<{ id?: string }>).detail?.id;
      if (!id) return;
      setGameState((prev) => {
        if (!prev || prev.status !== 'playing' || prev.timerStarted) return prev;
        const rng = createSeededRngFromState(prev.rngState);
        const hand = generateHand(
          prev.level,
          [...prev.placedNumbers],
          rng,
          undefined,
          telegraphHandSlotCount(id),
        );
        return {
          ...prev,
          rngState: rng.state(),
          hand,
          message: pickHeroGameStatusLine(id, 'initTelegraph'),
          buckEmergencyAvailable: id === 'laozhang',
          bobbyDownshiftRemaining: initialBobbyDownshiftRemaining(id),
        };
      });
      setSelectedHandIndex(null);
    };
    window.addEventListener(HERO_CHANGED_EVENT, onHeroChanged);
    return () => window.removeEventListener(HERO_CHANGED_EVENT, onHeroChanged);
  }, []);

  useEffect(
    () => () => {
      for (const t of bonusFxTimeoutsRef.current.values()) {
        window.clearTimeout(t);
      }
      bonusFxTimeoutsRef.current.clear();
    },
    [],
  );

  useEffect(() => {
    if (!gameState || gameState.status !== 'playing' || gameState.secondsLeft === null) return;
    if (!gameState.timerStarted) return;

    const id = window.setInterval(() => {
      setGameState((prev) => {
        if (!prev || prev.status !== 'playing' || prev.secondsLeft === null) return prev;
        const next = prev.secondsLeft - 1;
        if (next > 0) {
          if (next <= LAST_COUNTDOWN_SOUND_SECONDS) {
            queueMicrotask(() => emit('game.countdown.tick', { remainingSeconds: next }));
          }
          return { ...prev, secondsLeft: next };
        }
        queueMicrotask(() => emit('game.time.up'));
        return {
          ...prev,
          status: 'exploding',
          message: pickHeroGameStatusLine(getStoredHeroId(), 'timeUpExplosion'),
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

  // 引爆危機：炸點獨立倒數
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') return;
    if (!gameState.timerStarted) return;
    if (!gameState.level.definition.blastPoints?.length) return;

    const id = window.setInterval(() => {
      setGameState((prev) => {
        if (!prev || prev.status !== 'playing') return prev;
        if (prev.blastPointsCountdown.size === 0) return prev;

        const intervalBlastKeys = new Set<string>(
          (prev.level.definition.blastPoints ?? []).map((bp) => `${bp.pos[0]},${bp.pos[1]}`),
        );
        const baseTopo = mineSolverTopologyFromLevel(prev.level);
        const topo = mergeTopologyWithDynamicMines(baseTopo, prev.dynamicMines);
        const logicSolver = new MineSolver(prev.level.cells, prev.placedNumbers, {
          ...topo,
          forcedMineKeys: intervalBlastKeys, // 炸點為可見已知地雷
        });
        const logicForced = logicSolver.findForced(prev.placedNumbers);
        const forcedMinesSet = new Set(logicForced.mines);
        const forcedClearSet = new Set(logicForced.clear);
        const validKeysSet = new Set(prev.level.cells.map((c) => `${c.x},${c.y}`));
        const nMode = neighborModeForGridSystem(prev.level.definition.gridSystem);

        const newCountdown = new Map(prev.blastPointsCountdown);
        const newRevealedMines = new Set(prev.revealedMines);
        let addSeconds = 0;
        let shouldExplode = false;
        // 已放數字的格子是安全格（玩家明確放置），同樣視為已解決
        const placedKeys = new Set(prev.placedNumbers.map((p) => `${p.x},${p.y}`));

        for (const [key, remaining] of prev.blastPointsCountdown) {
          const [bx, by] = key.split(',').map(Number);
          const neighbors = logicNeighborKeys(bx, by, validKeysSet, nMode, prev.level.width, prev.level.height);
          const defused = neighbors.every(
            (k) => forcedMinesSet.has(k) || forcedClearSet.has(k) || placedKeys.has(k),
          );

          if (defused) {
            newCountdown.delete(key);
            // 解除後將炸點格加入 revealedMines，顯示地雷圖
            newRevealedMines.add(key);
            const bpDef = prev.level.definition.blastPoints?.find((bp) => `${bp.pos[0]},${bp.pos[1]}` === key);
            addSeconds += bpDef?.defuseBonusSec ?? 0;
          } else {
            const next = remaining - 1;
            if (next <= 0) {
              shouldExplode = true;
              newCountdown.set(key, 0);
            } else {
              newCountdown.set(key, next);
            }
          }
        }

        const outpostMineViol = resolveDigitOutpostMineViolation(
          newRevealedMines,
          prev.dynamicMines,
          prev.level.definition.digitOutposts,
        );
        if (outpostMineViol) {
          const { anchor, conflictCells: ocpCells } = outpostMineViol;
          const lossTopo = lossUiTopologyFromLevel(prev.level);
          let explosionMarkCells = lossExplosionMarkCells(
            prev.level.cells,
            prev.placedNumbers,
            anchor,
            lossTopo,
          );
          explosionMarkCells = mergeExplosionMarkCells(explosionMarkCells, newRevealedMines, anchor);
          const lossSequentialExplosionKeys = sortLossExplosionCells(explosionMarkCells, anchor);
          queueMicrotask(() => emit('game.time.up'));
          return {
            ...prev,
            blastPointsCountdown: newCountdown,
            revealedMines: newRevealedMines,
            status: 'exploding',
            message: pickHeroGameStatusLine(getStoredHeroId(), 'digitOutpostRevealedAsMine'),
            conflictCells: ocpCells,
            explosionMarkCells,
            lossSequentialExplosionKeys,
            lossExplosionWaveIndex: -1,
            secondsLeft: prev.secondsLeft === null ? null : Math.max(0, prev.secondsLeft + addSeconds),
          };
        }

        if (shouldExplode) {
          queueMicrotask(() => emit('game.time.up'));
          return {
            ...prev,
            blastPointsCountdown: newCountdown,
            status: 'exploding',
            message: pickHeroGameStatusLine(getStoredHeroId(), 'blastPointExplosion'),
            conflictCells: [],
            explosionMarkCells: [],
            lossSequentialExplosionKeys: timeoutLossExplosionKeys(
              prev.revealedMines,
              prev.dynamicMines,
              prev.level.definition.forcedMineCells,
            ),
            lossExplosionWaveIndex: -1,
          };
        }

        return {
          ...prev,
          blastPointsCountdown: newCountdown,
          revealedMines: newRevealedMines,
          secondsLeft: prev.secondsLeft === null ? null : Math.max(0, prev.secondsLeft + addSeconds),
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
      emit('game.mine.explode', { stepIndex: nextIdx });
      setGameState((prev) => {
        if (!prev || prev.status !== 'exploding') return prev;
        return { ...prev, lossExplosionWaveIndex: nextIdx };
      });
    }, delay);
    return () => clearTimeout(t);
  }, [gameState?.gameId, gameState?.status, gameState?.lossExplosionWaveIndex, gameState?.lossSequentialExplosionKeys]);

  // 已選槽再點同一槽略過（干擾關不重刷鎖定）。
  const selectHand = useCallback(
    (index: number) => {
      if (selectedHandIndex === index) return;

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
                prev.level.definition.gridSystem,
                getStoredHeroId(),
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
    },
    [selectedHandIndex],
  );

  const handleCellClick = async (x: number, y: number) => {
    if (!gameState || gameState.status !== 'playing' || selectedHandIndex === null || movingSoldier) return;

    const selectedIndex = selectedHandIndex;
    const cellKey = `${x},${y}`;
    if (gameState.placedNumbers.some((p) => p.x === x && p.y === y)) return;
    if (gameState.revealedMines.has(cellKey)) return;
    if (gameState.dynamicMines.has(cellKey)) return;
    // 引爆危機：炸點格視為已知地雷地形，不可點選
    const allBlastPointKeys = new Set(
      (gameState.level.definition.blastPoints ?? []).map((bp) => `${bp.pos[0]},${bp.pos[1]}`),
    );
    if (allBlastPointKeys.has(cellKey)) return;

    const jamActive =
      Boolean(gameState.level.definition.commandSlotReceiveJamming) && gameState.jammingEpochMs > 0;
    let telegramValue: number;
    if (jamActive) {
      const lock = gameState.jammingLockedSlot;
      if (!lock || lock.slotIndex !== selectedIndex) {
        setGameState((prev) =>
          prev
            ? {
                ...prev,
                message: pickHeroGameStatusLine(getStoredHeroId(), 'jammingSelectTelegraphFirst'),
              }
            : null,
        );
        return;
      }
      telegramValue = lock.value;
    } else {
      telegramValue = gameState.hand[selectedIndex];
    }

    // 落點已經提交，先清掉頂部選中態，避免動畫期間看起來像還卡著同一封電報。
    setSelectedHandIndex(null);

    // 僅讀關卡 JSON 的 neighborPlacedDigitBonus，不依章節或關卡號硬編碼
    let neighborBonusDigits = 0;
    const resonanceContributorCells: { x: number; y: number }[] = [];
    if (gameState.level.definition.neighborPlacedDigitBonus) {
      const validKeys = new Set(gameState.level.cells.map((c) => `${c.x},${c.y}`));
      const nMode = neighborModeForGridSystem(gameState.level.definition.gridSystem);
      const neighborKeys = logicNeighborKeys(x, y, validKeys, nMode, gameState.level.width, gameState.level.height);
      const placedKeySet = new Set(gameState.placedNumbers.map((p) => `${p.x},${p.y}`));
      for (const nk of neighborKeys) {
        if (!placedKeySet.has(nk)) continue;
        neighborBonusDigits += 1;
        const [nx, ny] = nk.split(',').map(Number);
        resonanceContributorCells.push({ x: nx, y: ny });
      }
      resonanceContributorCells.sort((a, b) => a.y - b.y || a.x - b.x);
    }
    const newValue = telegramValue + neighborBonusDigits;

    setMovingSoldier({
      x,
      y,
      value: newValue,
      baseValue: telegramValue,
      neighborBonus: neighborBonusDigits,
      phase: 'approach',
    });
    await new Promise((resolve) => setTimeout(resolve, SOLDIER_MOVE_MS));

    if (neighborBonusDigits > 0) {
      setMovingSoldier({
        x,
        y,
        value: newValue,
        baseValue: telegramValue,
        neighborBonus: neighborBonusDigits,
        phase: 'resonance',
        resonanceShown: telegramValue,
        resonanceContributorCells,
        flightFrom: null,
      });
      await new Promise((resolve) => setTimeout(resolve, NEIGHBOR_PLACED_BONUS_HOLD_BASE_MS));
      for (let step = 0; step < neighborBonusDigits; step++) {
        const from = resonanceContributorCells[step];
        setMovingSoldier((prev) =>
          prev && prev.phase === 'resonance' ? { ...prev, flightFrom: from } : prev,
        );
        await new Promise((resolve) => setTimeout(resolve, NEIGHBOR_PLACED_BONUS_FLIGHT_MS));
        const nextShown = telegramValue + step + 1;
        setMovingSoldier((prev) =>
          prev && prev.phase === 'resonance'
            ? { ...prev, resonanceShown: nextShown, flightFrom: null }
            : prev,
        );
        await new Promise((resolve) => setTimeout(resolve, NEIGHBOR_PLACED_BONUS_AFTER_LAND_MS));
      }
    }

    let placementValue = newValue;
    let newPlacedNumbers = [...gameState.placedNumbers, { x, y, value: placementValue }];
    const rng = createSeededRngFromState(gameState.rngState);
    const baseTopo = mineSolverTopologyFromLevel(gameState.level);
    const mineTopo = mergeTopologyWithDynamicMines(baseTopo, gameState.dynamicMines);
    // 炸點格視為已知地雷（forcedMine），讓 solver 正確計算鄰近格的數字約束
    const topoWithBlastPoints = {
      ...mineTopo,
      forcedMineKeys: new Set<string>([...(mineTopo.forcedMineKeys ?? new Set<string>()), ...allBlastPointKeys]),
    };
    const placementSolver = new MineSolver(gameState.level.cells, newPlacedNumbers, topoWithBlastPoints);
    let conflictDetails = placementSolver.getConflicts();

    let bobbyDownshiftConsumed = false;
    let bobbyDownshiftSaved = false;
    const heroId = getStoredHeroId();

    if (conflictDetails) {
      if (heroId === 'laozhang' && gameState.buckEmergencyAvailable) {
        setGameState((prev) =>
          prev
            ? {
                ...prev,
                status: 'playing',
                message: pickHeroGameStatusLine(getStoredHeroId(), 'buckEmergencySaved'),
                buckEmergencyAvailable: false,
                jammingLockedSlot: null,
              }
            : null,
        );
        setMovingSoldier(null);
        return;
      }

      if (
        heroId === 'bobby' &&
        gameState.bobbyDownshiftRemaining > 0 &&
        canAttemptBobbyDownshift(placementValue)
      ) {
        const reduced = bobbyDownshiftResolvedValue(
          gameState.level.cells,
          gameState.placedNumbers,
          x,
          y,
          placementValue,
          topoWithBlastPoints,
        );
        bobbyDownshiftConsumed = true;
        if (reduced !== null) {
          placementValue = reduced;
          newPlacedNumbers = [...gameState.placedNumbers, { x, y, value: placementValue }];
          conflictDetails = null;
          bobbyDownshiftSaved = true;
        } else {
          placementValue -= 1;
          newPlacedNumbers = [...gameState.placedNumbers, { x, y, value: placementValue }];
          conflictDetails = new MineSolver(
            gameState.level.cells,
            newPlacedNumbers,
            topoWithBlastPoints,
          ).getConflicts();
        }
      }

      if (conflictDetails) {
        const lossTopo = lossUiTopologyFromLevel(gameState.level);
        const conflictCells = lossConflictHighlightCells(conflictDetails, { x, y });
        let explosionMarkCells = lossExplosionMarkCells(
          gameState.level.cells,
          gameState.placedNumbers,
          { x, y },
          lossTopo,
        );
        explosionMarkCells = mergeExplosionMarkCells(explosionMarkCells, gameState.revealedMines, { x, y });
        const lossSequentialExplosionKeys = sortLossExplosionCells(explosionMarkCells, { x, y });
        const message = formatLossExplanation(
          conflictDetails,
          { x, y, value: placementValue, telegramValue },
          lossTopo,
          heroId,
        );
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
                bobbyDownshiftRemaining: bobbyDownshiftConsumed
                  ? Math.max(0, prev.bobbyDownshiftRemaining - 1)
                  : prev.bobbyDownshiftRemaining,
              }
            : null,
        );

        setMovingSoldier(null);
        return;
      }
    }

    if (bobbyDownshiftSaved) {
      setBobbyDownshiftFx({ x, y, fromValue: newValue, toValue: placementValue });
      setMovingSoldier((prev) => {
        if (!prev || prev.x !== x || prev.y !== y) return prev;
        if (prev.phase === 'resonance') {
          return { ...prev, value: placementValue, resonanceShown: placementValue };
        }
        return prev;
      });
      emit('game.bobby.downshift', { fromValue: newValue, toValue: placementValue });
      await new Promise((resolve) => setTimeout(resolve, BOBBY_DOWNSHIFT_FX_MS));
      setBobbyDownshiftFx(null);
    }

    emit('game.number.place', { value: placementValue });

    // 所有紅雷/空白揭示都只採「玩家可見」邏輯：炸點為可見已知地雷，隱藏 forcedMineCells 不納入。
    // 之前有同時跑一份含隱藏先驗的 solver.findForced，但其結果最終都會被 logicOnly 過濾掉，
    // 徒增一次完整 SAT 回溯；統一用 logicOnly 即可。
    const logicOnlySolver = new MineSolver(gameState.level.cells, newPlacedNumbers, {
      ...topoWithBlastPoints,
      forcedMineKeys: allBlastPointKeys,
    });
    const logicOnlyForced = logicOnlySolver.findForced(newPlacedNumbers);
    const logicOnlyForcedMines = new Set(logicOnlyForced.mines);
    const logicOnlyForcedClear = new Set(logicOnlyForced.clear);
    const bonusTargetKeys = effectiveBonusTargetKeys(gameState.level);
    const newRevealedMines = new Set(gameState.revealedMines);
    const newRevealedClear = new Set(gameState.revealedClear);
    const newlyConfirmedMines: string[] = [];
    const r = FORCED_AUTO_REVEAL_CHEBYSHEV_RADIUS;
    const validKeys = new Set(gameState.level.cells.map((c) => `${c.x},${c.y}`));
    const revealMode = topoWithBlastPoints.neighborMode;
    const bw = gameState.level.width;
    const bh = gameState.level.height;
    for (const m of logicOnlyForced.mines) {
      if (!withinForcedRevealZone(m, x, y, r, validKeys, revealMode, bw, bh)) continue;
      if (!newRevealedMines.has(m)) newlyConfirmedMines.push(m);
      newRevealedMines.add(m);
    }
    for (const targetKey of bonusTargetKeys) {
      if (!logicOnlyForcedMines.has(targetKey)) continue;
      if (!newRevealedMines.has(targetKey)) newlyConfirmedMines.push(targetKey);
      newRevealedMines.add(targetKey);
    }
    for (const c of logicOnlyForced.clear) {
      if (withinForcedRevealZone(c, x, y, r, validKeys, revealMode, bw, bh)) newRevealedClear.add(c);
    }

    // 引爆危機：炸點鄰域強制揭示（不受 Chebyshev 半徑限制）
    // 第一圈：炸點直接鄰格；第二圈：已放數字的鄰格也向外再揭一層，
    // 確保玩家在炸點周圍放數字後能立即看到所有被確認的地雷。
    const newPlacedKeySet = new Set(newPlacedNumbers.map((p) => `${p.x},${p.y}`));
    for (const [bpKey] of gameState.blastPointsCountdown) {
      const [bx, by] = bpKey.split(',').map(Number);
      const bpNeighbors = logicNeighborKeys(bx, by, validKeys, revealMode, bw, bh);

      const revealKey = (nk: string) => {
        if (logicOnlyForcedMines.has(nk)) {
          if (!newRevealedMines.has(nk)) newlyConfirmedMines.push(nk);
          newRevealedMines.add(nk);
        }
        if (logicOnlyForcedClear.has(nk)) newRevealedClear.add(nk);
      };

      for (const nk of bpNeighbors) revealKey(nk);

      for (const neighborKey of bpNeighbors) {
        if (!newPlacedKeySet.has(neighborKey)) continue;
        const [nx, ny] = neighborKey.split(',').map(Number);
        for (const nk2 of logicNeighborKeys(nx, ny, validKeys, revealMode, bw, bh)) {
          revealKey(nk2);
        }
      }
    }

    // 引爆危機：佈署後立即檢查炸點是否解除
    const newBlastCountdown = new Map(gameState.blastPointsCountdown);
    let blastBonusSeconds = 0;
    if (newBlastCountdown.size > 0) {
      const bpValidKeys = new Set(gameState.level.cells.map((c) => `${c.x},${c.y}`));
      const bpNMode = neighborModeForGridSystem(gameState.level.definition.gridSystem);
      // 已放數字的格子是安全格，視為已解決（solver 的 forcedClear 不包含已放數字格）
      const bpPlacedKeys = new Set(newPlacedNumbers.map((p) => `${p.x},${p.y}`));
      for (const [key] of newBlastCountdown) {
        const [bx, by] = key.split(',').map(Number);
        const neighbors = logicNeighborKeys(bx, by, bpValidKeys, bpNMode, gameState.level.width, gameState.level.height);
        if (neighbors.every((k) => logicOnlyForcedMines.has(k) || logicOnlyForcedClear.has(k) || bpPlacedKeys.has(k))) {
          newBlastCountdown.delete(key);
          // 解除後將炸點格加入 revealedMines，顯示地雷圖
          newRevealedMines.add(key);
          const bpDef = gameState.level.definition.blastPoints?.find((bp) => `${bp.pos[0]},${bp.pos[1]}` === key);
          blastBonusSeconds += bpDef?.defuseBonusSec ?? 0;
        }
      }
    }

    const newHand = [...gameState.hand];
    newHand.splice(selectedIndex, 1);

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
      const outpostExcl = new Set(
        (gameState.level.definition.digitOutposts ?? []).map(([ox, oy]) => `${ox},${oy}`),
      );
      const mineKey = pickDynamicMinePosition(
        gameState.level.cells,
        newPlacedNumbers,
        occupiedKeys,
        validKeys,
        gameState.level.width,
        gameState.level.height,
        nMode,
        (maxExclusive) => rng.nextInt(maxExclusive),
        outpostExcl,
      );
      if (mineKey) newDynamicMines.add(mineKey);
    }

    if (nextPlacedInTurn === 2) {
      finalHand = generateHand(
        gameState.level,
        newPlacedNumbers,
        rng,
        newDynamicMines,
        telegraphHandSlotCount(getStoredHeroId()),
      );
      finalPlacedInTurn = 0;
    }

    const nextBobbyDownshiftRemaining = bobbyDownshiftConsumed
      ? Math.max(0, gameState.bobbyDownshiftRemaining - 1)
      : gameState.bobbyDownshiftRemaining;

    const nextMineKeys = new Set<string>(newRevealedMines);
    const firepowerDigitMode = heroFirepowerDigitWeightMode(getStoredHeroId());
    const firepowerPct = weightedFirepowerSumAndPct(
      nextMineKeys,
      newPlacedNumbers,
      gameState.level.cells,
      gameState.level.definition.gridSystem,
      gameState.level.width,
      gameState.level.height,
      firepowerDigitMode,
    ).pct;
    const bonusSecondsPerMine = gameState.level.definition.mineBonusSeconds ?? 5;
    const newlyRewardedTargets = newlyConfirmedMines.filter(
      (k) => bonusTargetKeys.has(k) && !gameState.rewardedMineTargets.has(k)
    );
    const gainedSeconds =
      (gameState.secondsLeft !== null && bonusSecondsPerMine > 0
        ? newlyRewardedTargets.length * bonusSecondsPerMine
        : 0) + (gameState.secondsLeft !== null ? blastBonusSeconds : 0);
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

    const outpostMineViolAfterPlace = resolveDigitOutpostMineViolation(
      newRevealedMines,
      newDynamicMines,
      gameState.level.definition.digitOutposts,
    );
    if (outpostMineViolAfterPlace) {
      const { anchor, conflictCells: ocpCells } = outpostMineViolAfterPlace;
      const lossTopo = lossUiTopologyFromLevel(gameState.level);
      let explosionMarkCells = lossExplosionMarkCells(
        gameState.level.cells,
        gameState.placedNumbers,
        { x, y },
        lossTopo,
      );
      explosionMarkCells = mergeExplosionMarkCells(explosionMarkCells, newRevealedMines, { x, y });
      const lossSequentialExplosionKeys = sortLossExplosionCells(explosionMarkCells, { x, y });
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              placedNumbers: newPlacedNumbers,
              revealedMines: newRevealedMines,
              revealedClear: newRevealedClear,
              hand: finalHand,
              placedInTurn: finalPlacedInTurn,
              status: 'exploding',
              message: pickHeroGameStatusLine(getStoredHeroId(), 'digitOutpostRevealedAsMine'),
              conflictCells: ocpCells,
              explosionMarkCells,
              lossSequentialExplosionKeys,
              lossExplosionWaveIndex: -1,
              secondsLeft:
                prev.secondsLeft === null ? null : Math.max(0, prev.secondsLeft + gainedSeconds),
              rewardedMineTargets: nextRewardedMineTargets,
              dynamicMines: newDynamicMines,
              jammingLockedSlot: null,
              blastPointsCountdown: newBlastCountdown,
              rngState: rng.state(),
              bobbyDownshiftRemaining: nextBobbyDownshiftRemaining,
            }
          : null,
      );
      setMovingSoldier(null);
      setSelectedHandIndex(null);
      return;
    }

    const medalThresholds = resolveMedalThresholds(gameState.level.definition);
    const goldPct = medalThresholds.gold * 100;
    const outposts = gameState.level.definition.digitOutposts ?? [];
    const placedKeySetForOutpost = new Set(newPlacedNumbers.map((p) => `${p.x},${p.y}`));
    const outpostsIncomplete =
      outposts.length > 0 &&
      outposts.some(([ox, oy]) => !placedKeySetForOutpost.has(`${ox},${oy}`));

    if (firepowerPct >= goldPct) {
      if (outpostsIncomplete) {
        const lossTopo = lossUiTopologyFromLevel(gameState.level);
        const missing = outposts.filter(([ox, oy]) => !placedKeySetForOutpost.has(`${ox},${oy}`));
        let explosionMarkCells = lossExplosionMarkCells(
          gameState.level.cells,
          gameState.placedNumbers,
          { x, y },
          lossTopo,
        );
        explosionMarkCells = mergeExplosionMarkCells(explosionMarkCells, newRevealedMines, { x, y });
        const lossSequentialExplosionKeys = sortLossExplosionCells(explosionMarkCells, { x, y });
        setGameState((prev) =>
          prev
            ? {
                ...prev,
                placedNumbers: newPlacedNumbers,
                revealedMines: newRevealedMines,
                revealedClear: newRevealedClear,
                hand: finalHand,
                placedInTurn: finalPlacedInTurn,
                status: 'exploding',
                message: pickHeroGameStatusLine(getStoredHeroId(), 'digitOutpostIncomplete'),
                conflictCells: missing.map(([mx, my]) => ({ x: mx, y: my })),
                explosionMarkCells,
                lossSequentialExplosionKeys,
                lossExplosionWaveIndex: -1,
                secondsLeft:
                  prev.secondsLeft === null ? null : Math.max(0, prev.secondsLeft + gainedSeconds),
                rewardedMineTargets: nextRewardedMineTargets,
                dynamicMines: newDynamicMines,
                jammingLockedSlot: null,
                blastPointsCountdown: newBlastCountdown,
                rngState: rng.state(),
                bobbyDownshiftRemaining: nextBobbyDownshiftRemaining,
              }
            : null,
        );
        setMovingSoldier(null);
        setSelectedHandIndex(null);
        return;
      }
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
                  ? sub(pickHeroVictoryStatusLine(getStoredHeroId(), 'withTimeBonus'), {
                      seconds: gainedSeconds,
                    })
                  : pickHeroVictoryStatusLine(getStoredHeroId(), 'plain'),
              secondsLeft:
                prev.secondsLeft === null ? null : Math.max(0, prev.secondsLeft + gainedSeconds),
              rewardedMineTargets: nextRewardedMineTargets,
              dynamicMines: newDynamicMines,
              jammingLockedSlot: null,
              blastPointsCountdown: newBlastCountdown,
              rngState: rng.state(),
              settledMedal: 'gold' as Medal,
              settledFillPercentage: firepowerPct,
              settledSecondsLeft:
                prev.secondsLeft === null ? null : Math.max(0, prev.secondsLeft + gainedSeconds),
              bobbyDownshiftRemaining: nextBobbyDownshiftRemaining,
            }
          : null,
      );
    } else {
      const P = {
        dynamicMinePushed: pickHeroAfterPlaceLine(heroId, 'dynamicMinePushed'),
        newHandArrived: pickHeroAfterPlaceLine(heroId, 'newHandArrived'),
        awaitNextTelegraph: pickHeroAfterPlaceLine(heroId, 'awaitNextTelegraph'),
        mineBonusPrefix: (seconds: number) =>
          pickHeroAfterPlaceLine(heroId, 'mineBonusPrefix', { seconds }),
      };
      const dynamicMineMsg =
        newDynamicMines.size > gameState.dynamicMines.size ? P.dynamicMinePushed : '';
      const mid = finalPlacedInTurn === 0 ? P.newHandArrived : P.awaitNextTelegraph;
      const statusAfterPlace =
        gainedSeconds > 0
          ? `${P.mineBonusPrefix(gainedSeconds)}${mid}${dynamicMineMsg}`
          : `${mid}${dynamicMineMsg}`;
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
              blastPointsCountdown: newBlastCountdown,
              rngState: rng.state(),
              bobbyDownshiftRemaining: nextBobbyDownshiftRemaining,
              message: bobbyDownshiftSaved
                ? pickHeroGameStatusLine(heroId, 'bobbyDownshiftSaved', {
                    remaining: nextBobbyDownshiftRemaining,
                  })
                : statusAfterPlace,
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

  const destructivePower = gameState
    ? destructivePowerFromGameState(gameState)
    : { pct: 0, mineCount: 0, totalCells: 0, weightedSum: 0, overlapExtra: 0 };

  const medalThresholds = gameState
    ? resolveMedalThresholds(gameState.level.definition)
    : null;

  /** 對局中即時投影：若此刻結算可拿到的勳章（未達銅為 null） */
  const projectedMedal: Medal | null =
    gameState && medalThresholds ? judgeMedal(destructivePower.pct, medalThresholds) : null;

  const canEarlySettle =
    gameState != null && gameState.status === 'playing' && projectedMedal != null;

  /** 玩家主動「撤離」：達銅以上即可結算，醒目顯示當下勳章。 */
  const requestEarlySettle = useCallback(() => {
    setGameState((prev) => {
      if (!prev || prev.status !== 'playing') return prev;
      const firepowerPct = destructivePowerFromGameState(prev).pct;
      const t = resolveMedalThresholds(prev.level.definition);
      const m = judgeMedal(firepowerPct, t);
      if (!m) return prev;
      return {
        ...prev,
        status: 'won',
        message: pickHeroVictoryStatusLine(getStoredHeroId(), 'plain'),
        settledMedal: m,
        settledFillPercentage: firepowerPct,
        settledSecondsLeft: prev.secondsLeft,
      };
    });
    setMovingSoldier(null);
    setSelectedHandIndex(null);
  }, []);

  /** 測試捷徑：直接將當前對局標記為過關，便於驗證章節流轉與對話。 */
  const forceCompleteForTest = useCallback(() => {
    setGameState((prev) => {
      if (!prev || prev.status === 'won') return prev;
      const firepowerPct = destructivePowerFromGameState(prev).pct;
      const t = resolveMedalThresholds(prev.level.definition);
      const m = judgeMedal(firepowerPct, t) ?? 'bronze';
      return {
        ...prev,
        status: 'won',
        message: pickHeroVictoryStatusLine(getStoredHeroId(), 'plain'),
        settledMedal: m,
        settledFillPercentage: firepowerPct,
        settledSecondsLeft: prev.secondsLeft,
      };
    });
    setMovingSoldier(null);
    setSelectedHandIndex(null);
  }, []);

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
    forceCompleteForTest,
    fillPercentage,
    destructivePowerPercentage: destructivePower.pct,
    destructivePowerMineCount: destructivePower.mineCount,
    destructivePowerTotalCells: destructivePower.totalCells,
    destructivePowerOverlapExtra: destructivePower.overlapExtra,
    bonusFxKeys,
    bobbyDownshiftFx,
    medalThresholds,
    projectedMedal,
    canEarlySettle,
    requestEarlySettle,
  } as const;
}
