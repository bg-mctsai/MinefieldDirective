import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Bomb, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { LAST_COUNTDOWN_SOUND_SECONDS } from './constants';

/** 與任務進度卡一致的外觀；兩卡並排時用 flex-1 拉成同寬 */
export const GAME_HEADER_CARD_CLASS =
  'flex flex-1 min-h-[3.75rem] min-w-0 flex-col justify-center rounded-2xl border-2 border-slate-800 bg-slate-900 p-3 shadow-xl sm:flex-row sm:items-center sm:gap-3';

export function GameHeader({
  fillPercentage,
  coverageGoalPercent,
  onBack,
  onRestart,
  showNextLevelButton,
  onNextLevel,
  levelName,
  secondsLeft,
  countdownStarted,
  guideButton,
  telegraphPanel,
}: {
  fillPercentage: number;
  /** 企劃定義之覆蓋率目標（%） */
  coverageGoalPercent: number;
  onBack: () => void;
  onRestart: () => void;
  /** 過關並按慶祝「確定」後，非最終關時顯示 */
  showNextLevelButton?: boolean;
  onNextLevel?: () => void;
  levelName: string;
  /** `null` = 本關不計時 */
  secondsLeft: number | null;
  /** 限時關：是否已選定長官電報電碼並開始倒數 */
  countdownStarted: boolean;
  /** 第一行右側，通常為「指南」 */
  guideButton?: ReactNode;
  /** 第二行與任務進度並排：長官電報列 */
  telegraphPanel?: ReactNode;
}) {
  return (
    <div className="mb-4 flex w-full max-w-6xl flex-col gap-3">
      <motion.div
        initial={{ x: -12, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex w-full min-w-0 items-center justify-between gap-3"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex shrink-0 items-center gap-2 rounded-xl border-2 border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-slate-200 transition-colors hover:border-amber-500/60 hover:text-amber-400"
          >
            <ChevronLeft size={18} />
            返回
          </button>
          <div className="shrink-0 rounded-2xl border-2 border-slate-800 bg-slate-900 p-3 shadow-lg">
            <Bomb className="text-amber-500" size={32} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="mb-0 flex min-w-0 items-center gap-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              <span className="truncate">{levelName}</span>
            </h1>
          </div>
        </div>
        {guideButton != null && <div className="shrink-0">{guideButton}</div>}
      </motion.div>

      <motion.div
        initial={{ x: 12, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch"
      >
        <div className={GAME_HEADER_CARD_CLASS}>
          <div className="flex flex-1 flex-wrap items-center justify-center gap-4 sm:justify-start">
            <div className="px-2 text-center">
              <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">任務進度</div>
              <div className="text-2xl font-black text-emerald-500">{fillPercentage.toFixed(1)}%</div>
            </div>
            <div className="hidden h-10 w-0.5 bg-slate-800 sm:block" />
            <div className="px-2 text-center">
              <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">目標</div>
              <div className="text-2xl font-black text-slate-600">{coverageGoalPercent.toFixed(0)}%</div>
            </div>
            {secondsLeft !== null && (
              <>
                <div className="hidden h-10 w-0.5 bg-slate-800 sm:block" />
                <div className="px-2 text-center">
                  <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {countdownStarted ? '剩餘時間' : '任務時限'}
                  </div>
                  <div
                    className={`text-2xl font-black tabular-nums ${
                      !countdownStarted && secondsLeft > 0
                        ? 'text-slate-500'
                        : secondsLeft <= 0
                          ? 'text-red-500'
                          : secondsLeft <= LAST_COUNTDOWN_SOUND_SECONDS
                            ? 'text-amber-400'
                            : 'text-sky-400'
                    }`}
                  >
                    {secondsLeft}s
                  </div>
                  {!countdownStarted && secondsLeft > 0 && (
                    <div className="mt-0.5 text-[9px] font-bold text-slate-600">選定電碼後倒數</div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="mt-3 flex shrink-0 flex-wrap items-center justify-center gap-2 self-center sm:mt-0 sm:ml-auto sm:justify-end sm:self-auto">
            {showNextLevelButton && onNextLevel != null && (
              <button
                type="button"
                onClick={onNextLevel}
                className="inline-flex items-center gap-0.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-900/35 transition-all hover:bg-emerald-500 active:scale-95"
              >
                下一關
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            )}
            <button
              type="button"
              onClick={onRestart}
              className="rounded-2xl bg-slate-800 p-3 text-slate-300 transition-all hover:bg-slate-700 active:scale-95"
              title="重新開始"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {telegraphPanel != null && (
          <div className="flex min-h-[3.75rem] min-w-0 flex-1 flex-col">{telegraphPanel}</div>
        )}
      </motion.div>
    </div>
  );
}
