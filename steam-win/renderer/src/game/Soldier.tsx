import { motion } from 'motion/react';
import { User } from 'lucide-react';
import { BOARD_GAP_PX, GAME_BOARD_FRAME_PAD_PX } from './constants';
import { hexCenterScreenPx } from './hexBoardLayout';

export function Soldier({
  x,
  y,
  cellSize,
  layout = 'square',
  hexMin,
  squareGridMin,
}: {
  x: number;
  y: number;
  cellSize: number;
  layout?: 'square' | 'hex';
  /** 蜂巢盤：與 HexGameBoardLayer 同一組 minX/minY（hexBoardContentSizePx） */
  hexMin?: { x: number; y: number };
  /** 方格盤：與 GameBoard 裁切後網格對齊（邏輯座標不變，僅顯示位移） */
  squareGridMin?: { x: number; y: number };
}) {
  const iconPx = cellSize * 0.55;

  if (layout === 'hex' && hexMin) {
    const { cx, cy } = hexCenterScreenPx(x, y, cellSize, hexMin.x, hexMin.y);
    const ox = GAME_BOARD_FRAME_PAD_PX + cx;
    const oy = GAME_BOARD_FRAME_PAD_PX + cy;
    return (
      <motion.div
        initial={{ left: ox, top: oy, x: '-50%', y: '-50%', opacity: 0, scale: 0.6 }}
        animate={{ left: ox, top: oy, x: '-50%', y: '-50%', opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="pointer-events-none absolute z-30"
        style={{ width: iconPx, height: iconPx }}
      >
        <div className="flex h-full w-full items-center justify-center">
          <div className="rounded-full border-2 border-slate-800 bg-emerald-600 p-1 shadow-lg">
            <User size={iconPx * 0.62} className="text-white" />
          </div>
        </div>
      </motion.div>
    );
  }

  const step = cellSize + BOARD_GAP_PX;
  const pad = GAME_BOARD_FRAME_PAD_PX;
  const ox = squareGridMin?.x ?? 0;
  const oy = squareGridMin?.y ?? 0;
  return (
    <motion.div
      initial={{ x: pad - 100, y: pad - 100, opacity: 0 }}
      animate={{ x: pad + (x - ox) * step, y: pad + (y - oy) * step, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      className="pointer-events-none absolute z-30"
      style={{ width: cellSize, height: cellSize }}
    >
      <div className="flex h-full w-full items-center justify-center">
        <div className="rounded-full border-2 border-slate-800 bg-emerald-600 p-1 shadow-lg">
          <User size={cellSize * 0.6} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
}
