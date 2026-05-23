import { pickHeroCombatLine } from './gameFixedMessages';

export type HeroGameStatusKey =
  | 'initTelegraph'
  | 'timeUpExplosion'
  | 'blastPointExplosion'
  | 'digitOutpostIncomplete'
  | 'digitOutpostRevealedAsMine'
  | 'jammingSelectTelegraphFirst'
  | 'buckEmergencySaved'
  | 'bobbyDownshiftSaved';

export type HeroVictoryStatusKey = 'plain' | 'withTimeBonus';

export type HeroAfterPlaceKey =
  | 'newHandArrived'
  | 'awaitNextTelegraph'
  | 'mineBonusPrefix'
  | 'dynamicMinePushed';

export type HeroCommanderRowHintKey =
  | 'chainExploding'
  | 'missionOver'
  | 'selectTelegraphJammingIdle'
  | 'selectTelegraphNormal'
  | 'digitLockedPickCell'
  | 'pickTargetCellWithDigit';

export type HeroLossOperativeKey =
  | 'adjacentNeighborConflict'
  | 'correctDigitWrongCell'
  | 'digitMismatchClue'
  | 'genericUnsatisfiable';

export function pickHeroGameStatusLine(heroId: string, key: HeroGameStatusKey): string {
  return pickHeroCombatLine(heroId, 'gameStatus', key);
}

export function pickHeroVictoryStatusLine(heroId: string, key: HeroVictoryStatusKey): string {
  return pickHeroCombatLine(heroId, 'victoryStatus', key);
}

export function pickHeroAfterPlaceLine(
  heroId: string,
  key: HeroAfterPlaceKey,
  vars?: Record<string, string | number>,
): string {
  return pickHeroCombatLine(heroId, 'afterPlace', key, vars);
}

export function pickHeroCommanderRowHint(
  heroId: string,
  key: HeroCommanderRowHintKey,
  vars?: Record<string, string | number>,
): string {
  return pickHeroCombatLine(heroId, 'commanderRowHint', key, vars);
}

/** 邏輯放錯（鄰格衝突等）時，由出戰幹員口頭反應 */
export function pickHeroLossOperativeLine(
  heroId: string,
  key: HeroLossOperativeKey,
  vars: Record<string, string | number>,
): string {
  return pickHeroCombatLine(heroId, 'lossOperative', key, vars);
}
