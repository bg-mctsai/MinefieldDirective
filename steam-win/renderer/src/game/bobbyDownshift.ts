import { MineSolver } from '../gameLogic';
import type { Level } from '../gameLogic';

type Placed = { x: number; y: number; value: number };

export type BobbyDownshiftTopo = Parameters<typeof MineSolver>[2];

/** 波比緊急降碼：僅當落點值 > 0 時可嘗試 −1 */
export function canAttemptBobbyDownshift(placementValue: number): boolean {
  return placementValue > 0;
}

/** 若降碼後無邏輯衝突則回傳新值；否則 null */
export function bobbyDownshiftResolvedValue(
  cells: Level['cells'],
  placedBefore: readonly Placed[],
  x: number,
  y: number,
  placementValue: number,
  topo: BobbyDownshiftTopo,
): number | null {
  if (!canAttemptBobbyDownshift(placementValue)) return null;
  const reduced = placementValue - 1;
  const trial = [...placedBefore, { x, y, value: reduced }];
  const conflict = new MineSolver(cells, trial, topo).getConflicts();
  return conflict ? null : reduced;
}
