import type { LossChainPhase } from './lossExplosionChain';
import { GAME_FIXED, sub } from './gameFixedMessages';
import {
  convergenceFirepowerWeightFromTier,
  type FirepowerDigitWeightMode,
  type MineBombVisualTier,
} from './mineCombatVisual';

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
  /** 僅地雷／廢雷：火力視覺階 1～5 */
  mineCombatTier?: MineBombVisualTier;
  /** 與目前選中幹員火力加權模式一致（賽琳娜格網倍乘 tooltip 顯示 2／4／8） */
  fireDigitMode?: FirepowerDigitWeightMode;
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
    fireDigitMode = 'capTwo',
  } = opts;
  const tier = mineCombatTier ?? 1;
  if (isConflict) return T.conflict;
  if (placedValue !== undefined) return sub(T.placedDigit, { value: placedValue });
  if (blastPointCountdown !== undefined) return T.blastPoint;
  if (isDigitOutpost) return T.digitOutpost;
  if (isDynamicMine) return T.dynamicJunkMine;
  if (neutralBonusTarget) return sub(T.bonusTargetMine, { seconds: bonusSeconds });
  if (isMine || lossChainPhase !== 'none') {
    if (isMine && fireDigitMode === 'convergenceExp' && tier >= 2) {
      const w = convergenceFirepowerWeightFromTier(tier);
      return `地雷（格網倍乘 火力 ${w}）：多格已佈數字緊鄰此雷`;
    }
    if (isMine && tier >= 2) return T.mineCountsHigh;
    return T.mineCounts;
  }
  return T.emptyPlaceable;
}
