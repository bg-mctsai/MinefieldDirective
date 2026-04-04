import { motion } from 'motion/react';
import { User } from 'lucide-react';
import { BOARD_GAP_PX } from './constants';

export function Soldier({ x, y, cellSize }: { x: number; y: number; cellSize: number }) {
  const step = cellSize + BOARD_GAP_PX;
  return (
    <motion.div
      initial={{ x: -100, y: -100, opacity: 0 }}
      animate={{ x: x * step, y: y * step, opacity: 1 }}
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
