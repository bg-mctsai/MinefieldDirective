import type { LossChainPhase } from './lossExplosionChain';
import { GAME_FIXED, sub } from './gameFixedMessages';

export function boardCellTooltipText(opts: {
  isConflict: boolean;
  placedValue: number | undefined;
  /** 引爆危機：此格為炸點且仍有倒數時傳入（秒數）；方格盤用 */
  blastPointCountdown?: number;
  isDynamicMine: boolean;
  neutralBonusTarget: boolean;
  isMine: boolean;
  lossChainPhase: LossChainPhase;
  bonusSeconds: number;
  /** 乾谷據點：必須佈數字 */
  isDigitOutpost?: boolean;
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
  } = opts;
  if (isConflict) return T.conflict;
  if (placedValue !== undefined) return sub(T.placedDigit, { value: placedValue });
  if (blastPointCountdown !== undefined) return T.blastPoint;
  if (isDigitOutpost) return T.digitOutpost;
  if (isDynamicMine) return T.dynamicJunkMine;
  if (neutralBonusTarget) return sub(T.bonusTargetMine, { seconds: bonusSeconds });
  if (isMine || lossChainPhase !== 'none') return T.mineCounts;
  return T.emptyPlaceable;
}
