import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Bomb } from 'lucide-react';
import { MineRuins } from './MineRuins';
import { hexCenterScreenPx, hexPolygonPoints } from './hexBoardLayout';
import { lossChainPhaseForKey } from './lossExplosionChain';
import type { GameState } from './types';
import { boardCellTooltipText } from './boardCellTooltipText';
import { useSvgBoardTooltip } from './useSvgBoardTooltip';

export function HexGameBoardLayer({
  gameState,
  r,
  contentW,
  contentH,
  minX,
  minY,
  onCellClick,
  bonusFxKeys,
  bonusSeconds,
}: {
  gameState: GameState;
  r: number;
  contentW: number;
  contentH: number;
  minX: number;
  minY: number;
  onCellClick: (x: number, y: number) => void;
  bonusFxKeys: Set<string>;
  bonusSeconds: number;
}) {
  const w = gameState.level.width;
  const h = gameState.level.height;
  const postBlast = gameState.status === 'exploding' || gameState.status === 'lost';
  const playing = gameState.status === 'playing';

  const validKey = new Set(gameState.level.cells.map((c) => `${c.x},${c.y}`));
  const configuredBonusTargets = gameState.level.definition.mineBonusTargetCells;
  const effectiveBonusTargets =
    configuredBonusTargets && configuredBonusTargets.length > 0
      ? configuredBonusTargets
      : (gameState.level.definition.forcedMineCells ?? []);
  const bonusTargetKeys = new Set(effectiveBonusTargets.map(([tx, ty]) => `${tx},${ty}`));
  const rewardedTargetKeys = gameState.rewardedMineTargets;
  const { onPolygonEnter, onPolygonMove, onPolygonLeave, tooltipEl } = useSvgBoardTooltip();

  const placedByKey = new Map(gameState.placedNumbers.map((p) => [`${p.x},${p.y}`, p]));
  const conflictKeySet = new Set(gameState.conflictCells.map((c) => `${c.x},${c.y}`));
  const explosionMarkKeySet = new Set(gameState.explosionMarkCells.map((c) => `${c.x},${c.y}`));

  const terrainPolys: ReactNode[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (validKey.has(`${x},${y}`)) continue;
      const { cx, cy } = hexCenterScreenPx(x, y, r, minX, minY);
      terrainPolys.push(
        <polygon
          key={`terrain-${gameState.gameId}-${x}-${y}`}
          points={hexPolygonPoints(cx, cy, r)}
          className="pointer-events-none fill-slate-900 stroke-none"
          aria-hidden
        />
      );
    }
  }

  return (
    <>
    <svg
      width={contentW}
      height={contentH}
      className="block select-none"
      style={{ shapeRendering: 'geometricPrecision' }}
    >
      <g className="pointer-events-none">{terrainPolys}</g>
      {gameState.level.cells.map((cell) => {
        const { x, y } = cell;
        const { cx, cy } = hexCenterScreenPx(x, y, r, minX, minY);
        const key = `${x},${y}`;
        const placed = placedByKey.get(key);
        const isActiveBlastPoint = gameState.blastPointsCountdown.has(key);
        const blastPointCountdown = gameState.blastPointsCountdown.get(key);
        const isMine = !isActiveBlastPoint && gameState.revealedMines.has(key);
        const isConflict = conflictKeySet.has(key);
        const lossChainPhase = lossChainPhaseForKey(
          key,
          gameState.lossSequentialExplosionKeys,
          gameState.lossExplosionWaveIndex,
        );
        const isExploding = gameState.status === 'exploding' && isMine && lossChainPhase === 'none';
        const showExplosionX = explosionMarkKeySet.has(key);
        const isBonusTarget = bonusTargetKeys.has(key);
        const isBonusTargetRewarded = rewardedTargetKeys.has(key);
        const showBonusFx = bonusFxKeys.has(key);
        const neutralBonusTarget = isBonusTarget && !placed && !isConflict;
        const isDynamicMine = gameState.dynamicMines.has(key);

        const numFont = Math.max(11, Math.round(r * 0.38));
        const iconSize = Math.max(12, Math.round(r * 0.36));

        let fillClass = 'fill-slate-800';
        let strokeClass = 'stroke-slate-600';
        if (isConflict) {
          fillClass = 'fill-red-600';
          strokeClass = 'stroke-white';
        } else if (placed) {
          fillClass = 'fill-amber-950/90';
          strokeClass = 'stroke-amber-500';
        } else if (isDynamicMine) {
          fillClass = 'fill-cyan-950/55';
          strokeClass = 'stroke-cyan-700';
        } else if ((postBlast && isMine && lossChainPhase === 'none') || (lossChainPhase === 'dead' && postBlast)) {
          fillClass = 'fill-stone-950/80';
          strokeClass = 'stroke-stone-600';
        } else if (lossChainPhase === 'live' && gameState.status === 'exploding') {
          fillClass = 'fill-red-950/50';
          strokeClass = 'stroke-red-900';
        } else if (blastPointCountdown !== undefined && !postBlast) {
          if (blastPointCountdown <= 5) {
            fillClass = 'fill-red-950/60';
            strokeClass = 'stroke-red-500';
          } else if (blastPointCountdown <= 10) {
            fillClass = 'fill-orange-950/55';
            strokeClass = 'stroke-orange-400';
          } else {
            fillClass = 'fill-yellow-950/50';
            strokeClass = 'stroke-yellow-500';
          }
        } else if (neutralBonusTarget) {
          fillClass = 'fill-slate-800';
          strokeClass = 'stroke-slate-600';
        } else if (isMine) {
          fillClass = 'fill-red-950/50';
          strokeClass = 'stroke-red-900';
        }
        const tooltipText = boardCellTooltipText({
          isConflict,
          placedValue: placed?.value,
          blastPointCountdown: isActiveBlastPoint ? blastPointCountdown : undefined,
          isDynamicMine,
          neutralBonusTarget,
          isMine,
          lossChainPhase,
          bonusSeconds,
        });

        return (
          <motion.g
            key={`${gameState.gameId}-${x}-${y}`}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
            whileHover={playing && !isActiveBlastPoint ? { scale: 1.04 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          >
            <polygon
              points={hexPolygonPoints(cx, cy, r)}
              className={`cursor-pointer stroke-[1.5] transition-colors ${fillClass} ${strokeClass} ${
                isConflict ? 'animate-pulse' : ''
              }`}
              onClick={() => onCellClick(x, y)}
              onMouseEnter={(e) => onPolygonEnter(tooltipText, e)}
              onMouseMove={onPolygonMove}
              onMouseLeave={onPolygonLeave}
            />
            {placed && (
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                className={`pointer-events-none font-black ${isConflict ? 'fill-white' : 'fill-amber-400'}`}
                style={{ fontSize: numFont }}
              >
                {placed.value}
              </text>
            )}
            {blastPointCountdown !== undefined && !postBlast && (
              <foreignObject
                x={cx - r * 0.95}
                y={cy - r * 0.85}
                width={r * 1.9}
                height={r * 1.7}
                className="pointer-events-none overflow-visible"
              >
                <div className="flex h-full w-full flex-col items-center justify-center gap-0.5">
                  <span
                    className={`font-black tabular-nums leading-none ${
                      blastPointCountdown <= 5
                        ? 'text-red-300 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                        : blastPointCountdown <= 10
                          ? 'text-orange-300 drop-shadow-[0_0_4px_rgba(251,146,60,0.7)]'
                          : 'text-yellow-300 drop-shadow-[0_0_3px_rgba(253,224,71,0.6)]'
                    }`}
                    style={{ fontSize: Math.max(11, Math.round(r * 0.42)) }}
                  >
                    {blastPointCountdown}
                  </span>
                  <span
                    className="leading-none text-slate-400"
                    style={{ fontSize: Math.max(7, Math.round(r * 0.22)) }}
                  >
                    ⏱
                  </span>
                </div>
              </foreignObject>
            )}
            {!placed && !neutralBonusTarget && lossChainPhase !== 'none' && (
              <foreignObject
                x={cx - iconSize / 2}
                y={cy - iconSize / 2}
                width={iconSize}
                height={iconSize}
                className="pointer-events-none overflow-visible"
              >
                <div className="flex h-full w-full items-center justify-center">
                  {lossChainPhase === 'live' && gameState.status === 'exploding' && (
                    <Bomb size={iconSize} className="text-red-400 opacity-60" />
                  )}
                  {lossChainPhase === 'popping' && gameState.status === 'exploding' && (
                    <MineRuins key={`lc-${gameState.lossExplosionWaveIndex}`} x={x} y={y} exploding />
                  )}
                  {lossChainPhase === 'dead' && postBlast && (
                    <MineRuins x={x} y={y} exploding={false} />
                  )}
                </div>
              </foreignObject>
            )}
            {isMine && !placed && !neutralBonusTarget && lossChainPhase === 'none' && (
              <foreignObject
                x={cx - iconSize / 2}
                y={cy - iconSize / 2}
                width={iconSize}
                height={iconSize}
                className="pointer-events-none overflow-visible"
              >
                <div className="flex h-full w-full items-center justify-center">
                  {isDynamicMine ? (
                    <Bomb size={iconSize} className="text-cyan-400 opacity-75 drop-shadow-[0_0_4px_rgba(34,211,238,0.5)]" />
                  ) : postBlast ? (
                    <MineRuins x={x} y={y} exploding={isExploding} />
                  ) : (
                    <Bomb size={iconSize} className="text-red-400 opacity-60" />
                  )}
                </div>
              </foreignObject>
            )}
            {showExplosionX && postBlast && (
              <g className="pointer-events-none" aria-hidden>
                <line
                  x1={cx - r * 0.28}
                  y1={cy - r * 0.28}
                  x2={cx + r * 0.28}
                  y2={cy + r * 0.28}
                  className="stroke-rose-400"
                  strokeWidth={Math.max(3, r * 0.09)}
                  strokeLinecap="round"
                />
                <line
                  x1={cx + r * 0.28}
                  y1={cy - r * 0.28}
                  x2={cx - r * 0.28}
                  y2={cy + r * 0.28}
                  className="stroke-rose-400"
                  strokeWidth={Math.max(3, r * 0.09)}
                  strokeLinecap="round"
                />
              </g>
            )}
            {neutralBonusTarget && !postBlast && (
              <foreignObject
                x={cx - iconSize / 2}
                y={cy - iconSize / 2}
                width={iconSize}
                height={iconSize}
                className="pointer-events-none overflow-visible"
              >
                <div className="flex h-full w-full items-center justify-center">
                  <Bomb
                    size={Math.max(14, Math.round(iconSize * 1.15))}
                    className={
                      isBonusTargetRewarded
                        ? 'text-white/50 drop-shadow-[0_0_2px_rgba(0,0,0,0.65)]'
                        : 'text-white/80 drop-shadow-[0_0_3px_rgba(0,0,0,0.8)]'
                    }
                  />
                </div>
              </foreignObject>
            )}
            {postBlast && isMine && neutralBonusTarget && (
              <foreignObject
                x={cx - iconSize / 2}
                y={cy - iconSize / 2}
                width={iconSize}
                height={iconSize}
                className="pointer-events-none overflow-visible"
              >
                <div className="flex h-full w-full items-center justify-center">
                  <MineRuins x={x} y={y} exploding={isExploding} />
                </div>
              </foreignObject>
            )}
            {showBonusFx && (
              <motion.text
                x={cx}
                y={cy - r * 0.1}
                textAnchor="middle"
                dominantBaseline="central"
                initial={{ y: cy + r * 0.12, opacity: 0, scale: 0.92 }}
                animate={{ y: cy - r * 0.46, opacity: 1, scale: 1.04 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="pointer-events-none fill-emerald-300 font-black drop-shadow-[0_0_6px_rgba(16,185,129,0.75)]"
                style={{ fontSize: Math.max(11, Math.round(r * 0.34)) }}
              >
                +{bonusSeconds}
              </motion.text>
            )}
          </motion.g>
        );
      })}
    </svg>
    {tooltipEl}
    </>
  );
}
