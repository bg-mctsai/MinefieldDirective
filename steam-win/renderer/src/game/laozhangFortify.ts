import type { PlacedNumber } from './types';

/** 老張「加固模組」每關可用次數 */
export const LAOZHANG_FORTIFY_CHARGES_PER_LEVEL = 2;

export function initialLaozhangFortifyRemaining(heroId: string): number {
  return heroId === 'laozhang' ? LAOZHANG_FORTIFY_CHARGES_PER_LEVEL : 0;
}

/** 不參與 MineSolver 約束（錯格不引爆），但仍佔格、計火力、可鄰接加成 */
export function placementsForSolver(placed: readonly PlacedNumber[]): PlacedNumber[] {
  return placed.filter((p) => !p.fortifyFirepower);
}

export function isFortifyFirepowerPlacement(p: PlacedNumber | undefined): boolean {
  return Boolean(p?.fortifyFirepower);
}
