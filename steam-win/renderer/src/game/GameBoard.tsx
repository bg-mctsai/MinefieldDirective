import type { RefObject } from 'react';
import { GameCell } from './GameCell';
import { Soldier } from './Soldier';
import { BOARD_CELL_PX } from './constants';
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
  const cellSize = BOARD_CELL_PX;

  return (
    <div
      ref={boardRef}
      key={gameState.gameId}
      className="relative overflow-hidden rounded-[2.5rem] border-4 border-slate-800 bg-slate-900 p-4 shadow-2xl"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gameState.level.width}, minmax(0, 1fr))`,
        gap: '4px',
        width: 'fit-content',
      }}
    >
      {movingSoldier && <Soldier x={movingSoldier.x} y={movingSoldier.y} cellSize={cellSize} />}

      {Array.from({ length: gameState.level.width * gameState.level.height }).map((_, i) => {
        const x = i % gameState.level.width;
        const y = Math.floor(i / gameState.level.width);
        const isValid = gameState.level.cells.some((c) => c.x === x && c.y === y);

        if (!isValid) return <div key={i} className="h-10 w-10" />;

        const placed = gameState.placedNumbers.find((p) => p.x === x && p.y === y);
        const isMine = gameState.revealedMines.has(`${x},${y}`);
        const isConflict = gameState.conflictCells.some((c) => c.x === x && c.y === y);
        const isExploding = gameState.status === 'exploding' && isMine;

        return (
          <GameCell
            key={`${gameState.gameId}-${i}`}
            x={x}
            y={y}
            placed={placed}
            isMine={isMine}
            isConflict={isConflict}
            isExploding={isExploding}
            status={gameState.status}
            onClick={onCellClick}
          />
        );
      })}
    </div>
  );
}
