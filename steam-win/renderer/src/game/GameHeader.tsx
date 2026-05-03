import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Check, ChevronLeft, ChevronRight, Flag, RefreshCw } from 'lucide-react';
import { MissionDirectiveEmblem } from './MissionDirectiveEmblem';
import { LAST_COUNTDOWN_SOUND_SECONDS } from './constants';
import type { HeroCombatTheme } from './heroCombatTheme';
import { getHeroCombatTheme } from './heroCombatTheme';
import type { Medal } from './medalThresholds';
import type { MedalThresholds } from '../levelData/types';

const MEDAL_TONE: Record<
  Medal,
  { text: string; ring: string; glow: string; tickOn: string; tickOff: string; label: string }
> = {
  bronze: {
    text: 'text-amber-700',
    ring: 'ring-amber-700/60',
    glow: 'shadow-[0_0_18px_rgba(180,83,9,0.55)]',
    tickOn: 'bg-amber-500',
    tickOff: 'bg-slate-600',
    label: 'text-amber-600/95',
  },
  silver: {
    text: 'text-slate-200',
    ring: 'ring-slate-300/70',
    glow: 'shadow-[0_0_18px_rgba(226,232,240,0.55)]',
    tickOn: 'bg-slate-200',
    tickOff: 'bg-slate-600',
    label: 'text-slate-300/90',
  },
  gold: {
    text: 'text-yellow-300',
    ring: 'ring-yellow-300/80',
    glow: 'shadow-[0_0_22px_rgba(253,224,71,0.7)]',
    tickOn: 'bg-yellow-300',
    tickOff: 'bg-slate-600',
    label: 'text-yellow-200/90',
  },
};

const MEDAL_LABEL: Record<Medal, string> = { bronze: '銅', silver: '銀', gold: '金' };

const PROGRESS_THEME_BY_MEDAL: Record<
  Medal,
  { valueColor: string; barFill: string; glow: string }
> = {
  bronze: {
    valueColor: 'text-amber-400',
    barFill: 'bg-gradient-to-r from-amber-800 via-amber-500 to-amber-300',
    glow: 'shadow-[0_0_16px_rgba(245,158,11,0.35)]',
  },
  silver: {
    valueColor: 'text-slate-100',
    barFill: 'bg-gradient-to-r from-slate-700 via-slate-300 to-slate-100',
    glow: 'shadow-[0_0_16px_rgba(226,232,240,0.35)]',
  },
  gold: {
    valueColor: 'text-yellow-300',
    barFill: 'bg-gradient-to-r from-yellow-800 via-yellow-400 to-yellow-200',
    glow: 'shadow-[0_0_18px_rgba(253,224,71,0.45)]',
  },
};

/** 與火力進度卡一致的外觀；兩卡並排時用 flex-1 拉成同寬（邊框／底色由 heroTheme 覆寫） */
export const GAME_HEADER_CARD_CLASS =
  'flex flex-1 min-h-[4.5rem] min-w-0 flex-col justify-center rounded-2xl border-2 p-4 shadow-xl sm:flex-row sm:items-center sm:gap-4';

export function GameHeader({
  destructivePowerPercentage,
  destructivePowerMineCount,
  destructivePowerTotalCells,
  destructivePowerOverlapExtra,
  medalThresholds,
  projectedMedal,
  showEarlySettleButton,
  onEarlySettle,
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
  /** 火力 0～100：加權分子／總格；進度條與勳章刻度與此對齊 */
  destructivePowerPercentage: number;
  destructivePowerMineCount: number;
  destructivePowerTotalCells: number;
  /** 加權分子額外量：Σmax(1,鄰近數字數) − 雷格數 */
  destructivePowerOverlapExtra: number;
  /** 三段勳章火力門檻（0～1） */
  medalThresholds: MedalThresholds;
  /** 對局中即時投影：此刻結算可拿到的勳章（未達銅為 null） */
  projectedMedal: Medal | null;
  /** 是否顯示「撤離」按鈕（達銅且 status === 'playing'） */
  showEarlySettleButton?: boolean;
  onEarlySettle?: () => void;
  onBack: () => void;
  onRestart: () => void;
  /** 過關並按慶祝「確定」後，非最終關且非章內第 8 關時顯示「下一關」 */
  showNextLevelButton?: boolean;
  onNextLevel?: () => void;
  /** 章內第 8 關通關後顯示「完結」：回到行動卷宗 */
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
  /** 第二行與火力卡並排：長官電報列 */
  telegraphPanel?: ReactNode;
  /** 依幹員切換的戰鬥主題色 */
  heroTheme?: HeroCombatTheme;
}) {
  const heroTheme = heroThemeProp ?? getHeroCombatTheme('xiaoming');
  const progressCardClass = `${GAME_HEADER_CARD_CLASS} ${heroTheme.headerProgressCard}`;
  const progressTheme =
    projectedMedal != null
      ? PROGRESS_THEME_BY_MEDAL[projectedMedal]
      : {
          valueColor: 'text-emerald-500',
          barFill: 'bg-gradient-to-r from-emerald-800 via-emerald-500 to-emerald-400',
          glow: '',
        };

  const firepowerFractionLabel =
    destructivePowerTotalCells > 0
      ? destructivePowerOverlapExtra > 0
        ? `地雷（${destructivePowerMineCount}+${destructivePowerOverlapExtra}）/${destructivePowerTotalCells} 格`
        : `地雷 ${destructivePowerMineCount}/${destructivePowerTotalCells} 格`
      : null;

  return (
    <div className="mb-5 flex w-full max-w-7xl flex-col gap-4">
      <motion.div
        initial={{ x: -12, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex w-full min-w-0 items-center justify-between gap-3"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onBack}
            className={`flex shrink-0 items-center gap-2 rounded-xl border-2 border-slate-700 bg-slate-900 px-4 py-2.5 text-base font-bold text-slate-200 transition-colors ${heroTheme.headerBackHover}`}
          >
            <ChevronLeft size={18} />
            返回
          </button>
          <div
            className={`shrink-0 rounded-2xl border-2 border-slate-800 bg-slate-900 p-2.5 shadow-lg ${heroTheme.headerMissionMarkWrap}`}
          >
            <MissionDirectiveEmblem className={heroTheme.headerMissionMark} size={40} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="mb-0 flex min-w-0 items-center gap-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
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
          <div className="flex w-full min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1 px-1 sm:px-2">
              <div className="mb-1 flex min-w-0 flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 sm:gap-x-3">
                  <span className="shrink-0 text-sm font-black uppercase tracking-[0.08em] text-slate-300 sm:text-base">
                    火力
                  </span>
                  {firepowerFractionLabel != null ? (
                    <span className="max-w-[min(100%,14rem)] truncate text-xs font-bold tabular-nums text-slate-400 sm:max-w-none sm:text-sm">
                      {firepowerFractionLabel}
                    </span>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 text-xl font-black tabular-nums sm:text-2xl ${progressTheme.valueColor}`}
                >
                  {destructivePowerPercentage.toFixed(1)}%
                </span>
              </div>
              <MedalThresholdProgressBar
                valuePercentage={destructivePowerPercentage}
                medalThresholds={medalThresholds}
                projectedMedal={projectedMedal}
                barFillClass={progressTheme.barFill}
                barGlowClass={progressTheme.glow}
                mineLine={null}
              />
            </div>
            {secondsLeft !== null && (
              <>
                <div className="hidden h-10 w-0.5 shrink-0 self-center bg-slate-800 sm:block" />
                <div className="shrink-0 px-2 text-center sm:min-w-[4.5rem]">
                  <div className="mb-1 text-xs font-black uppercase tracking-[0.08em] text-slate-300">
                    {countdownStarted ? '剩餘時間' : '任務時限'}
                  </div>
                  <div
                    className={`text-3xl font-black tabular-nums ${
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
                    <div className="mt-0.5 text-xs font-bold text-slate-400">選定電碼後倒數</div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="mt-3 flex shrink-0 flex-wrap items-center justify-center gap-2 self-center sm:mt-0 sm:ml-auto sm:justify-end sm:self-auto">
            {showEarlySettleButton && onEarlySettle != null && projectedMedal != null && (
              <button
                type="button"
                onClick={onEarlySettle}
                className={`inline-flex items-center gap-1.5 rounded-2xl border-2 px-3.5 py-2 text-xs font-black tracking-wide transition-all active:scale-95 ring-1 ${MEDAL_TONE[projectedMedal].text} ${MEDAL_TONE[projectedMedal].ring} ${MEDAL_TONE[projectedMedal].glow} border-current bg-slate-900/70 hover:bg-slate-900`}
                title={`現在撤離可獲：${MEDAL_LABEL[projectedMedal]}級勳章`}
              >
                <Flag size={14} strokeWidth={2.5} />
                撤離
              </button>
            )}
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

const MEDAL_ORDER: { key: Medal; pct: (t: MedalThresholds) => number }[] = [
  { key: 'bronze', pct: (t) => t.bronze * 100 },
  { key: 'silver', pct: (t) => t.silver * 100 },
  { key: 'gold', pct: (t) => t.gold * 100 },
];

/** 進度條下方：地雷格數與勳章刻度 % 同字級，易讀 */
const BAR_FOOTER_TEXT = 'text-sm font-black tabular-nums leading-tight sm:text-base';

function MedalThresholdProgressBar({
  valuePercentage,
  medalThresholds,
  projectedMedal,
  barFillClass,
  barGlowClass,
  mineLine,
}: {
  /** 與上方大數字一致：火力 0～100 */
  valuePercentage: number;
  medalThresholds: MedalThresholds;
  projectedMedal: Medal | null;
  barFillClass: string;
  barGlowClass?: string;
  /** 長條下方左側（原刻度說明位置）；null 則不顯示 */
  mineLine: string | null;
}) {
  const fillW = Math.min(100, Math.max(0, valuePercentage));
  return (
    <div className="w-full min-w-0">
      <div className="relative w-full">
        <div className="relative h-2.5 w-full">
          <div className="h-full w-full overflow-hidden rounded-full bg-slate-800/90 ring-1 ring-slate-700/40">
            <div
              className={`h-full max-w-full rounded-full transition-[width] duration-300 ease-out ${barFillClass} ${barGlowClass ?? ''}`}
              style={{ width: `${fillW}%` }}
            />
          </div>
          {MEDAL_ORDER.map(({ key, pct: pctFn }) => {
            const pct = pctFn(medalThresholds);
            const left = Math.min(100, Math.max(0, pct));
            const passed = valuePercentage + 1e-6 >= pct;
            const isActive = projectedMedal === key;
            const tone = MEDAL_TONE[key];
            return (
              <div
                key={`tick-${key}`}
                className="pointer-events-none absolute top-1/2 w-0 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${left}%` }}
                aria-hidden
              >
                <div
                  className={`h-3.5 w-px rounded-full shadow-sm transition-colors ${
                    passed ? tone.tickOn : tone.tickOff
                  } ${isActive && passed ? 'opacity-100 ring-1 ring-white/30' : ''}`}
                />
              </div>
            );
          })}
        </div>
        <div className="relative mt-1.5 min-h-6 w-full sm:min-h-7">
          {mineLine != null ? (
            <span
              className={`pointer-events-none absolute left-0 top-0 z-[1] max-w-[min(14rem,52%)] truncate ${BAR_FOOTER_TEXT} text-slate-400 sm:max-w-[48%]`}
            >
              {mineLine}
            </span>
          ) : null}
          {MEDAL_ORDER.map(({ key, pct: pctFn }) => {
            const pct = pctFn(medalThresholds);
            const left = Math.min(100, Math.max(0, pct));
            const passed = valuePercentage + 1e-6 >= pct;
            const isActive = projectedMedal === key;
            const tone = MEDAL_TONE[key];
            return (
              <div
                key={`pct-${key}`}
                className="pointer-events-none absolute left-0 top-0 -translate-x-1/2"
                style={{ left: `${left}%` }}
                aria-hidden
              >
                <span
                  className={`whitespace-nowrap ${BAR_FOOTER_TEXT} ${
                    passed ? tone.label : 'text-slate-500'
                  } ${passed ? 'font-extrabold' : 'font-bold'} ${
                    isActive ? 'underline decoration-dotted decoration-current underline-offset-2' : ''
                  } ${passed ? 'drop-shadow-[0_0_5px_rgba(255,255,255,0.12)]' : ''}`}
                >
                  {Math.round(pct)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
