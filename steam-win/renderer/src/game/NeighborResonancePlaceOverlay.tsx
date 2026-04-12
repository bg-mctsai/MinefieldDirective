import { motion } from 'motion/react';
import { overlayBoardCellCenterPx, type OverlayBoardLayout } from './overlayBoardCellCenter';

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
  triangleSvgTranslate,
}: {
  layout: OverlayBoardLayout;
  x: number;
  y: number;
  shownValue: number;
  cellSize: number;
  hexMin?: { x: number; y: number };
  squareGridMin?: { x: number; y: number };
  triangleSvgTranslate?: { x: number; y: number };
}) {
  const { cx, cy } = overlayBoardCellCenterPx(
    layout,
    x,
    y,
    cellSize,
    layout === 'hex' ? hexMin : undefined,
    layout === 'square' ? squareGridMin : undefined,
    layout === 'triangle' ? triangleSvgTranslate : undefined,
  );

  const numFont =
    layout === 'square'
      ? Math.max(15, Math.round(cellSize * 0.52))
      : layout === 'triangle'
        ? Math.max(13, Math.round(cellSize * 0.36))
        : Math.max(13, Math.round(cellSize * 0.42));

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
      <span
        className="font-black tabular-nums text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]"
        style={{ fontSize: numFont }}
      >
        {shownValue}
      </span>
    </motion.div>
  );
}
