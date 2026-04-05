import { motion } from 'motion/react';
import type { GameState } from './types';

function telegraphHint(
  gameState: GameState,
  selectedHandIndex: number | null
): string {
  if (gameState.status === 'exploding') return '！！！連環爆炸中！！！';
  if (gameState.status !== 'playing') return '任務結束。';
  if (selectedHandIndex === null) return '先選電碼，再點格佈雷';
  return `電碼「${gameState.hand[selectedHandIndex]}」—請點目標格`;
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
  movingSoldier: { x: number; y: number; value: number } | null;
  onSelectHand: (index: number) => void;
}) {
  const hint = telegraphHint(gameState, selectedHandIndex);
  const n = gameState.hand.length;

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
        {gameState.hand.map((num, idx) => (
          <motion.button
            key={`${gameState.gameId}-${idx}-${num}`}
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
            {num}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
