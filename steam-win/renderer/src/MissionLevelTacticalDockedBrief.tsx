import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Flag, X } from 'lucide-react';
import { HEROES, resolveMissionBriefCarouselLines } from './heroes';
import { TeletypeInline } from './teletype';
import { MissionLevelCommsBlock } from './MissionLevelCommsBlock';
import { HeroAvatarSilhouette } from './home/HeroAvatarSilhouette';
import { missionEnemyIntelAbbrev, missionEnemySituationLine } from './missionMapLevelBrief';
import type { Level } from './gameLogic';

const BOBBY_ID = 'bobby';
const BRIEF_LINE_ROTATE_MS = 4200;
const LOCKED_BOBBY_LINES = ['頻道鎖死。先把前一線清完，我再跟你對頻。'];

export type MissionLevelTacticalDockedBriefProps = {
  onClose: () => void;
  chapterView: number;
  level: Level;
  stage: number;
  unlocked: boolean;
  cleared: boolean;
  inProgress: boolean;
  isBossStage: boolean;
  cta: string;
  /** 僅戰場名／主題，不含 CH / 頻道前綴 */
  heading: string;
  onStart: () => void;
};

/** 戰術地圖下方：關卡戰情與波比通訊（不遮擋六角節點） */
export function MissionLevelTacticalDockedBrief({
  onClose,
  chapterView,
  level,
  stage,
  unlocked,
  cleared,
  inProgress,
  isBossStage,
  cta,
  heading,
  onStart,
}: MissionLevelTacticalDockedBriefProps) {
  const def = level.definition;
  const timeLimit = def.timeLimit;
  const coveragePct = Math.round(def.coverageGoal * 1000) / 10;
  const enemyFull = useMemo(() => missionEnemySituationLine(def), [def]);
  const enemyAbbrev = useMemo(() => missionEnemyIntelAbbrev(def), [def]);

  const tipTime = useMemo(
    () => `作戰時限：須在 ${timeLimit} 秒內達成覆蓋等目標；逾時未完成即判定失敗。`,
    [timeLimit],
  );
  const tipCoverage = useMemo(
    () => `覆蓋目標：可部署格之覆蓋率須達 ${coveragePct}% 以上。`,
    [coveragePct],
  );
  const tipEnemy = enemyFull;

  const bobby = HEROES.find((h) => h.id === BOBBY_ID) ?? HEROES[0];
  const briefLines = useMemo(
    () => (unlocked ? resolveMissionBriefCarouselLines(BOBBY_ID, level.id) : LOCKED_BOBBY_LINES),
    [unlocked, level.id],
  );
  const [lineIndex, setLineIndex] = useState(0);
  const line = briefLines[lineIndex % briefLines.length] ?? briefLines[0]!;
  const teletypeKey = `${level.id}-${unlocked}-${lineIndex}`;

  useEffect(() => {
    setLineIndex(0);
  }, [level.id, unlocked, briefLines]);

  useEffect(() => {
    if (!unlocked || briefLines.length <= 1) return;
    const id = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % briefLines.length);
    }, BRIEF_LINE_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [unlocked, briefLines]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      data-mission-docked-brief="1"
      className="relative z-10 mt-3 w-full overflow-hidden rounded-2xl border-2 border-emerald-500/25 bg-[#060910]/96 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md sm:p-3.5"
      role="region"
      aria-label="關卡戰術摘要"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 z-[1] rounded-lg p-1 text-slate-500 hover:bg-white/5 hover:text-slate-200"
        aria-label="關閉摘要"
      >
        <X size={18} strokeWidth={2.25} />
      </button>

      <div className="flex flex-col gap-2 pr-10">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <MissionLevelCommsBlock
              stage={stage}
              levelId={level.id}
              chapter={chapterView}
              cleared={cleared}
              locked={!unlocked}
              isBossStage={isBossStage}
              relaxed={isBossStage}
              inProgress={inProgress}
            />
            {cleared ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/55 bg-emerald-500/12 px-2 py-1 text-[10px] font-black text-emerald-400">
                <Flag size={11} strokeWidth={2.5} />
                已完成
              </span>
            ) : null}
          </div>
          {unlocked ? (
            <button
              type="button"
              onClick={() => {
                onStart();
                onClose();
              }}
              className="mission-docked-cta-breathe inline-flex shrink-0 items-center gap-1 rounded-lg border-2 border-[#F59E0B]/55 bg-[#F59E0B]/12 px-3 py-1.5 text-xs font-black text-[#F59E0B] transition-colors hover:bg-[#F59E0B]/22 sm:text-[13px]"
            >
              <span>{cta}</span>
              <ChevronRight size={15} strokeWidth={2.5} aria-hidden />
            </button>
          ) : (
            <p className="shrink-0 text-[11px] font-bold text-slate-500">此戰區尚未解鎖</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-x-4">
          <h2 className="min-w-0 pr-1 text-base font-black leading-snug text-white sm:flex-1 sm:text-lg">
            {heading}
          </h2>
          <p className="flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 self-end text-[11px] font-mono font-semibold tracking-tight text-slate-400 sm:shrink-0 sm:text-xs">
            <span
              className="inline-flex cursor-help items-center gap-0.5 border-b border-dotted border-slate-600/80 pb-px"
              title={tipTime}
            >
              <span aria-hidden>⏱️</span>
              <span>{timeLimit}s</span>
            </span>
            <span className="text-slate-600 select-none" aria-hidden>
              |
            </span>
            <span
              className="inline-flex cursor-help items-center gap-0.5 border-b border-dotted border-slate-600/80 pb-px"
              title={tipCoverage}
            >
              <span aria-hidden>🎯</span>
              <span>{coveragePct}%</span>
            </span>
            <span className="text-slate-600 select-none" aria-hidden>
              |
            </span>
            <span
              className="inline-flex max-w-[12rem] min-w-0 cursor-help items-center gap-0.5 border-b border-dotted border-slate-600/80 pb-px sm:max-w-none"
              title={tipEnemy}
            >
              <span aria-hidden>⚠️</span>
              <span className="truncate">{enemyAbbrev}</span>
            </span>
          </p>
        </div>

        <div className="flex gap-2 sm:gap-2.5">
          <div className="shrink-0 pt-0.5">
            <HeroAvatarSilhouette heroId={BOBBY_ID} size={36} />
            <span className="sr-only">{bobby.name}</span>
          </div>
          <div
            className="relative min-w-0 flex-1 rounded-2xl rounded-tl-md border border-slate-600/45 bg-[#111827]/88 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            role="status"
            aria-live="polite"
            aria-label={`${bobby.name} 戰術頻道`}
          >
            <span
              className="pointer-events-none absolute -left-1.5 top-2.5 h-2 w-2 rotate-45 border-b border-l border-slate-600/45 bg-[#111827]/88"
              aria-hidden
            />
            <p className="text-left text-[13px] leading-snug text-slate-200 sm:text-sm">
              <TeletypeInline full={line} resetKey={teletypeKey} caretClassName="bg-emerald-400/80" />
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
