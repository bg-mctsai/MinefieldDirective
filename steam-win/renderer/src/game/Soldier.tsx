import { motion } from 'motion/react';
import { BOARD_GAP_PX, GAME_BOARD_FRAME_PAD_PX } from './constants';
import { hexCenterScreenPx } from './hexBoardLayout';
import { HeroAvatarSilhouette } from '../home/HeroAvatarSilhouette';

export function Soldier({
  x,
  y,
  cellSize,
  heroId,
  layout = 'square',
  hexMin,
  squareGridMin,
}: {
  x: number;
  y: number;
  cellSize: number;
  /** 目前出戰幹員（棋盤上的工兵標記） */
  heroId: string;
  layout?: 'square' | 'hex';
  /** 蜂巢盤：與 HexGameBoardLayer 同一組 minX/minY（hexBoardContentSizePx） */
  hexMin?: { x: number; y: number };
  /** 方格盤：與 GameBoard 裁切後網格對齊（邏輯座標不變，僅顯示位移） */
  squareGridMin?: { x: number; y: number };
}) {
  const iconPx = cellSize * 0.55;
  const avatarPx = Math.max(20, Math.round(iconPx * 0.92));

  const avatarChip = (
    <div className="rounded-full border-2 border-slate-800 bg-slate-950/80 p-0.5 shadow-lg ring-1 ring-emerald-500/35">
      <HeroAvatarSilhouette heroId={heroId} size={avatarPx} />
    </div>
  );

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
        <div className="flex h-full w-full items-center justify-center">{avatarChip}</div>
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
      <div className="flex h-full w-full items-center justify-center">{avatarChip}</div>
    </motion.div>
  );
}
