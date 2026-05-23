import React from 'react';
import { motion } from 'motion/react';
import { Bomb, MapPin } from 'lucide-react';
import type { LossChainPhase } from './lossExplosionChain';
import { boardCellTooltipText } from './boardCellTooltipText';
import {
  fortifyFirepowerDigitClassName,
  mineFirepowerDigitFontPx,
  placedCommandDigitClassName,
  placedCommandDigitFontPx,
  type FirepowerDigitWeightMode,
  type MineBombVisualTier,
} from './mineCombatVisual';
import type { PlacedNumber } from './types';
import { MineCellCombatDisplay } from './MineCellCombatDisplay';
import { PlaceHintOverlay } from './PlaceHintOverlay';

export interface GameCellProps {
  x: number;
  y: number;
  /** 棋格邊長（px），預設 40 */
  cellSizePx?: number;
  placed?: Pick<PlacedNumber, 'value' | 'fortifyFirepower'>;
  isMine: boolean;
  isConflict: boolean;
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
  /** 引爆危機：此格為炸點時的剩餘倒數秒數（undefined = 非炸點或已解除） */
  blastPointCountdown?: number;
  /** 戰術據點：必須佈署數字（levels.json digitOutposts） */
  isDigitOutpost?: boolean;
  /** 波比：選定電碼後的可放格提示 */
  isPlaceHint?: boolean;
  /** 深海要塞：動態新增的地雷（與 forcedMine 邏輯相同，視覺以青色區分） */
  isDynamicMine?: boolean;
  /** 火力視覺階 1～5（格網倍乘） */
  mineCombatTier?: MineBombVisualTier;
  fireDigitMode?: FirepowerDigitWeightMode;
  /** 敗北連鎖：違規地雷逐一爆；`none` 表示不在連鎖序列 */
  lossChainPhase?: LossChainPhase;
  /** 連鎖進度鍵，僅 `popping` 時用於重播動畫 key */
  lossChainPopKey?: number;
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
  showExplosionX = false,
  isBonusTarget = false,
  isBonusTargetRewarded = false,
  showBonusFx = false,
  bonusSeconds = 5,
  blastPointCountdown,
  isDigitOutpost = false,
  isPlaceHint = false,
  isDynamicMine = false,
  mineCombatTier: mineCombatTierProp = 1,
  fireDigitMode = 'capTwo',
  lossChainPhase = 'none',
  lossChainPopKey = 0,
  status,
  onClick,
}: GameCellProps) => {
  const postBlast = status === 'exploding' || status === 'lost';
  const commandDigitFont = placedCommandDigitFontPx(cellSizePx);
  const fortifyDigitFont = mineFirepowerDigitFontPx(cellSizePx);
  const isFortifyFirepower = Boolean(placed?.fortifyFirepower);
  const iconSize = Math.max(14, Math.round(cellSizePx * 0.45));
  /** 加秒目標格（未佈數字、無衝突）：空白目標格可疊白炸彈預覽；已揭示雷仍走紅雷樣式 */
  const neutralBonusTarget = Boolean(isBonusTarget && !placed && !isConflict);
  const hoverLift =
    status === 'playing' && !isDynamicMine && blastPointCountdown === undefined;
  /** 勿用 motion 的 backgroundColor hover：格狀態從「空」變「已揭示雷」時，inline 背景可能殘留、看起來像色偏／深紅 */
  const hoverTintClass =
    hoverLift && !isMine && !isConflict ? 'hover:bg-[#1e293b]' : '';
  const chainPopping = lossChainPhase === 'popping' && status === 'exploding';
  /** 已排入連鎖且已爆完：exploding 期間可石灰色；不在連鎖內的雷要等 status===lost 再石灰色，避免整盤瞬間全黑 */
  const chainDeadStone = lossChainPhase === 'dead' && postBlast;
  const combatTier = mineCombatTierProp;
  const tooltipText = boardCellTooltipText({
    isConflict,
    placedValue: placed?.value,
    blastPointCountdown,
    isDynamicMine,
    neutralBonusTarget,
    isMine,
    lossChainPhase,
    bonusSeconds,
    isDigitOutpost: Boolean(isDigitOutpost && !placed && blastPointCountdown === undefined),
    isPlaceHint: Boolean(isPlaceHint && !placed && status === 'playing'),
    mineCombatTier: combatTier,
    fireDigitMode,
    fortifyFirepower: isFortifyFirepower,
  });
  return (
    <motion.div
      whileHover={hoverLift ? { scale: 1.05 } : {}}
      onClick={() => onClick(x, y)}
      title={tooltipText}
      aria-label={tooltipText}
      style={{ width: cellSizePx, height: cellSizePx, minWidth: cellSizePx, minHeight: cellSizePx }}
      className={`relative flex cursor-pointer items-center justify-center rounded-xl border transition-all ${hoverTintClass}
      ${isConflict
          ? 'z-10 animate-pulse border-2 border-white bg-red-600 shadow-lg ring-4 ring-red-500/50'
          : placed
            ? isFortifyFirepower
              ? 'z-[5] border-2 border-orange-400 bg-orange-950/60 shadow-[0_0_14px_rgba(251,146,60,0.45)] ring-2 ring-amber-300/55'
              : 'border-2 border-amber-500 bg-amber-900/40'
            : isDynamicMine
              ? 'border border-cyan-700 bg-cyan-950/50'
              : chainDeadStone || (status === 'lost' && isMine && lossChainPhase === 'none')
                ? 'border border-stone-600/70 bg-stone-950/55'
                : chainPopping
                  ? 'border-2 border-orange-400/90 bg-orange-950/55 shadow-[0_0_12px_rgba(251,146,60,0.35)]'
                  : blastPointCountdown !== undefined && !postBlast
                    ? blastPointCountdown <= 5
                      ? 'z-10 animate-pulse border-2 border-red-400 bg-red-500/35 shadow-lg ring-2 ring-red-400/60'
                      : blastPointCountdown <= 10
                        ? 'border-2 border-orange-400 bg-orange-950/50'
                        : 'border-2 border-yellow-500 bg-yellow-950/40'
                    : isMine
                        ? 'border border-red-400/65 bg-red-500/10'
                      : neutralBonusTarget
                        ? 'border border-slate-700 bg-slate-800 hover:border-amber-500/50'
                        : isDigitOutpost && !placed
                          ? 'border border-teal-600/55 bg-slate-800 hover:border-teal-400/50'
                          : isPlaceHint && !placed
                            ? 'border border-slate-700 bg-slate-800 hover:border-teal-400/55'
                            : 'border border-slate-700 bg-slate-800 hover:border-amber-500/50'
        }
    `}
    >
      {isPlaceHint && !placed && !isDynamicMine && status === 'playing' && <PlaceHintOverlay />}
      {!placed && !isDynamicMine && isDigitOutpost && blastPointCountdown === undefined && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[11] flex items-center justify-center"
          aria-hidden
        >
          <MapPin
            size={Math.max(12, Math.round(cellSizePx * 0.34))}
            className="text-teal-400/95 drop-shadow-[0_0_4px_rgba(20,184,166,0.55)]"
          />
        </motion.div>
      )}
      {placed && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`flex flex-col items-center justify-center leading-none ${isFortifyFirepower ? 'gap-px' : ''}`}
        >
          <span
            style={{ fontSize: isFortifyFirepower ? fortifyDigitFont : commandDigitFont }}
            className={
              isFortifyFirepower
                ? fortifyFirepowerDigitClassName(placed.value)
                : placedCommandDigitClassName(isConflict)
            }
          >
            {placed.value}
          </span>
          {isFortifyFirepower && (
            <span className="text-[7px] font-black uppercase tracking-widest text-amber-200/95 sm:text-[8px]">
              火力
            </span>
          )}
        </motion.div>
      )}
      {isDynamicMine && !placed && (
        <MineCellCombatDisplay
          tier={1}
          fireDigitMode={fireDigitMode}
          iconSize={iconSize}
          cellExtentPx={cellSizePx}
          variant="cyan"
        />
      )}
      {!placed && !isDynamicMine && lossChainPhase === 'popping' && status === 'exploding' && (
        <MineCellCombatDisplay
          tier={combatTier}
          fireDigitMode={fireDigitMode}
          iconSize={iconSize}
          cellExtentPx={cellSizePx}
          variant="red"
          popKey={lossChainPopKey}
        />
      )}
      {isMine &&
        !placed &&
        !isDynamicMine &&
        lossChainPhase === 'none' &&
        blastPointCountdown === undefined && (
        <MineCellCombatDisplay
          tier={combatTier}
          fireDigitMode={fireDigitMode}
          iconSize={iconSize}
          cellExtentPx={cellSizePx}
          variant="red"
        />
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
      {neutralBonusTarget && !postBlast && !isMine && (
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
      {blastPointCountdown !== undefined && !postBlast && (
        <div className="pointer-events-none absolute inset-0 z-[18] flex flex-col items-center justify-center gap-0.5">
          <span
            className={`font-black leading-none tabular-nums ${
              blastPointCountdown <= 5
                ? 'text-red-300 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                : blastPointCountdown <= 10
                  ? 'text-orange-300 drop-shadow-[0_0_4px_rgba(251,146,60,0.7)]'
                  : 'text-yellow-300 drop-shadow-[0_0_3px_rgba(253,224,71,0.6)]'
            }`}
            style={{ fontSize: Math.max(11, Math.round(cellSizePx * 0.4)) }}
          >
            {blastPointCountdown}
          </span>
          <span
            className="text-slate-400 leading-none"
            style={{ fontSize: Math.max(7, Math.round(cellSizePx * 0.22)) }}
          >
            ⏱
          </span>
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
