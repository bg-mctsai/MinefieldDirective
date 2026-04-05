import type { RefObject } from 'react';
import { GameCell } from './GameCell';
import { MapCloudOverlay } from './MapCloudOverlay';
import { Soldier } from './Soldier';
import { TriangleGameBoardLayer } from './TriangleGameBoardLayer';
import { BOARD_GAP_PX, boardCellPxForLevel } from './constants';
import { triangleBoardContentSizePx, triangleSidePxForLevel } from './triangleBoardLayout';
import type { GameState } from './types';

export function GameBoard({
  gameState,
  movingSoldier,
  onCellClick,
  boardRef,
}: {
  gameState: GameState;
  movingSoldier: { x: number; y: number; value: number } | null;
  onCellClick: (x: number, y: number) => void;
  boardRef: RefObject<HTMLDivElement | null>;
}) {
  const w = gameState.level.width;
  const h = gameState.level.height;
  const isTriangle = gameState.level.definition.gridSystem === 'TRIANGLE';
  const cloud = gameState.level.definition.mapCloudOverlay;

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
          />

          {cloud && (
            <MapCloudOverlay config={cloud} boardWidthPx={contentW} boardHeightPx={contentH} />
          )}

          {movingSoldier && (
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
          const isMine = gameState.revealedMines.has(`${x},${y}`);
          const isConflict = gameState.conflictCells.some((c) => c.x === x && c.y === y);
          const isExploding = gameState.status === 'exploding' && isMine;
          const showExplosionX = gameState.explosionMarkCells.some((c) => c.x === x && c.y === y);

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
              status={gameState.status}
              onClick={onCellClick}
            />
          );
        })}

        {cloud && (
          <MapCloudOverlay config={cloud} boardWidthPx={boardWidthPx} boardHeightPx={boardHeightPx} />
        )}

        {movingSoldier && (
          <Soldier x={movingSoldier.x} y={movingSoldier.y} cellSize={cellSize} layout="square" />
        )}
      </div>
    </div>
  );
}
