import type { RefObject } from 'react';
import { GameCell } from './GameCell';
import { MapCloudOverlay } from './MapCloudOverlay';
import { Soldier } from './Soldier';
import { HexGameBoardLayer } from './HexGameBoardLayer';
import { BOARD_GAP_PX, boardCellPxForLevel } from './constants';
import { lossChainPhaseForKey } from './lossExplosionChain';
import { hexBoardContentSizePxForCells, hexRadiusPxForLevel } from './hexBoardLayout';
import type { GameState, MovingSoldierState } from './types';
import { neighborModeForGridSystem } from '../levelData/gridTopology';
import {
  adjacentPlacedDigitCount,
  claireDigitLinkDegreeAt,
  claireDigitLinkEdges,
  claireDigitLinkKeySet,
  mineBombVisualTier,
} from './mineCombatVisual';
import { heroFirepowerDigitWeightMode, heroFirepowerDigitLinkPerEdge, getStoredHeroId } from '../heroes';
import { NeighborBonusPlusOneFlight } from './NeighborBonusPlusOneFlight';
import { NeighborResonancePlaceOverlay } from './NeighborResonancePlaceOverlay';
import { BobbyDownshiftFxOverlay, type BobbyDownshiftFxState } from './BobbyDownshiftFxOverlay';
import { ClaireDigitLinkOverlay } from './ClaireDigitLinkOverlay';
import { GAME_BOARD_FRAME_PAD_PX } from './constants';

export function GameBoard({
  gameState,
  movingSoldier,
  onCellClick,
  boardRef,
  bonusFxKeys,
  bobbyDownshiftFx = null,
  combatHeroId = getStoredHeroId(),
  placeHintKeys = null,
  align = 'center',
}: {
  gameState: GameState;
  movingSoldier: MovingSoldierState | null;
  onCellClick: (x: number, y: number) => void;
  boardRef: RefObject<HTMLDivElement | null>;
  bonusFxKeys: string[];
  bobbyDownshiftFx?: BobbyDownshiftFxState | null;
  combatHeroId?: string;
  /** 波比：選定電碼後亮起可放格 */
  placeHintKeys?: ReadonlySet<string> | null;
  align?: 'center' | 'left';
}) {
  const w = gameState.level.width;
  const h = gameState.level.height;
  const gridSystem = gameState.level.definition.gridSystem ?? 'SQUARE';
  const grid = gridSystem;
  const isHex = grid === 'HEXAGON';
  const cloud = gameState.level.definition.mapCloudOverlay;
  const configuredBonusTargets = gameState.level.definition.mineBonusTargetCells;
  const effectiveBonusTargets =
    configuredBonusTargets && configuredBonusTargets.length > 0
      ? configuredBonusTargets
      : (gameState.level.definition.forcedMineCells ?? []);
  const bonusTargetKeys = new Set(effectiveBonusTargets.map(([tx, ty]) => `${tx},${ty}`));
  const rewardedTargetKeys = gameState.rewardedMineTargets;
  const bonusFxKeySet = new Set(bonusFxKeys);
  const bonusSeconds = gameState.level.definition.mineBonusSeconds ?? 5;
  const blastPointsCountdown = gameState.blastPointsCountdown;
  const allBlastPointKeys = new Set(
    (gameState.level.definition.blastPoints ?? []).map((bp) => `${bp.pos[0]},${bp.pos[1]}`),
  );
  const digitOutpostKeys = new Set(
    (gameState.level.definition.digitOutposts ?? []).map(([ox, oy]) => `${ox},${oy}`),
  );
  const hintKeys = placeHintKeys ?? null;
  const boardAlignClass = align === 'left' ? 'mr-auto' : 'mx-auto';
  const showClaireDigitLink = heroFirepowerDigitLinkPerEdge(combatHeroId) > 0;
  const digitLinkEdges = showClaireDigitLink
    ? claireDigitLinkEdges(
        gameState.placedNumbers,
        gameState.level.cells,
        gridSystem,
        w,
        h,
      )
    : [];
  const digitLinkKeys = showClaireDigitLink ? claireDigitLinkKeySet(digitLinkEdges) : new Set<string>();

  if (isHex) {
    const r = hexRadiusPxForLevel(w, h);
    const { w: contentW, h: contentH, minX, minY } = hexBoardContentSizePxForCells(gameState.level.cells, r);

    return (
      <div className="w-full max-w-full overflow-x-auto">
        <div
          ref={boardRef}
          key={gameState.gameId}
          className={`relative overflow-hidden rounded-[2rem] border-[3px] border-slate-800 bg-slate-900 p-3 shadow-2xl ${boardAlignClass}`}
          style={{ width: 'fit-content' }}
        >
          <HexGameBoardLayer
            gameState={gameState}
            r={r}
            contentW={contentW}
            contentH={contentH}
            minX={minX}
            minY={minY}
            onCellClick={onCellClick}
            bonusFxKeys={bonusFxKeySet}
            bonusSeconds={bonusSeconds}
            placeHintKeys={hintKeys}
            digitLinkEdges={digitLinkEdges}
            digitLinkKeys={digitLinkKeys}
          />

          <ClaireDigitLinkOverlay
            edges={digitLinkEdges}
            layout="hex"
            cellSize={r}
            overlayWidthPx={contentW + GAME_BOARD_FRAME_PAD_PX * 2}
            overlayHeightPx={contentH + GAME_BOARD_FRAME_PAD_PX * 2}
            hexMin={{ x: minX, y: minY }}
          />

          {cloud && (
            <MapCloudOverlay config={cloud} boardWidthPx={contentW} boardHeightPx={contentH} />
          )}

          {movingSoldier?.phase === 'resonance' && (
            <NeighborResonancePlaceOverlay
              layout="hex"
              x={movingSoldier.x}
              y={movingSoldier.y}
              shownValue={movingSoldier.resonanceShown}
              cellSize={r}
              hexMin={{ x: minX, y: minY }}
            />
          )}
          {movingSoldier?.phase === 'resonance' && movingSoldier.flightFrom && (
            <NeighborBonusPlusOneFlight
              layout="hex"
              fromX={movingSoldier.flightFrom.x}
              fromY={movingSoldier.flightFrom.y}
              toX={movingSoldier.x}
              toY={movingSoldier.y}
              cellSize={r}
              hexMin={{ x: minX, y: minY }}
            />
          )}
          {movingSoldier && movingSoldier.phase !== 'resonance' && (
            <Soldier
              x={movingSoldier.x}
              y={movingSoldier.y}
              cellSize={r}
              heroId={combatHeroId}
              layout="hex"
              hexMin={{ x: minX, y: minY }}
            />
          )}
          <BobbyDownshiftFxOverlay
            fx={bobbyDownshiftFx}
            layout="hex"
            cellSize={r}
            hexMin={{ x: minX, y: minY }}
          />
        </div>
      </div>
    );
  }

  const cells = gameState.level.cells;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of cells) {
    minX = Math.min(minX, c.x);
    minY = Math.min(minY, c.y);
    maxX = Math.max(maxX, c.x);
    maxY = Math.max(maxY, c.y);
  }
  const squareGridMin =
    cells.length > 0 && Number.isFinite(minX) && Number.isFinite(minY)
      ? { x: minX, y: minY }
      : { x: 0, y: 0 };
  const gridW = cells.length > 0 && Number.isFinite(minX) ? maxX - minX + 1 : w;
  const gridH = cells.length > 0 && Number.isFinite(minY) ? maxY - minY + 1 : h;

  const cellSize = boardCellPxForLevel(gridW, gridH);
  const gap = BOARD_GAP_PX;
  const boardWidthPx = gridW * cellSize + Math.max(0, gridW - 1) * gap;
  const boardHeightPx = gridH * cellSize + Math.max(0, gridH - 1) * gap;
  const validKey = new Set(cells.map((c) => `${c.x},${c.y}`));
  const placedByKey = new Map(gameState.placedNumbers.map((p) => [`${p.x},${p.y}`, p]));
  const conflictKeySet = new Set(gameState.conflictCells.map((c) => `${c.x},${c.y}`));
  const explosionMarkKeySet = new Set(gameState.explosionMarkCells.map((c) => `${c.x},${c.y}`));
  const squareNeighborMode = neighborModeForGridSystem(gameState.level.definition.gridSystem);
  const fireDigitMode = heroFirepowerDigitWeightMode(getStoredHeroId());

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <div
        ref={boardRef}
        key={gameState.gameId}
        className={`relative overflow-hidden rounded-[2rem] border-[3px] border-slate-800 bg-slate-900 p-3 shadow-2xl ${boardAlignClass}`}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridW}, ${cellSize}px)`,
          gridAutoRows: `${cellSize}px`,
          gap: `${gap}px`,
          width: 'fit-content',
        }}
      >
        <ClaireDigitLinkOverlay
          edges={digitLinkEdges}
          layout="square"
          cellSize={cellSize}
          overlayWidthPx={boardWidthPx + GAME_BOARD_FRAME_PAD_PX * 2}
          overlayHeightPx={boardHeightPx + GAME_BOARD_FRAME_PAD_PX * 2}
          squareGridMin={squareGridMin}
        />

        {Array.from({ length: gridW * gridH }).map((_, i) => {
          const gx = i % gridW;
          const gy = Math.floor(i / gridW);
          const x = squareGridMin.x + gx;
          const y = squareGridMin.y + gy;
          const isValid = validKey.has(`${x},${y}`);

          if (!isValid)
            return (
              <div
                key={i}
                style={{ width: cellSize, height: cellSize, minWidth: cellSize, minHeight: cellSize }}
              />
            );

          const key = `${x},${y}`;
          const placed = placedByKey.get(key);
          const isDynMine = gameState.dynamicMines.has(key);
          // 仍在倒數的炸點：由 countdown overlay 顯示，不渲染地雷圖示
          // 已解除的炸點（不在 blastPointsCountdown 中）：正常顯示地雷圖示
          const isMine = !blastPointsCountdown.has(key) && gameState.revealedMines.has(key);
          const isConflict = conflictKeySet.has(key);
          const lossChainPhase = lossChainPhaseForKey(
            key,
            gameState.lossSequentialExplosionKeys,
            gameState.lossExplosionWaveIndex,
          );
          const showExplosionX = explosionMarkKeySet.has(key);
          const isBonusTarget = bonusTargetKeys.has(key);
          const isBonusTargetRewarded = rewardedTargetKeys.has(key);
          const showBonusFx = bonusFxKeySet.has(key);
          const blastPointCountdown = blastPointsCountdown.get(key);
          const adjDigits = adjacentPlacedDigitCount(x, y, placedByKey, validKey, squareNeighborMode, w, h);
          const mCombat = mineBombVisualTier(adjDigits, fireDigitMode);
          const linkDegree = showClaireDigitLink
            ? claireDigitLinkDegreeAt(x, y, digitLinkEdges)
            : 0;

          return (
            <GameCell
              key={`${gameState.gameId}-${i}`}
              x={x}
              y={y}
              cellSizePx={cellSize}
              placed={placed}
              isMine={isMine}
              isConflict={isConflict}
              showExplosionX={showExplosionX}
              isBonusTarget={isBonusTarget}
              isBonusTargetRewarded={isBonusTargetRewarded}
              showBonusFx={showBonusFx}
              bonusSeconds={bonusSeconds}
              blastPointCountdown={blastPointCountdown}
              isDigitOutpost={digitOutpostKeys.has(key)}
              isPlaceHint={(hintKeys?.has(key) ?? false) && !isMine && !isDynMine}
              isDynamicMine={isDynMine}
              mineCombatTier={isMine ? mCombat : 1}
              fireDigitMode={fireDigitMode}
              isDigitLinkNode={linkDegree > 0}
              digitLinkDegree={linkDegree}
              lossChainPhase={lossChainPhase}
              lossChainPopKey={gameState.lossExplosionWaveIndex}
              status={gameState.status}
              onClick={onCellClick}
            />
          );
        })}

        {cloud && (
          <MapCloudOverlay config={cloud} boardWidthPx={boardWidthPx} boardHeightPx={boardHeightPx} />
        )}

        {movingSoldier?.phase === 'resonance' && (
          <NeighborResonancePlaceOverlay
            layout="square"
            x={movingSoldier.x}
            y={movingSoldier.y}
            shownValue={movingSoldier.resonanceShown}
            cellSize={cellSize}
            squareGridMin={squareGridMin}
          />
        )}
        {movingSoldier?.phase === 'resonance' && movingSoldier.flightFrom && (
          <NeighborBonusPlusOneFlight
            layout="square"
            fromX={movingSoldier.flightFrom.x}
            fromY={movingSoldier.flightFrom.y}
            toX={movingSoldier.x}
            toY={movingSoldier.y}
            cellSize={cellSize}
            squareGridMin={squareGridMin}
          />
        )}
        {movingSoldier && movingSoldier.phase !== 'resonance' && (
          <Soldier
            x={movingSoldier.x}
            y={movingSoldier.y}
            cellSize={cellSize}
            heroId={combatHeroId}
            layout="square"
            squareGridMin={squareGridMin}
          />
        )}
        <BobbyDownshiftFxOverlay
          fx={bobbyDownshiftFx}
          layout="square"
          cellSize={cellSize}
          squareGridMin={squareGridMin}
        />
      </div>
    </div>
  );
}
