import { motion } from 'motion/react';
import { MineTierBombIcon } from './mineBombTierIcon';
import {
  cyanJunkMineBombIconClass,
  junkMineBombIconOffsetYPx,
  mineFirepowerCellLabel,
  mineFirepowerDigitFontPx,
  mineFirepowerDigitTextClass,
  redMineBombIconClass,
  type FirepowerDigitWeightMode,
  type MineBombVisualTier,
} from './mineCombatVisual';

export function MineCellCombatDisplay({
  tier,
  fireDigitMode,
  iconSize,
  variant,
  cellExtentPx,
  animateEntry = false,
  popKey,
}: {
  tier: MineBombVisualTier;
  fireDigitMode: FirepowerDigitWeightMode;
  iconSize: number;
  variant: 'red' | 'cyan';
  /** 格邊長或蜂巢半徑 r，用於火力數字字級 */
  cellExtentPx: number;
  animateEntry?: boolean;
  /** 連鎖爆雷重播動畫 key */
  popKey?: number;
}) {
  const label = mineFirepowerCellLabel(tier, fireDigitMode);
  const fireFont = mineFirepowerDigitFontPx(cellExtentPx);
  const iconClass =
    variant === 'cyan' ? cyanJunkMineBombIconClass(tier) : redMineBombIconClass(tier);
  const iconPx = label != null ? Math.max(10, Math.round(iconSize * 0.58)) : iconSize;
  const junkIconOffsetY = variant === 'cyan' ? junkMineBombIconOffsetYPx(cellExtentPx) : 0;

  const inner = (
    <motion.div
      initial={animateEntry ? { scale: 0, rotate: -90 } : false}
      animate={animateEntry ? { scale: 1, rotate: 0 } : undefined}
      transition={animateEntry ? { type: 'spring', stiffness: 260, damping: 18 } : undefined}
      className="pointer-events-none flex flex-col items-center justify-center gap-px leading-none"
    >
      {label != null && (
        <span
          style={{ fontSize: fireFont }}
          className={`tabular-nums leading-none ${mineFirepowerDigitTextClass(label, variant)}`}
        >
          {label}
        </span>
      )}
      <span
        className="inline-flex leading-none"
        style={junkIconOffsetY > 0 ? { transform: `translateY(${junkIconOffsetY}px)` } : undefined}
      >
        <MineTierBombIcon tier={tier} size={iconPx} className={iconClass} />
      </span>
    </motion.div>
  );

  if (popKey != null) {
    return (
      <motion.div key={`lc-${popKey}`} className="flex items-center justify-center">
        {inner}
      </motion.div>
    );
  }
  return inner;
}
