import type { RefObject } from 'react';
import { GameCell } from './GameCell';
import { MapCloudOverlay } from './MapCloudOverlay';
import { Soldier } from './Soldier';
import { TriangleGameBoardLayer } from './TriangleGameBoardLayer';
import { HexGameBoardLayer } from './HexGameBoardLayer';
import { BOARD_GAP_PX, boardCellPxForLevel } from './constants';
import { lossChainPhaseForKey } from './lossExplosionChain';
import { triangleBoardContentSizePx, triangleSidePxForLevel } from './triangleBoardLayout';
import { hexBoardContentSizePx, hexRadiusPxForLevel } from './hexBoardLayout';
import type { GameState, MovingSoldierState } from './types';
import { NeighborBonusPlusOneFlight } from './NeighborBonusPlusOneFlight';
import { NeighborResonancePlaceOverlay } from './NeighborResonancePlaceOverlay';

export function GameBoard({
  gameState,
  movingSoldier,
  onCellClick,
  boardRef,
  bonusFxKeys,
}: {
  gameState: GameState;
  movingSoldier: MovingSoldierState | null;
  onCellClick: (x: number, y: number) => void;
  boardRef: RefObject<HTMLDivElement | null>;
  bonusFxKeys: string[];
}) {
  const w = gameState.level.width;
  const h = gameState.level.height;
  const grid = gameState.level.definition.gridSystem;
  const isTriangle = grid === 'TRIANGLE';
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

  if (isTriangle) {
    const side = triangleSidePxForLevel(w, h);
    const { w: contentW, h: contentH } = triangleBoardContentSizePx(w, h, side);

    return (
      <div className="w-full max-w-full overflow-x-auto">
        <div
          ref={boardRef}
          key={gameState.gameId}
          className="relative mx-auto overflow-hidden rounded-[2rem] border-[3px] border-slate-800 bg-slate-900 p-3 shadow-2xl"
          style={{ width: 'fit-content' }}
        >
          <TriangleGameBoardLayer
            gameState={gameState}
            side={side}
            contentW={contentW}
            contentH={contentH}
            onCellClick={onCellClick}
            bonusFxKeys={bonusFxKeySet}
            bonusSeconds={bonusSeconds}
          />

          {cloud && (
            <MapCloudOverlay config={cloud} boardWidthPx={contentW} boardHeightPx={contentH} />
          )}

          {movingSoldier?.phase === 'resonance' && (
            <NeighborResonancePlaceOverlay
              layout="triangle"
              x={movingSoldier.x}
              y={movingSoldier.y}
              shownValue={movingSoldier.resonanceShown}
              cellSize={side}
            />
          )}
          {movingSoldier?.phase === 'resonance' && movingSoldier.flightFrom && (
            <NeighborBonusPlusOneFlight
              layout="triangle"
              fromX={movingSoldier.flightFrom.x}
              fromY={movingSoldier.flightFrom.y}
              toX={movingSoldier.x}
              toY={movingSoldier.y}
              cellSize={side}
            />
          )}
          {movingSoldier && movingSoldier.phase !== 'resonance' && (
            <Soldier
              x={movingSoldier.x}
              y={movingSoldier.y}
              cellSize={side}
              layout="triangle"
            />
          )}
        </div>
      </div>
    );
  }

  if (isHex) {
    const r = hexRadiusPxForLevel(w, h);
    const { w: contentW, h: contentH, minX, minY } = hexBoardContentSizePx(w, h, r);

    return (
      <div className="w-full max-w-full overflow-x-auto">
        <div
          ref={boardRef}
          key={gameState.gameId}
          className="relative mx-auto overflow-hidden rounded-[2rem] border-[3px] border-slate-800 bg-slate-900 p-3 shadow-2xl"
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
              layout="hex"
              hexMin={{ x: minX, y: minY }}
            />
          )}
        </div>
      </div>
    );
  }

  const cellSize = boardCellPxForLevel(w, h);
  const gap = BOARD_GAP_PX;
  const boardWidthPx = w * cellSize + Math.max(0, w - 1) * gap;
  const boardHeightPx = h * cellSize + Math.max(0, h - 1) * gap;

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <div
        ref={boardRef}
        key={gameState.gameId}
        className="relative mx-auto overflow-hidden rounded-[2rem] border-[3px] border-slate-800 bg-slate-900 p-3 shadow-2xl"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${w}, ${cellSize}px)`,
          gridAutoRows: `${cellSize}px`,
          gap: `${gap}px`,
          width: 'fit-content',
        }}
      >
        {Array.from({ length: w * h }).map((_, i) => {
          const x = i % w;
          const y = Math.floor(i / w);
          const isValid = gameState.level.cells.some((c) => c.x === x && c.y === y);

          if (!isValid)
            return (
              <div
                key={i}
                style={{ width: cellSize, height: cellSize, minWidth: cellSize, minHeight: cellSize }}
              />
            );

          const placed = gameState.placedNumbers.find((p) => p.x === x && p.y === y);
          const key = `${x},${y}`;
          const isDynMine = gameState.dynamicMines.has(key);
          // 仍在倒數的炸點：由 countdown overlay 顯示，不渲染地雷圖示
          // 已解除的炸點（不在 blastPointsCountdown 中）：正常顯示地雷圖示
          const isMine = !blastPointsCountdown.has(key) && gameState.revealedMines.has(key);
          const isConflict = gameState.conflictCells.some((c) => c.x === x && c.y === y);
          const lossChainPhase = lossChainPhaseForKey(
            key,
            gameState.lossSequentialExplosionKeys,
            gameState.lossExplosionWaveIndex,
          );
          const isExploding = gameState.status === 'exploding' && isMine && lossChainPhase === 'none';
          const showExplosionX = gameState.explosionMarkCells.some((c) => c.x === x && c.y === y);
          const isBonusTarget = bonusTargetKeys.has(key);
          const isBonusTargetRewarded = rewardedTargetKeys.has(key);
          const showBonusFx = bonusFxKeySet.has(key);
          const blastPointCountdown = blastPointsCountdown.get(key);

          return (
            <GameCell
              key={`${gameState.gameId}-${i}`}
              x={x}
              y={y}
              cellSizePx={cellSize}
              placed={placed}
              isMine={isMine}
              isConflict={isConflict}
              isExploding={isExploding}
              showExplosionX={showExplosionX}
              isBonusTarget={isBonusTarget}
              isBonusTargetRewarded={isBonusTargetRewarded}
              showBonusFx={showBonusFx}
              bonusSeconds={bonusSeconds}
              blastPointCountdown={blastPointCountdown}
              isDigitOutpost={digitOutpostKeys.has(key)}
              isDynamicMine={isDynMine}
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
          />
        )}
        {movingSoldier && movingSoldier.phase !== 'resonance' && (
          <Soldier x={movingSoldier.x} y={movingSoldier.y} cellSize={cellSize} layout="square" />
        )}
      </div>
    </div>
  );
}
