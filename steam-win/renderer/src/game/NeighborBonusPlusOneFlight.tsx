import { motion } from 'motion/react';
import { NEIGHBOR_PLACED_BONUS_FLIGHT_MS } from './constants';
import { overlayBoardCellCenterPx, type OverlayBoardLayout } from './overlayBoardCellCenter';

/**
 * 鄰焰共振：「+1」從已佈數字鄰格中心飛向本次落子格（熱力傳導感）。
 */
export function NeighborBonusPlusOneFlight({
  layout,
  fromX,
  fromY,
  toX,
  toY,
  cellSize,
  hexMin,
  squareGridMin,
}: {
  layout: OverlayBoardLayout;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  cellSize: number;
  hexMin?: { x: number; y: number };
  squareGridMin?: { x: number; y: number };
}) {
  const centerArgs = [layout === 'hex' ? hexMin : undefined, layout === 'square' ? squareGridMin : undefined] as const;
  const from = overlayBoardCellCenterPx(layout, fromX, fromY, cellSize, ...centerArgs);
  const to = overlayBoardCellCenterPx(layout, toX, toY, cellSize, ...centerArgs);
  const font =
    layout === 'square'
      ? Math.max(12, Math.round(cellSize * 0.34))
      : Math.max(11, Math.round(cellSize * 0.3));

  return (
    <motion.div
      key={`${fromX},${fromY}->${toX},${toY}`}
      initial={{
        left: from.cx,
        top: from.cy,
        scale: 0.75,
        opacity: 0.55,
        filter: 'blur(0px)',
      }}
      animate={{
        left: to.cx,
        top: to.cy,
        scale: 1.12,
        opacity: 1,
        filter: 'blur(0px)',
      }}
      transition={{
        duration: NEIGHBOR_PLACED_BONUS_FLIGHT_MS / 1000,
        ease: [0.15, 0.85, 0.2, 1],
      }}
      className="pointer-events-none absolute z-[29] font-black tabular-nums text-orange-300 drop-shadow-[0_0_12px_rgba(251,146,60,0.95)]"
      style={{
        fontSize: font,
        transform: 'translate(-50%, -50%)',
      }}
    >
      +1
    </motion.div>
  );
}
