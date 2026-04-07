import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Bomb } from 'lucide-react';
import { MineRuins } from './MineRuins';
import { hexCenterScreenPx, hexPolygonPoints } from './hexBoardLayout';
import type { GameState } from './types';

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
        const placed = gameState.placedNumbers.find((p) => p.x === x && p.y === y);
        const isMine = gameState.revealedMines.has(`${x},${y}`);
        const isConflict = gameState.conflictCells.some((c) => c.x === x && c.y === y);
        const isExploding = gameState.status === 'exploding' && isMine;
        const showExplosionX = gameState.explosionMarkCells.some((c) => c.x === x && c.y === y);
        const key = `${x},${y}`;
        const isBonusTarget = bonusTargetKeys.has(key);
        const isBonusTargetRewarded = rewardedTargetKeys.has(key);
        const showBonusFx = bonusFxKeys.has(key);
        const neutralBonusTarget = isBonusTarget && !placed && !isConflict;

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
        } else if (postBlast && isMine) {
          fillClass = 'fill-stone-950/80';
          strokeClass = 'stroke-stone-600';
        } else if (neutralBonusTarget) {
          fillClass = 'fill-slate-800';
          strokeClass = 'stroke-slate-600';
        } else if (isMine) {
          fillClass = 'fill-red-950/50';
          strokeClass = 'stroke-red-900';
        }

        return (
          <motion.g
            key={`${gameState.gameId}-${x}-${y}`}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
            whileHover={playing ? { scale: 1.04 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          >
            <polygon
              points={hexPolygonPoints(cx, cy, r)}
              className={`cursor-pointer stroke-[1.5] transition-colors ${fillClass} ${strokeClass} ${
                isConflict ? 'animate-pulse' : ''
              }`}
              onClick={() => onCellClick(x, y)}
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
            {isMine && !placed && !neutralBonusTarget && (
              <foreignObject
                x={cx - iconSize / 2}
                y={cy - iconSize / 2}
                width={iconSize}
                height={iconSize}
                className="pointer-events-none overflow-visible"
              >
                <div className="flex h-full w-full items-center justify-center">
                  {postBlast ? (
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
  );
}
