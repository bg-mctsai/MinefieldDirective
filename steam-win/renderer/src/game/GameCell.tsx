import React from 'react';
import { motion } from 'motion/react';
import { Bomb } from 'lucide-react';
import { MineRuins } from './MineRuins';

export interface GameCellProps {
  x: number;
  y: number;
  placed?: { value: number };
  isMine: boolean;
  isConflict: boolean;
  isExploding: boolean;
  status: string;
  onClick: (x: number, y: number) => void;
}

const GameCellComponent = ({
  x,
  y,
  placed,
  isMine,
  isConflict,
  isExploding,
  status,
  onClick,
}: GameCellProps) => {
  const postBlast = status === 'exploding' || status === 'lost';
  return (
  <motion.div
    whileHover={status === 'playing' ? { scale: 1.05, backgroundColor: '#1e293b' } : {}}
    onClick={() => onClick(x, y)}
    className={`relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border transition-all
      ${
        isConflict
          ? 'z-10 animate-pulse border-2 border-white bg-red-600 shadow-lg ring-4 ring-red-500/50'
          : placed
            ? 'border-2 border-amber-500 bg-amber-900/40'
            : isMine
              ? postBlast
                ? 'border border-stone-600/70 bg-stone-950/55'
                : 'border border-red-900 bg-red-950/40'
              : 'border border-slate-700 bg-slate-800 hover:border-amber-500/50'
      }
    `}
  >
    {placed && (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`text-xl font-black ${isConflict ? 'text-white' : 'text-amber-400'}`}
      >
        {placed.value}
      </motion.span>
    )}
    {isMine && !placed && (
      <div className="pointer-events-none flex items-center justify-center">
        {postBlast ? (
          <MineRuins x={x} y={y} exploding={isExploding} />
        ) : (
          <Bomb size={20} className="text-red-400 opacity-60" />
        )}
      </div>
    )}
  </motion.div>
  );
};

export const GameCell = React.memo(GameCellComponent);
