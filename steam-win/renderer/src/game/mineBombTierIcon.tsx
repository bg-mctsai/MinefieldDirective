import { Bomb, Crosshair, Flame, Sparkles, Zap, type LucideIcon } from 'lucide-react';
import type { MineBombVisualTier } from './mineCombatVisual';

const TIER_ICONS: readonly LucideIcon[] = [Bomb, Crosshair, Flame, Zap, Sparkles];

/** 依火力視覺階選用不同 Lucide 圖示。 */
export function MineTierBombIcon({
  tier,
  size,
  className,
}: {
  tier: MineBombVisualTier;
  size: number;
  className: string;
}) {
  const Icon = TIER_ICONS[Math.max(0, Math.min(4, tier - 1))] ?? Bomb;
  return <Icon size={size} className={className} />;
}
