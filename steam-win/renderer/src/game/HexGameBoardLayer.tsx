import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Bomb, MapPin } from 'lucide-react';
import { getStoredHeroId, heroFirepowerDigitWeightMode } from '../heroes';
import { hexCenterScreenPx, hexPolygonPoints, hexVertexScreenPx } from './hexBoardLayout';
import { lossChainPhaseForKey } from './lossExplosionChain';
import type { GameState } from './types';
import { boardCellTooltipText } from './boardCellTooltipText';
import { useSvgBoardTooltip } from './useSvgBoardTooltip';
import { neighborModeForGridSystem } from '../levelData/gridTopology';
import { hexOffsetForEdge } from '../levelData/hexGrid';
import {
  adjacentPlacedDigitCount,
  cyanJunkMineBombIconClass,
  mineBombVisualTier,
  redMineBombIconClass,
} from './mineCombatVisual';
import { MineTierBombIcon } from './mineBombTierIcon';

function hexCellOwnsSharedEdge(ax: number, ay: number, bx: number, by: number): boolean {
  return ay < by || (ay === by && ax < bx);
}

/** 蜂巢外露邊統一線色／寬，避免數字格 amber 邊與其他格 slate 邊視覺粗細不一 */
const HEX_OUTWARD_EDGE_STROKE_CLASS = 'stroke-slate-400/32';

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
  const neighborMode = neighborModeForGridSystem(gameState.level.definition.gridSystem);
  const fireDigitMode = heroFirepowerDigitWeightMode(getStoredHeroId());
  const digitOutpostKeys = new Set(
    (gameState.level.definition.digitOutposts ?? []).map(([ox, oy]) => `${ox},${oy}`),
  );

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
        const showExplosionX = explosionMarkKeySet.has(key);
        const isBonusTarget = bonusTargetKeys.has(key);
        const isBonusTargetRewarded = rewardedTargetKeys.has(key);
        const showBonusFx = bonusFxKeys.has(key);
        const neutralBonusTarget = isBonusTarget && !placed && !isConflict;
        const isDynamicMine = gameState.dynamicMines.has(key);
        const adjDigits = adjacentPlacedDigitCount(x, y, placedByKey, validKey, neighborMode, w, h);
        const mCombat = mineBombVisualTier(adjDigits, fireDigitMode);

        const numFont = Math.max(11, Math.round(r * 0.38));
        const iconSize = Math.max(12, Math.round(r * 0.36));

        let fillClass = 'fill-slate-800';
        if (isConflict) {
          fillClass = 'fill-red-600';
        } else if (placed) {
          fillClass = 'fill-amber-950/90';
        } else if (isDynamicMine) {
          fillClass =
            mCombat >= 5
              ? 'fill-emerald-950/55'
              : mCombat >= 4
                ? 'fill-teal-950/58'
                : mCombat >= 3
                  ? 'fill-cyan-950/62'
                  : mCombat >= 2
                    ? 'fill-cyan-950/65'
                    : 'fill-cyan-950/55';
        } else if (
          (lossChainPhase === 'dead' && postBlast) ||
          (gameState.status === 'lost' && isMine && lossChainPhase === 'none')
        ) {
          /** 焦痕／餘燼色，避免純黑死格貼在 slate-900 背景上像髒塊 */
          fillClass = 'fill-[#2c1518]/92';
        } else if (lossChainPhase === 'popping' && gameState.status === 'exploding') {
          fillClass = 'fill-orange-950/65';
        } else if (blastPointCountdown !== undefined && !postBlast) {
          if (blastPointCountdown <= 5) {
            fillClass = 'fill-red-500/35';
          } else if (blastPointCountdown <= 10) {
            fillClass = 'fill-orange-950/55';
          } else {
            fillClass = 'fill-yellow-950/50';
          }
        } else if (isMine) {
          fillClass =
            mCombat >= 5
              ? 'fill-yellow-400/20'
              : mCombat >= 4
                ? 'fill-amber-400/21'
                : mCombat >= 3
                  ? 'fill-orange-400/20'
                  : mCombat >= 2
                    ? 'fill-red-400/22'
                    : 'fill-red-500/10';
        } else if (neutralBonusTarget) {
          fillClass = 'fill-slate-800';
        } else if (
          digitOutpostKeys.has(key) &&
          !placed &&
          !isMine &&
          !isDynamicMine &&
          blastPointCountdown === undefined &&
          lossChainPhase === 'none'
        ) {
          fillClass = 'fill-slate-800';
        }
        const isDigitOutpostTooltip = Boolean(
          digitOutpostKeys.has(key) && !placed && blastPointCountdown === undefined,
        );
        const tooltipText = boardCellTooltipText({
          isConflict,
          placedValue: placed?.value,
          blastPointCountdown: isActiveBlastPoint ? blastPointCountdown : undefined,
          isDynamicMine,
          neutralBonusTarget,
          isMine,
          lossChainPhase,
          bonusSeconds,
          isDigitOutpost: isDigitOutpostTooltip,
          mineCombatTier: isMine || isDynamicMine ? mCombat : 1,
          fireDigitMode,
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
              className={`cursor-pointer stroke-none transition-colors ${fillClass} ${
                isConflict ? 'animate-pulse' : ''
              }`}
              onClick={() => onCellClick(x, y)}
              onMouseEnter={(e) => onPolygonEnter(tooltipText, e)}
              onMouseMove={onPolygonMove}
              onMouseLeave={onPolygonLeave}
            />
            <g className="pointer-events-none">
              {Array.from({ length: 6 }, (_, ei) => {
                const [dx, dy] = hexOffsetForEdge(y, ei);
                const nx = x + dx;
                const ny = y + dy;
                const nk = `${nx},${ny}`;
                const outward = !validKey.has(nk) || hexCellOwnsSharedEdge(x, y, nx, ny);
                if (!outward) return null;
                const a = hexVertexScreenPx(cx, cy, r, ei);
                const b = hexVertexScreenPx(cx, cy, r, ei + 1);
                return (
                  <line
                    key={`e-${ei}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    className={`stroke-1 ${HEX_OUTWARD_EDGE_STROKE_CLASS}`}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </g>
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
            {!placed &&
              !isDynamicMine &&
              digitOutpostKeys.has(key) &&
              blastPointCountdown === undefined &&
              !postBlast && (
                <foreignObject
                  x={cx - r * 0.92}
                  y={cy - r * 0.92}
                  width={r * 0.88}
                  height={r * 0.88}
                  className="pointer-events-none overflow-visible"
                >
                  <div className="flex h-full w-full items-start justify-start" aria-hidden>
                    <MapPin
                      size={Math.max(12, Math.round(r * 0.34))}
                      className="text-teal-400/95 drop-shadow-[0_0_4px_rgba(20,184,166,0.55)]"
                    />
                  </div>
                </foreignObject>
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
            {!placed && lossChainPhase === 'popping' && gameState.status === 'exploding' && (
              <foreignObject
                x={cx - iconSize / 2}
                y={cy - iconSize / 2}
                width={iconSize}
                height={iconSize}
                className="pointer-events-none overflow-visible"
              >
                <div className="flex h-full w-full items-center justify-center">
                  <MineTierBombIcon
                    key={`lc-${gameState.lossExplosionWaveIndex}`}
                    tier={mCombat}
                    size={iconSize}
                    className={redMineBombIconClass(mCombat)}
                  />
                </div>
              </foreignObject>
            )}
            {isMine && !placed && lossChainPhase === 'none' && (
              <foreignObject
                x={cx - iconSize / 2}
                y={cy - iconSize / 2}
                width={iconSize}
                height={iconSize}
                className="pointer-events-none overflow-visible"
              >
                <div className="flex h-full w-full items-center justify-center">
                  {isDynamicMine ? (
                    <MineTierBombIcon
                      tier={mCombat}
                      size={iconSize}
                      className={cyanJunkMineBombIconClass(mCombat)}
                    />
                  ) : (
                    <MineTierBombIcon
                      tier={mCombat}
                      size={iconSize}
                      className={redMineBombIconClass(mCombat)}
                    />
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
                  strokeWidth={Math.max(1.25, r * 0.038)}
                  strokeLinecap="round"
                />
                <line
                  x1={cx + r * 0.28}
                  y1={cy - r * 0.28}
                  x2={cx - r * 0.28}
                  y2={cy + r * 0.28}
                  className="stroke-rose-400"
                  strokeWidth={Math.max(1.25, r * 0.038)}
                  strokeLinecap="round"
                />
              </g>
            )}
            {neutralBonusTarget && !postBlast && !isMine && (
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
