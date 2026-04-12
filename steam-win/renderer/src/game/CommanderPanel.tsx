import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { GAME_FIXED, sub } from './gameFixedMessages';
import { resolveSignalJammingStepMs, signalJammingDisplayedDigit } from './signalJamming';
import type { GameState, MovingSoldierState } from './types';

function telegraphHint(
  gameState: GameState,
  selectedHandIndex: number | null
): string {
  const H = GAME_FIXED.commanderRowHint;
  if (gameState.status === 'exploding') return H.chainExploding;
  if (gameState.status !== 'playing') return H.missionOver;
  const jam = Boolean(gameState.level.definition.commandSlotReceiveJamming && gameState.jammingEpochMs > 0);
  if (selectedHandIndex === null) {
    return jam ? H.selectTelegraphJammingIdle : H.selectTelegraphNormal;
  }
  if (jam) {
    return H.digitLockedPickCell;
  }
  return sub(H.pickTargetCellWithDigit, { digit: gameState.hand[selectedHandIndex] });
}

/** 與「指南」同一列的橫向長官電報列（電碼按鈕尺寸與先前 header 卡一致） */
export function CommanderTelegraphRow({
  gameState,
  selectedHandIndex,
  movingSoldier,
  onSelectHand,
}: {
  gameState: GameState;
  selectedHandIndex: number | null;
  movingSoldier: MovingSoldierState | null;
  onSelectHand: (index: number) => void;
}) {
  const hint = telegraphHint(gameState, selectedHandIndex);
  const n = gameState.hand.length;
  const jamming =
    gameState.status === 'playing' &&
    Boolean(gameState.level.definition.commandSlotReceiveJamming && gameState.jammingEpochMs > 0);

  const jammingStepMs = resolveSignalJammingStepMs(gameState.level.definition.commandSlotJammingStepMs);

  const [, setJammingFrame] = useState(0);
  useEffect(() => {
    if (!jamming) return;
    const id = window.setInterval(() => setJammingFrame((x) => x + 1), Math.max(40, jammingStepMs / 2));
    return () => clearInterval(id);
  }, [jamming, jammingStepMs, gameState.gameId, gameState.jammingEpochMs]);

  return (
    <div
      className="flex h-full min-h-[3.25rem] min-w-0 flex-1 items-center gap-2 rounded-2xl border-2 border-slate-800 bg-slate-900 px-2 py-1.5 shadow-xl sm:gap-3 sm:px-3 sm:py-2"
      title={hint}
    >
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="flex flex-col leading-none">
          <span className="text-xs font-black text-white sm:text-sm">長官電報</span>
          <span className="hidden text-[8px] font-bold uppercase tracking-wide text-slate-500 sm:block">
            HQ Telegraph
          </span>
        </div>
        <div className="flex gap-1">
          <motion.div
            animate={gameState.placedInTurn >= 1 ? { scale: [1, 1.2, 1] } : {}}
            className={`h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5 ${
              gameState.placedInTurn >= 1 ? 'bg-amber-500 shadow-[0_0_6px_#f59e0b]' : 'bg-slate-800'
            }`}
          />
          <motion.div
            animate={gameState.placedInTurn >= 2 ? { scale: [1, 1.2, 1] } : {}}
            className={`h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5 ${
              gameState.placedInTurn >= 2 ? 'bg-amber-500 shadow-[0_0_6px_#f59e0b]' : 'bg-slate-800'
            }`}
          />
        </div>
      </div>

      <div
        className="grid min-w-0 flex-1 gap-1.5 sm:gap-2"
        style={{
          gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
        }}
      >
        {gameState.hand.map((num, idx) => {
          const lock = gameState.jammingLockedSlot;
          const displayNum = jamming
            ? lock && lock.slotIndex === idx
              ? lock.value
              : signalJammingDisplayedDigit(
                  gameState.jammingEpochMs,
                  idx,
                  Date.now(),
                  gameState.level.definition.commandSlotJammingStepMs,
                  gameState.level.definition.gridSystem,
                )
            : num;
          return (
          <motion.button
            key={`${gameState.gameId}-slot-${idx}`}
            type="button"
            whileHover={gameState.status === 'playing' ? { y: -2, scale: 1.03 } : {}}
            whileTap={gameState.status === 'playing' ? { scale: 0.95 } : {}}
            disabled={gameState.status !== 'playing' || movingSoldier !== null}
            onClick={() => onSelectHand(idx)}
            className={`flex aspect-square max-h-[3.25rem] min-h-[2.75rem] w-full min-w-0 items-center justify-center rounded-2xl border-[3px] text-xl font-black transition-all sm:max-h-[3.5rem] sm:text-2xl
                ${
                  selectedHandIndex === idx
                    ? 'border-amber-400 bg-amber-600 text-white shadow-lg shadow-amber-900/40'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-amber-400'
                }
                ${
                  gameState.status !== 'playing' || movingSoldier !== null ? 'cursor-not-allowed opacity-40' : ''
                }
              `}
          >
            {displayNum}
          </motion.button>
          );
        })}
      </div>
    </div>
  );
}
