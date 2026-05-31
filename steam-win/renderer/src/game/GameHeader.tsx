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
  'flex h-full min-h-[2.65rem] min-w-0 flex-1 flex-col justify-center rounded-lg border-2 p-2 shadow-md sm:min-h-[2.85rem] sm:flex-row sm:items-center sm:gap-2 sm:rounded-xl sm:p-2.5 sm:shadow-lg md:rounded-2xl md:shadow-xl';

/** 角色訊息卡：與火力卡同高，內容恆為橫向（頭像＋台詞） */
export const GAME_HEADER_MESSAGE_CARD_CLASS =
  'flex h-full min-h-[2.65rem] min-w-0 flex-1 flex-row items-center gap-2 rounded-lg border-2 p-2 shadow-md sm:min-h-[2.85rem] sm:gap-2.5 sm:rounded-xl sm:p-2.5 sm:shadow-lg md:rounded-2xl md:shadow-xl';

export function GameHeader({
  destructivePowerPercentage,
  destructivePowerMineCount,
  destructivePowerTotalCells,
  destructivePowerOverlapExtra,
  destructivePowerDigitLinkBonus = 0,
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
  statusMessagePanel,
  heroTheme: heroThemeProp,
}: {
  /** 火力 0～100：加權分子／總格；進度條與勳章刻度與此對齊 */
  destructivePowerPercentage: number;
  destructivePowerMineCount: number;
  destructivePowerTotalCells: number;
  /** 加權分子額外量：Σmax(1,鄰近數字數) − 雷格數 */
  destructivePowerOverlapExtra: number;
  /** 克萊兒生命鏈結加成（含於 overlapExtra 與 weightedSum） */
  destructivePowerDigitLinkBonus?: number;
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
  /** 第二行與火力卡並排：角色訊息列 */
  statusMessagePanel?: ReactNode;
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

  const mineOverlapExtra = Math.max(0, destructivePowerOverlapExtra - destructivePowerDigitLinkBonus);
  const firepowerFractionLabel =
    destructivePowerTotalCells > 0
      ? (() => {
          const parts: string[] = [];
          if (mineOverlapExtra > 0) parts.push(String(mineOverlapExtra));
          if (destructivePowerDigitLinkBonus > 0) parts.push(`鏈${destructivePowerDigitLinkBonus}`);
          if (parts.length === 0) {
            return `地雷 ${destructivePowerMineCount}/${destructivePowerTotalCells} 格`;
          }
          return `地雷（${destructivePowerMineCount}+${parts.join('+')}）/${destructivePowerTotalCells} 格`;
        })()
      : null;

  return (
    <div className="mb-1 flex w-full max-w-7xl shrink-0 flex-col gap-1 sm:mb-1.5 sm:gap-1.5">
      <motion.div
        initial={{ x: -12, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex w-full min-w-0 items-center justify-between gap-1.5 sm:gap-2"
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2 md:gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`flex shrink-0 items-center gap-1 rounded-md border-2 border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-bold text-slate-200 transition-colors sm:gap-1.5 sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-xs md:rounded-xl md:px-3 md:py-2 md:text-sm ${heroTheme.headerBackHover}`}
          >
            <ChevronLeft size={14} className="sm:h-4 sm:w-4 md:h-[18px] md:w-[18px]" />
            返回
          </button>
          <div
            className={`shrink-0 rounded-lg border-2 border-slate-800 bg-slate-900 p-1 shadow-sm sm:rounded-xl sm:p-1.5 md:rounded-2xl md:p-2 ${heroTheme.headerMissionMarkWrap}`}
          >
            <MissionDirectiveEmblem className={heroTheme.headerMissionMark} size={26} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="mb-0 flex min-w-0 items-center gap-1 text-base font-black tracking-tight text-white sm:gap-1.5 sm:text-lg md:text-xl">
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
        className="grid w-full min-w-0 grid-cols-1 gap-1 sm:grid-cols-2 sm:items-stretch sm:gap-2"
      >
        <div className={progressCardClass}>
          <div className="flex w-full min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 md:gap-2.5">
            <div className="min-w-0 flex-1 px-0 sm:px-1 md:px-1.5">
              <div className="mb-0 flex min-w-0 flex-wrap items-baseline justify-between gap-x-1.5 gap-y-0 sm:mb-0.5">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-1 gap-y-0 sm:gap-x-1.5 md:gap-x-2">
                  <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.08em] text-slate-300 sm:text-xs md:text-sm">
                    火力
                  </span>
                  {firepowerFractionLabel != null ? (
                    <span className="max-w-[min(100%,14rem)] truncate text-[9px] font-bold tabular-nums text-slate-400 sm:max-w-none sm:text-[10px] md:text-xs">
                      {firepowerFractionLabel}
                    </span>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 text-base font-black tabular-nums sm:text-lg md:text-xl ${progressTheme.valueColor}`}
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
                <div className="hidden h-7 w-0.5 shrink-0 self-center bg-slate-800 sm:block" />
                <div className="shrink-0 px-0.5 text-center sm:min-w-[3.75rem] sm:px-1.5 md:min-w-[4rem] md:px-2">
                  <div className="mb-0 text-[8px] font-black uppercase tracking-[0.08em] text-slate-300 sm:text-[9px] md:text-[10px]">
                    {countdownStarted ? '剩餘時間' : '任務時限'}
                  </div>
                  <div
                    className={`text-lg font-black tabular-nums sm:text-xl md:text-2xl ${
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
                    <div className="mt-0 text-[9px] font-bold text-slate-400 sm:text-[10px]">選定電碼後倒數</div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="mt-1 flex shrink-0 flex-wrap items-center justify-center gap-0.5 self-center sm:mt-0 sm:ml-auto sm:justify-end sm:gap-1 sm:self-auto">
            {showEarlySettleButton && onEarlySettle != null && projectedMedal != null && (
              <button
                type="button"
                onClick={onEarlySettle}
                className={`inline-flex items-center gap-0.5 rounded-lg border-2 px-2 py-1 text-[9px] font-black tracking-wide transition-all active:scale-95 ring-1 sm:rounded-xl sm:gap-1 sm:px-2.5 sm:py-1.5 sm:text-[10px] md:rounded-2xl md:px-3.5 md:py-2 md:text-xs ${MEDAL_TONE[projectedMedal].text} ${MEDAL_TONE[projectedMedal].ring} ${MEDAL_TONE[projectedMedal].glow} border-current bg-slate-900/70 hover:bg-slate-900`}
                title={`現在撤離可獲：${MEDAL_LABEL[projectedMedal]}級勳章`}
              >
                <Flag size={12} strokeWidth={2.5} className="sm:h-3.5 sm:w-3.5" />
                撤離
              </button>
            )}
            {showChapterEndButton && onChapterEnd != null && (
              <button
                type="button"
                onClick={onChapterEnd}
                className={`inline-flex items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-[10px] font-black text-white shadow-sm transition-all active:scale-95 sm:gap-1 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs md:rounded-2xl md:px-4 md:py-2.5 md:text-sm md:shadow-md ${heroTheme.headerNextLevel}`}
              >
                <Check size={14} strokeWidth={2.5} className="sm:h-4 sm:w-4 md:h-[18px] md:w-[18px]" />
                完結
              </button>
            )}
            {showNextLevelButton && onNextLevel != null && (
              <button
                type="button"
                onClick={onNextLevel}
                className={`inline-flex items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-[10px] font-black text-white shadow-sm transition-all active:scale-95 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs md:rounded-2xl md:px-4 md:py-2.5 md:text-sm md:shadow-md ${heroTheme.headerNextLevel}`}
              >
                下一關
                <ChevronRight size={14} strokeWidth={2.5} className="sm:h-4 sm:w-4 md:h-[18px] md:w-[18px]" />
              </button>
            )}
            <button
              type="button"
              onClick={onRestart}
              className="rounded-lg bg-slate-800 p-1.5 text-slate-300 transition-all hover:bg-slate-700 active:scale-95 sm:rounded-xl sm:p-2 md:rounded-2xl md:p-2.5"
              title="重新開始"
            >
              <RefreshCw size={16} className="sm:h-[18px] sm:w-[18px] md:h-5 md:w-5" />
            </button>
          </div>
        </div>

        {statusMessagePanel != null && (
          <div className="flex min-h-0 min-w-0 self-stretch">{statusMessagePanel}</div>
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
const BAR_FOOTER_TEXT = 'text-[10px] font-black tabular-nums leading-tight sm:text-xs md:text-sm';

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
        <div className="relative h-1.5 w-full sm:h-2">
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
                  className={`h-2.5 w-px rounded-full shadow-sm transition-colors sm:h-3 ${
                    passed ? tone.tickOn : tone.tickOff
                  } ${isActive && passed ? 'opacity-100 ring-1 ring-white/30' : ''}`}
                />
              </div>
            );
          })}
        </div>
        <div className="relative mt-0.5 min-h-[1.05rem] w-full sm:mt-1 sm:min-h-5 md:min-h-6">
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
