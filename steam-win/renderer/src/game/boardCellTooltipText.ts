import type { LossChainPhase } from './lossExplosionChain';
import { GAME_FIXED, sub } from './gameFixedMessages';

export function boardCellTooltipText(opts: {
  isConflict: boolean;
  placedValue: number | undefined;
  /** 引爆危機：此格為炸點且仍有倒數時傳入（秒數）；方／三角／六角盤皆用 */
  blastPointCountdown?: number;
  isDynamicMine: boolean;
  neutralBonusTarget: boolean;
  isMine: boolean;
  lossChainPhase: LossChainPhase;
  bonusSeconds: number;
  /** 乾谷據點：必須佈數字 */
  isDigitOutpost?: boolean;
  /** 僅地雷／廢雷：兩個或以上數字指向此雷時為 2 */
  mineCombatTier?: 1 | 2;
}): string {
  const T = GAME_FIXED.cellTooltip;
  const {
    isConflict,
    placedValue,
    blastPointCountdown,
    isDynamicMine,
    neutralBonusTarget,
    isMine,
    lossChainPhase,
    bonusSeconds,
    isDigitOutpost,
    mineCombatTier,
  } = opts;
  if (isConflict) return T.conflict;
  if (placedValue !== undefined) return sub(T.placedDigit, { value: placedValue });
  if (blastPointCountdown !== undefined) return T.blastPoint;
  if (isDigitOutpost) return T.digitOutpost;
  if (isDynamicMine) {
    return mineCombatTier === 2 ? `${T.dynamicJunkMine}（火力 2）` : T.dynamicJunkMine;
  }
  if (neutralBonusTarget) return sub(T.bonusTargetMine, { seconds: bonusSeconds });
  if (isMine || lossChainPhase !== 'none') {
    return mineCombatTier === 2 && isMine ? T.mineCountsHigh : T.mineCounts;
  }
  return T.emptyPlaceable;
}
