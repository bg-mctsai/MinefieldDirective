import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Bomb, ChevronLeft, RefreshCw } from 'lucide-react';

/** 與任務進度卡一致的外觀；兩卡並排時用 flex-1 拉成同寬 */
export const GAME_HEADER_CARD_CLASS =
  'flex flex-1 min-h-[4.5rem] min-w-0 flex-col justify-center rounded-3xl border-2 border-slate-800 bg-slate-900 p-4 shadow-xl sm:flex-row sm:items-center sm:gap-4';

export function GameHeader({
  fillPercentage,
  coverageGoalPercent,
  onBack,
  onRestart,
  commanderPanel,
  levelName,
  statusMessage,
  secondsLeft,
  countdownStarted,
}: {
  fillPercentage: number;
  /** 企劃定義之覆蓋率目標（%） */
  coverageGoalPercent: number;
  onBack: () => void;
  onRestart: () => void;
  commanderPanel: ReactNode;
  levelName: string;
  statusMessage: string;
  /** `null` = 本關不計時 */
  secondsLeft: number | null;
  /** 限時關：是否已選定長官電報電碼並開始倒數 */
  countdownStarted: boolean;
}) {
  return (
    <div className="mb-8 flex w-full max-w-6xl flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center">
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex shrink-0 items-center gap-4"
      >
        <button
          type="button"
          onClick={onBack}
          className="flex shrink-0 items-center gap-2 rounded-xl border-2 border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-slate-200 transition-colors hover:border-amber-500/60 hover:text-amber-400"
        >
          <ChevronLeft size={18} />
          返回
        </button>
        <div className="rounded-2xl border-2 border-slate-800 bg-slate-900 p-3 shadow-lg">
          <Bomb className="text-amber-500" size={32} />
        </div>
        <div>
          <h1 className="mb-0 flex items-center gap-2 text-3xl font-black tracking-tight text-white">
            雷區指令：{levelName}
          </h1>
          <p className="text-sm font-medium text-slate-500">{statusMessage}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex w-full min-w-0 flex-1 flex-col items-stretch gap-4 sm:flex-row"
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
                          : secondsLeft <= 10
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
          <button
            type="button"
            onClick={onRestart}
            className="mt-3 shrink-0 self-center rounded-2xl bg-slate-800 p-3 text-slate-300 transition-all hover:bg-slate-700 active:scale-95 sm:mt-0 sm:ml-auto sm:self-auto"
            title="重新開始"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {commanderPanel}
      </motion.div>
    </div>
  );
}
