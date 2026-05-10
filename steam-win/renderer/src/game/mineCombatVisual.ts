import type { GridSystem } from '../levelData/types';
import { logicNeighborKeys, neighborModeForGridSystem, type NeighborMode } from '../levelData/gridTopology';

/** 此雷與幾個「已佈署數字格」邏輯相鄰；每多一格數字就多一道指向此雷的讀數（與 solver 鄰接定義一致）。 */
export function adjacentPlacedDigitCount(
  x: number,
  y: number,
  placedByKey: ReadonlyMap<string, unknown>,
  validKeys: Set<string>,
  mode: NeighborMode,
  boardW: number,
  boardH: number,
): number {
  let n = 0;
  for (const nk of logicNeighborKeys(x, y, validKeys, mode, boardW, boardH)) {
    if (placedByKey.has(nk)) n++;
  }
  return n;
}

/** 賽琳娜格網倍乘：單顆雷火力分子加權上限（對應 n≥5 緊鄰已佈數字）。 */
export const SELINA_GRID_FIREPOWER_WEIGHT_MAX = 16;

/** 地雷／廢雷圖示與格底色階（1 基礎 → 5 為倍乘封頂階）。 */
export type MineBombVisualTier = 1 | 2 | 3 | 4 | 5;

/**
 * `capTwo`：每顆雷旁邊有幾格「已佈數字」當讀數；權重 = 1（無或一格）～最多 2（兩格以上仍為 2）。
 * `convergenceExp`：賽琳娜格網倍乘——0～1 格鄰數權重 1；2 格起每多一格 ×2，上限 {@link SELINA_GRID_FIREPOWER_WEIGHT_MAX}。
 */
export type FirepowerDigitWeightMode = 'capTwo' | 'convergenceExp';

/**
 * `capTwo`：僅 1／2 兩階視覺（與火力封頂一致）。
 * `convergenceExp`：賽琳娜格網倍乘——依緊鄰已佈數字格數分 5 階（n≥5 併入第 5 階，權重封頂 16）。
 */
export function mineBombVisualTier(
  adjacentPlacedDigits: number,
  digitWeightMode: FirepowerDigitWeightMode,
): MineBombVisualTier {
  const n = adjacentPlacedDigits;
  if (digitWeightMode === 'capTwo') {
    return (n >= 2 ? 2 : 1) as MineBombVisualTier;
  }
  if (n <= 1) return 1;
  if (n === 2) return 2;
  if (n === 3) return 3;
  if (n === 4) return 4;
  return 5;
}

/** @deprecated 請用 `mineBombVisualTier(n, 'capTwo')`；保留舊呼叫點相容。 */
export function mineCombatTier(adjacentPlacedDigits: number): MineBombVisualTier {
  return mineBombVisualTier(adjacentPlacedDigits, 'capTwo');
}

/** 單顆已揭示雷依「與幾格已佈數字邏輯相鄰」計入火力分子的權重。 */
export function firepowerWeightForAdjacentDigitCount(
  adjacentPlacedDigits: number,
  mode: FirepowerDigitWeightMode,
): number {
  const n = adjacentPlacedDigits;
  if (mode === 'capTwo') return Math.max(1, Math.min(n, 2));
  if (n <= 1) return 1;
  return Math.min(2 ** (n - 1), SELINA_GRID_FIREPOWER_WEIGHT_MAX);
}

/** 依視覺階推算格網倍乘火力加權（tooltip 用，與 {@link firepowerWeightForAdjacentDigitCount} 在賽琳娜側一致）。 */
export function convergenceFirepowerWeightFromTier(tier: MineBombVisualTier): number {
  if (tier <= 1) return 1;
  return Math.min(2 ** (tier - 1), SELINA_GRID_FIREPOWER_WEIGHT_MAX);
}

/**
 * HUD「火力 %」分子：每顆已揭示雷依模式加權；分母為可玩總格數；% 上限 100。
 */
export function weightedFirepowerSumAndPct(
  mineKeys: Iterable<string>,
  placedNumbers: ReadonlyArray<{ x: number; y: number; value: number }>,
  levelCells: ReadonlyArray<{ x: number; y: number }>,
  gridSystem: GridSystem,
  boardW: number,
  boardH: number,
  digitWeightMode: FirepowerDigitWeightMode = 'capTwo',
): { weightedSum: number; pct: number; totalCells: number } {
  const totalCells = levelCells.length;
  if (totalCells <= 0) return { weightedSum: 0, pct: 0, totalCells: 0 };
  const validKeys = new Set(levelCells.map((c) => `${c.x},${c.y}`));
  const placedByKey = new Map(placedNumbers.map((p) => [`${p.x},${p.y}`, p]));
  const mode = neighborModeForGridSystem(gridSystem);
  let weightedSum = 0;
  for (const key of mineKeys) {
    const comma = key.indexOf(',');
    const x = Number(key.slice(0, comma));
    const y = Number(key.slice(comma + 1));
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const n = adjacentPlacedDigitCount(x, y, placedByKey, validKeys, mode, boardW, boardH);
    weightedSum += firepowerWeightForAdjacentDigitCount(n, digitWeightMode);
  }
  return {
    weightedSum,
    pct: Math.min(100, (weightedSum / totalCells) * 100),
    totalCells,
  };
}

/** 紅雷圖示：階越高色越亮、光暈越強（格網倍乘 3～5 階明顯區別）。 */
export function redMineBombIconClass(tier: MineBombVisualTier): string {
  switch (tier) {
    case 1:
      return 'text-red-400/90 drop-shadow-[0_0_4px_rgba(248,113,113,0.35)]';
    case 2:
      return 'text-red-200 drop-shadow-[0_0_10px_rgba(239,68,68,0.92)]';
    case 3:
      return 'text-orange-200 drop-shadow-[0_0_12px_rgba(251,146,60,0.95)]';
    case 4:
      return 'text-amber-100 drop-shadow-[0_0_14px_rgba(250,204,21,0.98)]';
    case 5:
    default:
      return 'text-yellow-50 drop-shadow-[0_0_16px_rgba(253,224,71,1)]';
  }
}

export function cyanJunkMineBombIconClass(tier: MineBombVisualTier): string {
  switch (tier) {
    case 1:
      return 'text-cyan-400 opacity-75 drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]';
    case 2:
      return 'text-cyan-200 drop-shadow-[0_0_12px_rgba(34,211,238,0.88)]';
    case 3:
      return 'text-sky-200 drop-shadow-[0_0_13px_rgba(56,189,248,0.92)]';
    case 4:
      return 'text-teal-100 drop-shadow-[0_0_14px_rgba(45,212,191,0.95)]';
    case 5:
    default:
      return 'text-emerald-100 drop-shadow-[0_0_16px_rgba(52,211,153,0.98)]';
  }
}
