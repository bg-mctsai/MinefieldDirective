import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Activity, Radio, ShieldAlert, Target, Users } from 'lucide-react';
import { LEVELS } from '../gameLogic';
import { stageInChapter } from '../game/chapterStage';
import { loadGameProgress, LEVEL_MAX } from '../game/gameProgressStorage';
import { loadUnlockedHeroIds } from '../game/heroUnlockedStorage';
import { HEROES } from '../heroes';
import { ChapterMedalSummary } from './ChapterMedalSummary';

function pct(n: number) {
  return `${Math.round(Math.max(0, Math.min(1, n)) * 100)}%`;
}

function formatMissionCode(levelId: number, chapter: number) {
  return `CH-${String(chapter).padStart(2, '0')} · OP-${String(levelId).padStart(3, '0')}`;
}

function threatLabel(levelId: number) {
  if (levelId >= 91) return 'EXTREME';
  if (levelId >= 61) return 'HIGH';
  if (levelId >= 31) return 'ELEVATED';
  return 'CONTROLLED';
}

export function HomeOpsDashboard() {
  const report = useMemo(() => {
    const highestClearedLevel = loadGameProgress().highestClearedLevel;
    const total = Math.min(LEVEL_MAX, LEVELS.length);
    const campaignComplete = total > 0 && highestClearedLevel >= total;
    const nextLevelId = campaignComplete ? total : Math.min(total, highestClearedLevel + 1);
    const nextLevel = campaignComplete ? undefined : (LEVELS.find((level) => level.id === nextLevelId) ?? LEVELS[0]);
    const chapter = nextLevel?.definition.chapter ?? LEVELS.at(-1)?.definition.chapter ?? 1;
    const chapterLevels = LEVELS.filter((level) => level.definition.chapter === chapter);
    const chapterCleared = chapterLevels.filter((level) => level.id <= highestClearedLevel).length;
    const chapterTotal = Math.max(1, chapterLevels.length);
    const unlockedHeroCount = loadUnlockedHeroIds().length;
    const stage = nextLevel ? stageInChapter(nextLevel.id, chapter) : 1;

    return {
      highestClearedLevel,
      total,
      nextLevel,
      nextLevelId,
      chapter,
      stage,
      chapterCleared,
      chapterTotal,
      chapterProgress: chapterCleared / chapterTotal,
      campaignProgress: total > 0 ? highestClearedLevel / total : 0,
      unlockedHeroCount,
    };
  }, []);

  const nextLevel = report.nextLevel;
  const missionMeta = nextLevel
    ? `第 ${report.chapter} 章 · 第 ${report.stage} 戰 · ${threatLabel(report.nextLevelId)}`
    : '全戰役完成';

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16, duration: 0.45 }}
      className="relative lg:col-span-4"
      aria-label="作戰狀態"
    >
      <div className="relative overflow-hidden rounded-3xl border-2 border-[#1e293b] bg-[#0d141d]/95 p-5 shadow-xl lg:min-h-[21.5rem]">
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="absolute inset-x-0 top-8 h-px bg-emerald-400/50" />
          <div className="absolute bottom-0 left-1/2 h-44 w-44 -translate-x-1/2 translate-y-1/2 rounded-full bg-[#F59E0B]/20 blur-3xl" />
        </div>

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Campaign Status</div>
            <div className="mt-1 text-2xl font-black text-white">戰役接續</div>
          </div>
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-right">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300/70">SYNC</div>
            <div className="text-base font-black text-emerald-300">{pct(report.campaignProgress)}</div>
          </div>
        </div>

        <div className="relative mt-5 rounded-2xl border border-[#243247] bg-[#080d13]/80 p-4">
          <div className="flex items-start gap-3">
            <Target className="mt-1 shrink-0 text-[#F59E0B]" size={20} />
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-[#F59E0B]/80">
                {nextLevel ? formatMissionCode(nextLevel.id, report.chapter) : 'CH-00 / OP-000'}
              </div>
              <div className="mt-1 truncate text-xl font-black text-white">
                {nextLevel?.name ?? '全戰役完成'}
              </div>
              <div className="mt-1 text-sm font-bold text-slate-500">{missionMeta}</div>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] via-emerald-400 to-cyan-300"
              style={{ width: pct(report.chapterProgress) }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs font-bold tracking-[0.12em] text-slate-500">
            <span>本章進度</span>
            <span>
              {report.chapterCleared}/{report.chapterTotal}
            </span>
          </div>
        </div>

        <div className="relative mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-3">
            <Activity className="mb-2 text-emerald-300" size={16} />
            <div className="text-lg font-black text-white">
              {report.highestClearedLevel}/{report.total}
            </div>
            <div className="text-xs font-bold tracking-[0.1em] text-slate-500">戰役完成</div>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-3">
            <ShieldAlert className="mb-2 text-[#F59E0B]" size={16} />
            <div className="text-lg font-black text-white">{pct(nextLevel?.definition.coverageGoal ?? 0)}</div>
            <div className="text-xs font-bold tracking-[0.1em] text-slate-500">通關覆蓋</div>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-3">
            <Radio className="mb-2 text-cyan-300" size={16} />
            <div className="text-lg font-black text-white">{nextLevel?.definition.timeLimit ?? 0}s</div>
            <div className="text-xs font-bold tracking-[0.1em] text-slate-500">任務限時</div>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-3">
            <Users className="mb-2 text-violet-300" size={16} />
            <div className="text-lg font-black text-white">
              {report.unlockedHeroCount}/{HEROES.length}
            </div>
            <div className="text-xs font-bold tracking-[0.1em] text-slate-500">可用幹員</div>
          </div>
        </div>

        {!nextLevel ? (
          <div className="relative mt-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3 text-sm font-bold leading-relaxed text-emerald-200/80">
            主線戰役已完成，等待後續卷宗內容。
          </div>
        ) : null}

        <div className="relative mt-4">
          <ChapterMedalSummary />
        </div>
      </div>
    </motion.section>
  );
}
