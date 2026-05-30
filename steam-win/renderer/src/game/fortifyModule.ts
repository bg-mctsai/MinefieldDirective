import type { PlacedNumber } from './types';

/** 堡壘-09「加固模組」每關可用次數 */
export const FORTIFY_CHARGES_PER_LEVEL = 2;

export const FORTIFY_HERO_ID = 'tungsten';

export function initialFortifyRemaining(heroId: string): number {
  return heroId === FORTIFY_HERO_ID ? FORTIFY_CHARGES_PER_LEVEL : 0;
}

/** 不參與 MineSolver 約束（錯格不引爆），但仍佔格、計火力、可鄰接加成 */
export function placementsForSolver(placed: readonly PlacedNumber[]): PlacedNumber[] {
  return placed.filter((p) => !p.fortifyFirepower);
}

export function isFortifyFirepowerPlacement(p: PlacedNumber | undefined): boolean {
  return Boolean(p?.fortifyFirepower);
}

/** 佈署／降碼試算：加固火力格不列入 MineSolver 約束，僅併入本次試放格 */
export function solverConstraintsForPlacement(
  placed: readonly PlacedNumber[],
  trial: { x: number; y: number; value: number },
): PlacedNumber[] {
  return [...placementsForSolver(placed), trial];
}
