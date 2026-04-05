import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Crown, Map, Trophy } from 'lucide-react';
import type { GameState } from './types';

function messageColorClass(status: GameState['status']): string {
  if (status === 'lost' || status === 'exploding') return 'text-red-500';
  if (status === 'won') return 'text-emerald-500';
  return 'text-slate-300';
}

/** 地圖上方狀態台詞：單行、極窄寬時可橫向捲動 */
export function GameStatusMessageBar({ gameState }: { gameState: GameState }) {
  return (
    <div className="mb-2 w-full max-w-6xl shrink-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={gameState.message}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          className="w-full"
        >
          <div className="rounded-xl border border-slate-700/90 bg-slate-900/95 px-3 py-1.5 shadow-md">
            <div className="min-w-0 overflow-x-auto [-webkit-overflow-scrolling:touch]">
              <p
                className={`whitespace-nowrap text-center text-[13px] font-bold leading-snug sm:text-sm ${messageColorClass(gameState.status)}`}
              >
                {gameState.message}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function GameStatusPanel({
  gameState,
  currentLevelIndex,
  levelCount,
  fillPercentage,
  onNextLevel,
  onReturnToMission,
  onReplayFinalLevel,
}: {
  gameState: GameState;
  currentLevelIndex: number;
  levelCount: number;
  fillPercentage: number;
  onNextLevel: () => void;
  onReturnToMission?: () => void;
  onReplayFinalLevel?: () => void;
}) {
  const isFinalLevel = currentLevelIndex >= levelCount - 1;
  const showWinPanel = gameState.status === 'won' && (!isFinalLevel || onReturnToMission);

  return (
    <div className="mt-2 w-full max-w-6xl">
      <AnimatePresence>
        {showWinPanel && (
          <motion.div
            key="won-panel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            className="w-full"
          >
            {!isFinalLevel && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-emerald-500/85 bg-slate-900/95 px-3 py-2 shadow-md shadow-emerald-950/20 sm:gap-3 sm:px-4 sm:py-2.5">
                <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-900/35">
                    <Trophy size={20} className="text-emerald-400" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-black leading-tight text-white sm:text-base">任務成功！</p>
                    <p className="text-[11px] font-bold leading-tight text-emerald-500 sm:text-xs">
                      覆蓋率 {fillPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onNextLevel}
                  className="inline-flex shrink-0 items-center gap-0.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-black text-white shadow-sm shadow-emerald-900/30 transition-all hover:bg-emerald-500 active:scale-[0.98] sm:px-4 sm:text-sm"
                >
                  下一關
                  <ChevronRight className="shrink-0" size={16} strokeWidth={2.5} />
                </button>
              </div>
            )}

            {isFinalLevel && onReturnToMission && (
              <div className="flex flex-col gap-2 rounded-xl border-2 border-amber-400/85 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 px-3 py-2.5 shadow-md shadow-amber-950/20 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 ring-2 ring-amber-400/35">
                    <Crown size={20} className="text-amber-400" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 sm:text-[11px]">
                      戰役全破
                    </p>
                    <p className="text-sm font-black leading-tight text-white sm:text-base">恭喜破關！</p>
                    <p className="text-[11px] font-medium leading-tight text-slate-400 sm:text-xs">
                      已完成 {levelCount} 關 · 覆蓋率{' '}
                      <span className="font-bold text-emerald-400">{fillPercentage.toFixed(1)}%</span>
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={onReturnToMission}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-slate-950 shadow-sm transition-all hover:bg-amber-400 active:scale-[0.98] sm:flex-none sm:min-w-[7.5rem] sm:text-sm"
                  >
                    <Map size={15} strokeWidth={2.5} />
                    作戰地圖
                  </button>
                  {onReplayFinalLevel && (
                    <button
                      type="button"
                      onClick={onReplayFinalLevel}
                      className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-600 bg-slate-800/90 px-3 py-2 text-xs font-black text-slate-200 transition-all hover:border-slate-500 hover:bg-slate-800 active:scale-[0.98] sm:flex-none sm:min-w-[7.5rem] sm:text-sm"
                    >
                      再挑戰
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
