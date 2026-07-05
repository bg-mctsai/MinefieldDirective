import { type ReactNode, useMemo } from 'react';
import { motion } from 'motion/react';
import { Activity, Users } from 'lucide-react';
import { campaignHomeContinueLabels } from '../game/campaignLevelUi';
import { LEVELS } from '../gameLogic';
import { loadGameProgress, nextPlayableLevelKey } from '../game/gameProgressStorage';
import { useEffectiveUnlockedHeroIds } from '../game/heroUnlockedStorage';
import { HEROES } from '../heroes';
import type { HomeNavigateHandler } from './types';
import { ChapterMedalSummary } from './ChapterMedalSummary';

function pct(n: number) {
  return `${Math.round(Math.max(0, Math.min(1, n)) * 100)}%`;
}

function StatMedallion({
  children,
  tone,
}: {
  children: ReactNode;
  tone: 'emerald' | 'violet';
}) {
  const style =
    tone === 'emerald'
      ? {
          background: 'radial-gradient(circle at 34% 28%, #ccfbf1 0%, #34d399 35%, #047857 72%, #042f2e 100%)',
          ring: 'rgba(52,211,153,0.5)',
          glow: 'rgba(16,185,129,0.22)',
          text: 'text-emerald-950/80',
        }
      : {
          background: 'radial-gradient(circle at 34% 28%, #ede9fe 0%, #a78bfa 38%, #6d28d9 72%, #2e1065 100%)',
          ring: 'rgba(167,139,250,0.5)',
          glow: 'rgba(139,92,246,0.22)',
          text: 'text-violet-950/80',
        };

  return (
    <span
      className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.text}`}
      style={{
        background: style.background,
        boxShadow: `inset 0 1px 1.5px rgba(255,255,255,0.62), inset 0 -3px 5px rgba(0,0,0,0.5), 0 0 0 1px ${style.ring}, 0 0 16px ${style.glow}, 0 2px 5px rgba(0,0,0,0.55)`,
      }}
      aria-hidden
    >
      <span className="drop-shadow-[0_1px_0_rgba(255,255,255,0.2)]">{children}</span>
    </span>
  );
}

export function HomeOpsDashboard({ onNavigate }: { onNavigate: HomeNavigateHandler }) {
  const effectiveUnlockedIds = useEffectiveUnlockedHeroIds();
  const report = useMemo(() => {
    const progress = loadGameProgress();
    const cleared = new Set(progress.clearedLevelKeys);
    const total = LEVELS.length;
    const orderedKeys = LEVELS.map((l) => l.levelKey);
    const nextKey = nextPlayableLevelKey(progress.clearedLevelKeys, orderedKeys);
    const nextLevel = nextKey == null ? undefined : LEVELS.find((level) => level.levelKey === nextKey);
    const chapter = nextLevel?.definition.chapter ?? LEVELS.at(-1)?.definition.chapter ?? 1;
    const chapterLevels = LEVELS.filter((level) => level.definition.chapter === chapter);
    const chapterCleared = chapterLevels.filter((level) => cleared.has(level.levelKey)).length;
    const chapterTotal = Math.max(1, chapterLevels.length);
    const unlockedHeroCount = effectiveUnlockedIds.length;

    return {
      clearedCount: cleared.size,
      total,
      nextLevel,
      chapter,
      chapterCleared,
      chapterTotal,
      chapterProgress: chapterCleared / chapterTotal,
      unlockedHeroCount,
    };
  }, [effectiveUnlockedIds]);

  const nextLevel = report.nextLevel;
  const continueLabels = nextLevel ? campaignHomeContinueLabels(nextLevel) : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16, duration: 0.45 }}
      className="relative order-3 lg:order-none lg:col-span-5"
      aria-label="作戰狀態"
    >
      <div className="relative overflow-hidden rounded-3xl border-2 border-[#1e293b] bg-[#0d141d]/95 p-5 shadow-xl lg:min-h-0 xl:p-6">
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="absolute inset-x-0 top-6 h-px bg-emerald-400/50" />
          <div className="absolute bottom-0 left-1/2 h-44 w-44 -translate-x-1/2 translate-y-1/2 rounded-full bg-[#F59E0B]/20 blur-3xl" />
        </div>

        <button
          type="button"
          onClick={() => onNavigate('mission', { missionOpenChapter: report.chapter })}
          className="relative w-full rounded-2xl border border-[#243247] bg-[#080d13]/80 p-3.5 text-left transition-[border-color,background-color,box-shadow] hover:border-[#F59E0B]/45 hover:bg-[#0a1018]/95 hover:shadow-[0_0_24px_rgba(245,158,11,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/70"
          aria-label={`前往第 ${report.chapter} 章行動卷宗／作戰地圖`}
        >
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1 text-left">
              {nextLevel ? (
                <>
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">戰役接續</div>
                  <div className="mt-1 truncate text-2xl font-black text-white">{continueLabels!.heading}</div>
                  <div className="mt-0.5 text-base font-bold tabular-nums text-slate-200">關卡 {continueLabels!.stageLabel}</div>
                </>
              ) : (
                <>
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">戰役接續</div>
                  <div className="mt-1 text-2xl font-black text-white">全戰役完成</div>
                </>
              )}
            </div>
            <ChapterMedalSummary className="pt-0.5" />
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] via-emerald-400 to-cyan-300"
              style={{ width: pct(report.chapterProgress) }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-xs font-bold tracking-[0.06em] text-slate-300 sm:text-sm">
            <span>本章進度</span>
            <span>
              {report.chapterCleared}/{report.chapterTotal}
            </span>
          </div>
        </button>

        <div className="relative mt-3 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-700/45 bg-gradient-to-b from-slate-900/70 to-slate-950/70 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:gap-3 sm:p-3">
            <StatMedallion tone="emerald">
              <Activity size={24} strokeWidth={2.45} />
            </StatMedallion>
            <div className="min-w-0 flex-1 text-right">
              <div className="text-xl font-black tabular-nums text-white sm:text-2xl">
                {report.clearedCount}/{report.total}
              </div>
              <div className="text-xs font-bold tracking-[0.04em] text-slate-300 sm:text-sm">戰役完成</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-700/45 bg-gradient-to-b from-slate-900/70 to-slate-950/70 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:gap-3 sm:p-3">
            <StatMedallion tone="violet">
              <Users size={24} strokeWidth={2.45} />
            </StatMedallion>
            <div className="min-w-0 flex-1 text-right">
              <div className="text-xl font-black tabular-nums text-white sm:text-2xl">
                {report.unlockedHeroCount}/{HEROES.length}
              </div>
              <div className="text-xs font-bold tracking-[0.04em] text-slate-300 sm:text-sm">可用幹員</div>
            </div>
          </div>
        </div>

        {!nextLevel ? (
          <div className="relative mt-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-2.5 text-sm font-bold leading-relaxed text-emerald-200/80">
            主線戰役已完成，等待後續卷宗內容。
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}
