import { motion } from 'motion/react';
import { overlayBoardCellCenterPx, type OverlayBoardLayout } from './overlayBoardCellCenter';
import { placedCommandDigitClassName, placedCommandDigitFontPx } from './mineCombatVisual';

/**
 * 鄰焰共振：落子格上「底數 → 逐格 +1」的疊加數字（與 Soldier 同座標系：盤面 p-3 內容區）。
 */
export function NeighborResonancePlaceOverlay({
  layout,
  x,
  y,
  shownValue,
  cellSize,
  hexMin,
  squareGridMin,
}: {
  layout: OverlayBoardLayout;
  x: number;
  y: number;
  shownValue: number;
  cellSize: number;
  hexMin?: { x: number; y: number };
  squareGridMin?: { x: number; y: number };
}) {
  const { cx, cy } = overlayBoardCellCenterPx(
    layout,
    x,
    y,
    cellSize,
    layout === 'hex' ? hexMin : undefined,
    layout === 'square' ? squareGridMin : undefined,
  );

  const commandDigitFont = placedCommandDigitFontPx(cellSize);

  return (
    <motion.div
      key={shownValue}
      initial={{ scale: 0.82, opacity: 0.65 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 520, damping: 22 }}
      className="pointer-events-none absolute z-[28] flex items-center justify-center"
      style={{
        left: cx,
        top: cy,
        width: layout === 'square' ? cellSize : cellSize * 1.2,
        height: layout === 'square' ? cellSize : cellSize * 1.2,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <span className={placedCommandDigitClassName(false)} style={{ fontSize: commandDigitFont }}>
        {shownValue}
      </span>
    </motion.div>
  );
}
