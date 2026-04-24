import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Check, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { MissionDirectiveEmblem } from './MissionDirectiveEmblem';
import { LAST_COUNTDOWN_SOUND_SECONDS } from './constants';
import type { HeroCombatTheme } from './heroCombatTheme';
import { getHeroCombatTheme } from './heroCombatTheme';

/** 與任務進度卡一致的外觀；兩卡並排時用 flex-1 拉成同寬（邊框／底色由 heroTheme 覆寫） */
export const GAME_HEADER_CARD_CLASS =
  'flex flex-1 min-h-[3.75rem] min-w-0 flex-col justify-center rounded-2xl border-2 p-3 shadow-xl sm:flex-row sm:items-center sm:gap-3';

export function GameHeader({
  fillPercentage,
  coverageGoalPercent,
  onBack,
  onRestart,
  showNextLevelButton,
  onNextLevel,
  showChapterEndButton,
  onChapterEnd,
  levelName,
  secondsLeft,
  countdownStarted,
  guideButton,
  testCompleteButton,
  telegraphPanel,
  heroTheme: heroThemeProp,
}: {
  fillPercentage: number;
  /** 企劃定義之覆蓋率目標（%） */
  coverageGoalPercent: number;
  onBack: () => void;
  onRestart: () => void;
  /** 過關並按慶祝「確定」後，非最終關且非章內第 10 關時顯示「下一關」 */
  showNextLevelButton?: boolean;
  onNextLevel?: () => void;
  /** 章內第 10 關通關後顯示「完結」：回到行動卷宗 */
  showChapterEndButton?: boolean;
  onChapterEnd?: () => void;
  levelName: string;
  /** `null` = 本關不計時 */
  secondsLeft: number | null;
  /** 限時關：是否已選定長官電報電碼並開始倒數 */
  countdownStarted: boolean;
  /** 第一行右側，通常為「指南」 */
  guideButton?: ReactNode;
  /** 測試捷徑按鈕（例如：測試完成） */
  testCompleteButton?: ReactNode;
  /** 第二行與任務進度並排：長官電報列 */
  telegraphPanel?: ReactNode;
  /** 依幹員切換的戰鬥主題色 */
  heroTheme?: HeroCombatTheme;
}) {
  const heroTheme = heroThemeProp ?? getHeroCombatTheme('xiaoming');
  const progressCardClass = `${GAME_HEADER_CARD_CLASS} ${heroTheme.headerProgressCard}`;

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
            className={`flex shrink-0 items-center gap-2 rounded-xl border-2 border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-slate-200 transition-colors ${heroTheme.headerBackHover}`}
          >
            <ChevronLeft size={18} />
            返回
          </button>
          <div
            className={`shrink-0 rounded-2xl border-2 border-slate-800 bg-slate-900 p-2.5 shadow-lg ${heroTheme.headerMissionMarkWrap}`}
          >
            <MissionDirectiveEmblem className={heroTheme.headerMissionMark} size={34} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="mb-0 flex min-w-0 items-center gap-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              <span className="truncate">{levelName}</span>
            </h1>
          </div>
        </div>
        {(guideButton != null || testCompleteButton != null) && (
          <div className="shrink-0 flex items-center gap-2">
            {testCompleteButton}
            {guideButton}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ x: 12, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch"
      >
        <div className={progressCardClass}>
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
            {showChapterEndButton && onChapterEnd != null && (
              <button
                type="button"
                onClick={onChapterEnd}
                className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-black text-white shadow-lg transition-all active:scale-95 ${heroTheme.headerNextLevel}`}
              >
                <Check size={18} strokeWidth={2.5} />
                完結
              </button>
            )}
            {showNextLevelButton && onNextLevel != null && (
              <button
                type="button"
                onClick={onNextLevel}
                className={`inline-flex items-center gap-0.5 rounded-2xl px-4 py-2.5 text-sm font-black text-white shadow-lg transition-all active:scale-95 ${heroTheme.headerNextLevel}`}
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
