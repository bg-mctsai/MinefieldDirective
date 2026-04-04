import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Map } from 'lucide-react';
import type { GameState } from './types';

export function GameStatusPanel({
  gameState,
  currentLevelIndex,
  levelCount,
  onNextLevel,
  onReturnToMission,
}: {
  gameState: GameState;
  currentLevelIndex: number;
  levelCount: number;
  onNextLevel: () => void;
  onReturnToMission?: () => void;
}) {
  const isFinalLevel = currentLevelIndex >= levelCount - 1;
  return (
    <div className="mt-8 w-full max-w-md text-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={gameState.message}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          <div className="inline-block max-w-lg rounded-3xl border-2 border-slate-800 bg-slate-900 px-6 py-4 text-left shadow-lg">
            <p
              className={`whitespace-pre-line text-base font-bold leading-relaxed ${
                gameState.status === 'lost' || gameState.status === 'exploding'
                  ? 'text-red-500'
                  : gameState.status === 'won'
                    ? 'text-emerald-500'
                    : 'text-slate-300'
              }`}
            >
              {gameState.message}
            </p>
          </div>

          {gameState.status === 'won' && (!isFinalLevel || onReturnToMission) && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex justify-center gap-4"
            >
              {!isFinalLevel && (
                <button
                  type="button"
                  onClick={onNextLevel}
                  className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 font-black text-white shadow-lg shadow-emerald-900/40 transition-all hover:bg-emerald-700 active:scale-95"
                >
                  下一關 <ChevronRight size={20} />
                </button>
              )}
              {isFinalLevel && onReturnToMission && (
                <button
                  type="button"
                  onClick={onReturnToMission}
                  className="flex items-center gap-2 rounded-2xl border-2 border-amber-500/60 bg-amber-500/10 px-8 py-4 font-black text-amber-200 shadow-lg transition-all hover:bg-amber-500/20 active:scale-95"
                >
                  <Map size={20} /> 返回作戰地圖
                </button>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
