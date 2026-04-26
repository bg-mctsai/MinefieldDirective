import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Award, ChevronRight, Flag, X } from 'lucide-react';
import { HEROES, resolveMissionBriefCarouselLines } from './heroes';
import { TeletypeInline } from './teletype';
import { MissionLevelCommsBlock } from './MissionLevelCommsBlock';
import { HeroPortraitZoomButton } from './home/HeroPortraitZoomButton';
import { missionEnemyIntelAbbrev, missionEnemySituationLine } from './missionMapLevelBrief';
import { resolveMedalThresholds, type Medal } from './game/medalThresholds';
import { getBestMedal } from './game/gameProgressStorage';
import type { Level } from './gameLogic';

const MEDAL_DOT_TONE: Record<Medal, string> = {
  bronze: 'text-amber-700',
  silver: 'text-slate-200',
  gold: 'text-yellow-300',
};
const MEDAL_LABEL_SHORT: Record<Medal, string> = { bronze: '銅', silver: '銀', gold: '金' };

/** 戰術地圖下方通訊固定由艾達擔當（冷靜解析、遠端資料側翼） */
const COMMS_HERO_ID = 'ada';
const BRIEF_LINE_ROTATE_MS = 4200;
const LOCKED_COMMS_LINES = ['頻道鎖死。先把前一線清完，我再把訊號打回來。'];

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

/** 由 level.id 與 chapter 產生穩定的 LOC 座標（純視覺用，不會改變存檔） */
function tacticalLocCoord(levelId: number, chapter: number, stage: number): string {
  const a = ((levelId * 7919 + chapter * 41) >>> 0) % 9000 + 1000;
  const b = ((stage * 6151 + levelId * 131) >>> 0) % 9000 + 1000;
  return `${a}/${b}`;
}

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
  const medalThresholds = useMemo(() => resolveMedalThresholds(def), [def]);
  const bronzePct = Math.round(medalThresholds.bronze * 1000) / 10;
  const silverPct = Math.round(medalThresholds.silver * 1000) / 10;
  const goldPct = Math.round(medalThresholds.gold * 1000) / 10;
  const bestMedal: Medal | null = useMemo(
    () => (cleared ? getBestMedal(level.id) : null),
    [cleared, level.id],
  );
  const enemyFull = useMemo(() => missionEnemySituationLine(def), [def]);
  const enemyAbbrev = useMemo(() => missionEnemyIntelAbbrev(def), [def]);
  const locCoord = useMemo(
    () => tacticalLocCoord(level.id, chapterView, stage),
    [level.id, chapterView, stage],
  );

  const tipTime = useMemo(
    () => `作戰時限：須在 ${timeLimit} 秒內達成覆蓋等目標；逾時未完成即判定失敗。`,
    [timeLimit],
  );
  const tipCoverage = useMemo(
    () =>
      `三段勳章（覆蓋率）：銅 ${bronzePct}% ／ 銀 ${silverPct}% ／ 金 ${goldPct}%。達銅後可主動撤離領牌；達金自動結算；時間歸零一律失敗。`,
    [bronzePct, silverPct, goldPct],
  );
  const tipEnemy = enemyFull;

  const commsHero = HEROES.find((h) => h.id === COMMS_HERO_ID) ?? HEROES[0];
  const briefLines = useMemo(
    () =>
      unlocked ? resolveMissionBriefCarouselLines(COMMS_HERO_ID, level.id) : LOCKED_COMMS_LINES,
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
      className="relative z-10 w-full overflow-hidden rounded-md border border-emerald-500/35 bg-[#050a08]/96 p-2.5 shadow-[0_10px_36px_rgba(0,0,0,0.62),inset_0_0_0_1px_rgba(16,185,129,0.1)] backdrop-blur-md sm:p-3"
      role="region"
      aria-label="關卡戰術摘要"
    >
      {/* 頂部資訊條：BRIEFING + LOC DATA（技術資訊 · 小字淡色） */}
      <div className="relative flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300/85">
            BRIEFING
          </span>
          <span className="hidden text-[9px] font-mono uppercase tracking-[0.14em] text-emerald-400/35 sm:inline">
            LOC DATA · COORDINATES {locCoord}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-0.5 text-slate-500 hover:bg-white/5 hover:text-slate-200"
          aria-label="關閉摘要"
        >
          <X size={15} strokeWidth={2.25} />
        </button>
      </div>

      <div className="flex flex-col gap-2 pt-2">
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
              <span className="inline-flex items-center gap-1 rounded border border-emerald-500/55 bg-emerald-500/12 px-2 py-1 text-[10px] font-black text-emerald-300">
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
              className="mission-docked-cta-breathe inline-flex shrink-0 items-center gap-1 rounded border border-[#FF9F1C]/75 bg-[#FF9F1C]/14 px-3 py-1.5 text-xs font-black text-[#fdba74] transition-colors hover:bg-[#FF9F1C]/24 sm:text-[13px]"
            >
              <span>{cta}</span>
              <ChevronRight size={15} strokeWidth={2.5} aria-hidden />
            </button>
          ) : (
            <p className="shrink-0 text-[11px] font-bold text-slate-500">此戰區尚未解鎖</p>
          )}
        </div>

        {/* 戰場主題 + 技術資訊列：數值小字淡化（資訊分級） */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-x-4">
          <h2 className="min-w-0 pr-1 text-base font-black leading-snug text-emerald-100 sm:flex-1 sm:text-lg">
            {heading}
          </h2>
          <p className="flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 self-end text-[10px] font-mono font-medium tracking-tight text-emerald-300/50 sm:shrink-0 sm:text-[11px]">
            <span
              className="inline-flex cursor-help items-center gap-0.5 border-b border-dotted border-emerald-500/25 pb-px"
              title={tipTime}
            >
              <span aria-hidden>⏱</span>
              <span>{timeLimit}s</span>
            </span>
            <span className="text-emerald-500/25 select-none" aria-hidden>·</span>
            <span
              className="inline-flex cursor-help items-center gap-1 border-b border-dotted border-emerald-500/25 pb-px"
              title={tipCoverage}
            >
              <span className={MEDAL_DOT_TONE.bronze} aria-hidden>●</span>
              <span>{bronzePct}%</span>
              <span className={MEDAL_DOT_TONE.silver} aria-hidden>●</span>
              <span>{silverPct}%</span>
              <span className={MEDAL_DOT_TONE.gold} aria-hidden>●</span>
              <span>{goldPct}%</span>
            </span>
            {bestMedal && (
              <span
                className={`inline-flex items-center gap-0.5 rounded border border-current/40 px-1 ${MEDAL_DOT_TONE[bestMedal]}`}
                title={`本關最佳：${MEDAL_LABEL_SHORT[bestMedal]}級勳章`}
              >
                <Award size={10} strokeWidth={2.5} aria-hidden />
                <span>{MEDAL_LABEL_SHORT[bestMedal]}</span>
              </span>
            )}
            <span className="text-emerald-500/25 select-none" aria-hidden>·</span>
            <span
              className="inline-flex max-w-[12rem] min-w-0 cursor-help items-center gap-0.5 border-b border-dotted border-emerald-500/25 pb-px sm:max-w-none"
              title={tipEnemy}
            >
              <span aria-hidden>▲</span>
              <span className="truncate">{enemyAbbrev}</span>
            </span>
          </p>
        </div>

        {/* 劇情對話：頭像無背景框、直接顯示文字，頭像加 glitch */}
        <div className="flex items-start gap-2">
          <HeroPortraitZoomButton
            heroId={COMMS_HERO_ID}
            size={44}
            title={`放大檢視${commsHero.name}頭像`}
            aria-label={`放大檢視${commsHero.name}頭像`}
            className="relative shrink-0 overflow-hidden rounded-full cursor-zoom-in outline-none ring-offset-2 ring-offset-[#050a08] focus-visible:ring-2 focus-visible:ring-amber-500/80"
            style={{
              width: 44,
              height: 44,
              boxShadow: '0 0 0 1px rgba(16,185,129,0.32), 0 0 4px rgba(16,185,129,0.14)',
            }}
          />
          <span className="sr-only">{commsHero.name}</span>
          <p
            className="min-w-0 flex-1 pt-0.5 text-left text-[13px] leading-snug text-emerald-50/92 sm:text-sm"
            role="status"
            aria-live="polite"
            aria-label={`${commsHero.name} 戰術頻道`}
          >
            <TeletypeInline full={line} resetKey={teletypeKey} caretClassName="bg-[#FF9F1C]/80" />
          </p>
        </div>
      </div>
    </motion.div>
  );
}
