import type { GridSystem } from '../levelData/types';
import { logicNeighborKeys, neighborModeForGridSystem, type NeighborMode } from '../levelData/gridTopology';

/** 此雷與幾個「已佈署數字格」邏輯相鄰；每多一格數字就多一個線索指向此雷（與 solver 鄰接定義一致）。 */
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

/**
 * 火力分級（僅視覺／提示）：≥2 個已佈數字格與此雷「邏輯相鄰」＝兩個或以上數字都指向同一雷 → 2，否則 1。
 */
export function mineCombatTier(adjacentPlacedDigits: number): 1 | 2 {
  return adjacentPlacedDigits >= 2 ? 2 : 1;
}

/** 預設：每雷權重封頂在「兩個已佈數字格」；賽琳娜交會測繪為不封頂（完整 n）。 */
export type FirepowerDigitWeightMode = 'capTwo' | 'fullCount';

/**
 * HUD「火力 %」分子：每顆已揭示雷加權（至少 1）；`capTwo` 時與已佈數字相鄰數封頂在 2，`fullCount` 時為完整相鄰數。
 * 分母仍為可玩總格數；% 上限 100。
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
    const capped = Math.max(1, Math.min(n, 2));
    const full = Math.max(1, n);
    weightedSum += digitWeightMode === 'fullCount' ? full : capped;
  }
  return {
    weightedSum,
    pct: Math.min(100, (weightedSum / totalCells) * 100),
    totalCells,
  };
}

/** 1＝基本雷：淺紅；2＝多數字指向同一雷：亮紅＋強光暈。 */
export function redMineBombIconClass(tier: 1 | 2): string {
  return tier >= 2
    ? 'text-red-200 drop-shadow-[0_0_10px_rgba(239,68,68,0.92)]'
    : 'text-red-400/90 drop-shadow-[0_0_4px_rgba(248,113,113,0.35)]';
}

export function cyanJunkMineBombIconClass(tier: 1 | 2): string {
  return tier >= 2
    ? 'text-cyan-200 drop-shadow-[0_0_12px_rgba(34,211,238,0.88)]'
    : 'text-cyan-400 opacity-75 drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]';
}
