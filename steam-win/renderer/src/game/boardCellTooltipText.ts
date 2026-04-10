import type { LossChainPhase } from './lossExplosionChain';

export function boardCellTooltipText(opts: {
  isConflict: boolean;
  placedValue: number | undefined;
  isDynamicMine: boolean;
  neutralBonusTarget: boolean;
  isMine: boolean;
  lossChainPhase: LossChainPhase;
  bonusSeconds: number;
}): string {
  const {
    isConflict,
    placedValue,
    isDynamicMine,
    neutralBonusTarget,
    isMine,
    lossChainPhase,
    bonusSeconds,
  } = opts;
  if (isConflict) return '衝突格：此格與周邊雷數矛盾';
  if (placedValue !== undefined) return `已佈署數字 ${placedValue}`;
  if (isDynamicMine) return '廢雷：會佔格，但不計入任何鄰格雷數';
  if (neutralBonusTarget) return `目標地雷：確認可獲得 +${bonusSeconds} 秒`;
  if (isMine || lossChainPhase !== 'none') return '地雷：會計入周圍數字雷數';
  return '空格：可放置數字';
}
