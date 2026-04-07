import React from 'react';
import { motion } from 'motion/react';
import { Bomb } from 'lucide-react';
import { MineRuins } from './MineRuins';

export interface GameCellProps {
  x: number;
  y: number;
  /** 棋格邊長（px），預設 40 */
  cellSizePx?: number;
  placed?: { value: number };
  isMine: boolean;
  isConflict: boolean;
  isExploding: boolean;
  /** 邏輯敗北：放錯前八鄰已強制的雷，畫 X 標出引爆關聯 */
  showExplosionX?: boolean;
  /** 這格是可觸發加秒的戰術目標 */
  isBonusTarget?: boolean;
  /** 這格目標已完成並領過獎勵 */
  isBonusTargetRewarded?: boolean;
  /** 目標雷確認當下的加秒浮字效果 */
  showBonusFx?: boolean;
  /** 浮字顯示的秒數值 */
  bonusSeconds?: number;
  status: string;
  onClick: (x: number, y: number) => void;
}

const GameCellComponent = ({
  x,
  y,
  cellSizePx = 40,
  placed,
  isMine,
  isConflict,
  isExploding,
  showExplosionX = false,
  isBonusTarget = false,
  isBonusTargetRewarded = false,
  showBonusFx = false,
  bonusSeconds = 5,
  status,
  onClick,
}: GameCellProps) => {
  const postBlast = status === 'exploding' || status === 'lost';
  const numFont = Math.max(13, Math.round(cellSizePx * 0.48));
  const iconSize = Math.max(14, Math.round(cellSizePx * 0.45));
  /** 加秒目標格：邏輯上可已揭示為雷，但畫面維持中性，不套用紅色「已確認雷」 */
  const neutralBonusTarget = Boolean(isBonusTarget && !placed && !isConflict);
  return (
  <motion.div
    whileHover={status === 'playing' ? { scale: 1.05, backgroundColor: '#1e293b' } : {}}
    onClick={() => onClick(x, y)}
    style={{ width: cellSizePx, height: cellSizePx, minWidth: cellSizePx, minHeight: cellSizePx }}
    className={`relative flex cursor-pointer items-center justify-center rounded-xl border transition-all
      ${
        isConflict
          ? 'z-10 animate-pulse border-2 border-white bg-red-600 shadow-lg ring-4 ring-red-500/50'
          : placed
            ? 'border-2 border-amber-500 bg-amber-900/40'
            : postBlast && isMine
              ? 'border border-stone-600/70 bg-stone-950/55'
              : neutralBonusTarget
                ? 'border border-slate-700 bg-slate-800 hover:border-amber-500/50'
                : isMine
                  ? 'border border-red-900 bg-red-950/40'
                  : 'border border-slate-700 bg-slate-800 hover:border-amber-500/50'
      }
    `}
  >
    {placed && (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        style={{ fontSize: numFont }}
        className={`font-black leading-none ${isConflict ? 'text-white' : 'text-amber-400'}`}
      >
        {placed.value}
      </motion.span>
    )}
    {isMine && !placed && !neutralBonusTarget && (
      <div className="pointer-events-none flex items-center justify-center">
        {postBlast ? (
          <MineRuins x={x} y={y} exploding={isExploding} />
        ) : (
          <Bomb size={iconSize} className="text-red-400 opacity-60" />
        )}
      </div>
    )}
    {showExplosionX && postBlast && (
      <div
        className="pointer-events-none absolute inset-0.5 z-20 flex items-center justify-center"
        aria-hidden
      >
        <svg
          viewBox="0 0 100 100"
          className="h-[82%] w-[82%] text-rose-400 drop-shadow-[0_0_6px_rgba(0,0,0,0.85)]"
          fill="none"
        >
          <line x1="18" y1="18" x2="82" y2="82" stroke="currentColor" strokeWidth="11" strokeLinecap="round" />
          <line x1="82" y1="18" x2="18" y2="82" stroke="currentColor" strokeWidth="11" strokeLinecap="round" />
        </svg>
      </div>
    )}
    {neutralBonusTarget && !postBlast && (
      <div className="pointer-events-none absolute inset-0 z-[15] flex items-center justify-center">
        <Bomb
          size={Math.max(16, Math.round(cellSizePx * 0.44))}
          className={
            isBonusTargetRewarded
              ? 'text-white/50 drop-shadow-[0_0_2px_rgba(0,0,0,0.65)]'
              : 'text-white/80 drop-shadow-[0_0_3px_rgba(0,0,0,0.8)]'
          }
        />
      </div>
    )}
    {postBlast && isMine && neutralBonusTarget && (
      <div className="pointer-events-none flex items-center justify-center">
        <MineRuins x={x} y={y} exploding={isExploding} />
      </div>
    )}
    {showBonusFx && (
      <motion.div
        initial={{ y: 6, opacity: 0, scale: 0.92 }}
        animate={{ y: -14, opacity: 1, scale: 1.04 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="pointer-events-none absolute z-[22] font-black text-emerald-300 drop-shadow-[0_0_6px_rgba(16,185,129,0.75)]"
        style={{ fontSize: Math.max(12, Math.round(cellSizePx * 0.38)) }}
      >
        +{bonusSeconds}
      </motion.div>
    )}
  </motion.div>
  );
};

export const GameCell = React.memo(GameCellComponent);
