import { motion } from 'motion/react';
import { User } from 'lucide-react';
import type { GameState } from './types';
import { GAME_HEADER_CARD_CLASS } from './GameHeader';

export function CommanderPanel({
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
  const hint =
    gameState.status === 'exploding' ? (
      <span className="animate-pulse text-red-500">！！！連環爆炸中！！！</span>
    ) : gameState.status !== 'playing' ? (
      '任務結束。'
    ) : selectedHandIndex === null ? (
      '先選電碼，再點格佈雷'
    ) : (
      `電碼「${gameState.hand[selectedHandIndex]}」—請點目標格`
    );

  return (
    <div className={`relative min-w-0 overflow-hidden ${GAME_HEADER_CARD_CLASS}`}>
      <div className="pointer-events-none absolute right-0 top-0 p-2 opacity-5">
        <User size={56} className="text-white" />
      </div>

      <div className="relative z-10 flex shrink-0 flex-col gap-1 sm:w-[7.5rem]">
        <h2 className="text-sm font-black leading-tight text-white">長官電報</h2>
        <p className="hidden text-[9px] font-bold uppercase text-slate-500 sm:block">HQ Telegraph</p>
        <div className="flex gap-1.5">
          <motion.div
            animate={gameState.placedInTurn >= 1 ? { scale: [1, 1.2, 1] } : {}}
            className={`h-2.5 w-2.5 rounded-full ${
              gameState.placedInTurn >= 1 ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-slate-800'
            }`}
          />
          <motion.div
            animate={gameState.placedInTurn >= 2 ? { scale: [1, 1.2, 1] } : {}}
            className={`h-2.5 w-2.5 rounded-full ${
              gameState.placedInTurn >= 2 ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-slate-800'
            }`}
          />
        </div>
        <p className="max-w-[10rem] truncate text-[10px] font-bold text-slate-500 sm:max-w-none sm:whitespace-normal sm:text-[9px]">
          {hint}
        </p>
      </div>

      <div
        className="relative z-10 grid w-full min-w-0 flex-1 gap-2 sm:max-w-none"
        style={{
          gridTemplateColumns: `repeat(${gameState.hand.length}, minmax(0, 1fr))`,
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
