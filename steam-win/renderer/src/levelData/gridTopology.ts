import type { GridSystem } from './types';
import { hexEdgeNeighborKeys } from './hexGrid';
import { triangleEdgeNeighborKeys } from './triangleGrid';

export type NeighborMode = 'MOORE' | 'TRIANGLE' | 'HEXAGON';

const cellKey = (x: number, y: number) => `${x},${y}`;

export function mooreNeighborKeys(x: number, y: number, validKeys: Set<string>): string[] {
  const neighbors: string[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const k = cellKey(x + dx, y + dy);
      if (validKeys.has(k)) neighbors.push(k);
    }
  }
  return neighbors;
}

export function logicNeighborKeys(
  x: number,
  y: number,
  validKeys: Set<string>,
  mode: NeighborMode,
  boardW: number,
  boardH: number
): string[] {
  if (mode === 'MOORE') return mooreNeighborKeys(x, y, validKeys);
  if (mode === 'HEXAGON') return hexEdgeNeighborKeys(x, y, boardW, boardH, validKeys);
  return triangleEdgeNeighborKeys(x, y, boardW, boardH, validKeys);
}

export function neighborModeForGridSystem(gs: GridSystem): NeighborMode {
  if (gs === 'TRIANGLE') return 'TRIANGLE';
  if (gs === 'HEXAGON') return 'HEXAGON';
  return 'MOORE';
}

/** 敗北台詞用：兩格是否在「邏輯鄰接圖」上相鄰（三角為邊鄰接，其餘為八鄰） */
export function areLogicNeighbors(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  validKeys: Set<string>,
  mode: NeighborMode,
  boardW: number,
  boardH: number
): boolean {
  const bk = cellKey(bx, by);
  return logicNeighborKeys(ax, ay, validKeys, mode, boardW, boardH).includes(bk);
}

/**
 * 自動揭曉強制格時的「鄰近」範圍：方格為切比雪夫距離；三角格為僅沿三角邊相接的圖距離 ≤ maxDist。
 */
export function withinForcedRevealZone(
  targetKey: string,
  centerX: number,
  centerY: number,
  maxDist: number,
  validKeys: Set<string>,
  mode: NeighborMode,
  boardW: number,
  boardH: number
): boolean {
  const comma = targetKey.indexOf(',');
  const tx = Number(targetKey.slice(0, comma));
  const ty = Number(targetKey.slice(comma + 1));
  if (!Number.isFinite(tx) || !Number.isFinite(ty)) return false;

  if (mode === 'MOORE') {
    return Math.max(Math.abs(tx - centerX), Math.abs(ty - centerY)) <= maxDist;
  }

  if (mode === 'TRIANGLE' || mode === 'HEXAGON') {
    const goal = targetKey;
    const start = cellKey(centerX, centerY);
    if (goal === start) return true;

    const queue: { x: number; y: number; d: number }[] = [{ x: centerX, y: centerY, d: 0 }];
    const seen = new Set<string>([start]);

    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (cur.d >= maxDist) continue;
      const nextD = cur.d + 1;
      for (const nk of logicNeighborKeys(cur.x, cur.y, validKeys, mode, boardW, boardH)) {
        if (nk === goal) return true;
        if (seen.has(nk)) continue;
        seen.add(nk);
        const c = nk.indexOf(',');
        queue.push({
          x: Number(nk.slice(0, c)),
          y: Number(nk.slice(c + 1)),
          d: nextD,
        });
      }
    }
    return false;
  }

  return false;
}
