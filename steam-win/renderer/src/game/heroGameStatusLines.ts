import { pickHeroCombatLine } from './gameFixedMessages';

export type HeroGameStatusKey =
  | 'initTelegraph'
  | 'timeUpExplosion'
  | 'blastPointExplosion'
  | 'digitOutpostIncomplete'
  | 'digitOutpostRevealedAsMine'
  | 'jammingSelectTelegraphFirst'
  | 'buckEmergencySaved'
  | 'fortifySaved'
  | 'fortifyLast'
  | 'laozhangCopyDone'
  | 'laozhangCopySelectHandFirst'
  | 'laozhangCopyEmpty'
  | 'bobbyDownshiftSaved';

export type HeroVictoryStatusKey = 'plain' | 'withTimeBonus';

export type HeroAfterPlaceKey =
  | 'newHandArrived'
  | 'awaitNextTelegraph'
  | 'mineBonusPrefix'
  | 'dynamicMinePushed'
  | 'neighborResonanceBonus';

export type HeroCommanderRowHintKey =
  | 'chainExploding'
  | 'missionOver'
  | 'selectTelegraphJammingIdle'
  | 'selectTelegraphNormal'
  | 'digitLockedPickCell'
  | 'pickTargetCellWithDigit'
  | 'pickTargetCellWithCopyDigit'
  | 'copySlotReadyToPaste';

export type HeroLossOperativeKey =
  | 'adjacentNeighborConflict'
  | 'correctDigitWrongCell'
  | 'digitMismatchClue'
  | 'genericUnsatisfiable';

export function pickHeroGameStatusLine(
  heroId: string,
  key: HeroGameStatusKey,
  vars?: Record<string, string | number>,
  chapter?: number,
): string {
  return pickHeroCombatLine(heroId, 'gameStatus', key, vars, chapter);
}

export function pickHeroVictoryStatusLine(heroId: string, key: HeroVictoryStatusKey): string {
  return pickHeroCombatLine(heroId, 'victoryStatus', key);
}

export function pickHeroAfterPlaceLine(
  heroId: string,
  key: HeroAfterPlaceKey,
  vars?: Record<string, string | number>,
  chapter?: number,
): string {
  return pickHeroCombatLine(heroId, 'afterPlace', key, vars, chapter);
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
