import type { MutableRefObject } from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, Home, Map as MapIcon } from 'lucide-react';
import { LEVELS, type Level } from './gameLogic';
import { TerminalBackdrop } from './ui/TerminalBackdrop';
import { isLevelUnlocked, LEVEL_MAX } from './game/gameProgressStorage';
import { chapterCampaignTagline } from './game/levelStrategyGuideModel';
import { stageInChapter } from './game/chapterStage';
import missionChapterBlurbs from './missionMapChapterBlurbs.json';
import { BriefingFolderCard, BriefingFolderLocked } from './BriefingFolderCard';
import { MissionChapterHexNode } from './MissionChapterHexNode';
import { MissionChapterTacticalBackdrop } from './MissionChapterTacticalBackdrop';
import { MissionLevelTacticalDockedBrief } from './MissionLevelTacticalDockedBrief';
import {
  missionTacticalBriefingPaletteFromDefinition,
  resolveMissionTacticalNodePositionPct,
} from './missionTacticalBriefingMapResolve';

/** 作戰地圖固定 10 個章節槽位（第 1～10 章），每章一列 */
const CHAPTER_SLOT_COUNT = 10;

/** 「卷宗拉開」過場時間（與 BriefingFolderCard 的視覺強調節拍對齊） */
const FOLDER_OPEN_TRANSITION_MS = 220;

const CHAPTER_BLURBS = missionChapterBlurbs.byChapter as Record<string, string>;

function chapterSelectBlurb(chapter: number): string {
  return CHAPTER_BLURBS[String(chapter)]?.trim() ?? '';
}

function nextPlayableChapter(highestClearedLevel: number): number | undefined {
  const nextId = Math.min(LEVEL_MAX, Math.max(1, highestClearedLevel + 1));
  return LEVELS.find((l) => l.id === nextId)?.definition.chapter;
}

type Phase = 'pickChapter' | 'pickLevel';

type LevelProgressTone = 'new' | 'inProgress' | 'cleared';

function levelCtaText(tone: LevelProgressTone): string {
  if (tone === 'cleared') return '進入戰場';
  if (tone === 'inProgress') return '接續任務';
  return '接受任務';
}

/** 戰情簡報標題：僅戰場主題（無 mapTheme 時退回關卡名／關卡編號） */
function missionBriefDockHeading(level: Level): string {
  const theme = level.definition.mapTheme?.trim();
  if (theme) return theme;
  const n = level.name?.trim();
  if (n) return n;
  return `關卡 ${level.id}`;
}

export default function MissionMap({
  onBack,
  onStart,
  highestClearedLevel,
  scrollRestoreYRef,
  initialOpenChapter = null,
}: {
  onBack: () => void;
  onStart: (levelIndex: number) => void;
  highestClearedLevel: number;
  scrollRestoreYRef: MutableRefObject<number>;
  /** 非 null 時一進作戰地圖即顯示該章關卡列表（例如從對局返回） */
  initialOpenChapter?: number | null;
}) {
  const chapters = useMemo(() => {
    const byChapter = new Map<number, { idx: number; levelId: number }[]>();
    for (let idx = 0; idx < LEVELS.length; idx += 1) {
      const lv = LEVELS[idx];
      const ch = lv.definition.chapter;
      if (!Number.isFinite(ch)) continue;
      const list = byChapter.get(ch) ?? [];
      list.push({ idx, levelId: lv.id });
      byChapter.set(ch, list);
    }
    for (const list of byChapter.values()) {
      list.sort((a, b) => a.levelId - b.levelId);
    }
    return [...byChapter.entries()].sort((a, b) => a[0] - b[0]);
  }, []);

  const hintChapter = useMemo(() => nextPlayableChapter(highestClearedLevel), [highestClearedLevel]);

  const resolvedInitialChapter = useMemo(() => {
    if (initialOpenChapter == null || !Number.isFinite(initialOpenChapter)) return null;
    return chapters.some(([c]) => c === initialOpenChapter) ? initialOpenChapter : null;
  }, [chapters, initialOpenChapter]);

  const [phase, setPhase] = useState<Phase>(() =>
    resolvedInitialChapter != null ? 'pickLevel' : 'pickChapter'
  );
  const [openedChapter, setOpenedChapter] = useState<number | null>(() => resolvedInitialChapter);
  /** 卷宗拉開過場：顯示卡片視覺反饋的 chapter；切到 pickLevel 後自動清空 */
  const [pendingChapter, setPendingChapter] = useState<number | null>(null);
  const pendingTimerRef = useRef<number | null>(null);
  /** 點選六角後於地圖下方顯示戰情摘要 */
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);

  const activeLevels = useMemo(() => {
    if (openedChapter == null) return [];
    const pair = chapters.find(([c]) => c === openedChapter);
    return pair?.[1] ?? [];
  }, [chapters, openedChapter]);

  /** 底圖色票／地形相位：以選中關為主，否則章內下一個可玩關 */
  const backdropVisualLevelId = useMemo(() => {
    if (openedChapter == null) return 1;
    if (selectedLevelId != null) return selectedLevelId;
    const nextId = Math.min(LEVEL_MAX, Math.max(1, highestClearedLevel + 1));
    const nextInChapter = activeLevels.find((r) => r.levelId === nextId);
    if (nextInChapter && isLevelUnlocked(nextId, highestClearedLevel)) return nextId;
    const unlocked = activeLevels.find((r) => isLevelUnlocked(r.levelId, highestClearedLevel));
    return unlocked?.levelId ?? activeLevels[0]?.levelId ?? nextId;
  }, [openedChapter, selectedLevelId, activeLevels, highestClearedLevel]);

  const tacticalBackdrop = useMemo(() => {
    if (openedChapter == null || activeLevels.length === 0) {
      return {
        routePoints: [] as Array<{ x: number; y: number }>,
        palette: missionTacticalBriefingPaletteFromDefinition(1, LEVELS[0]!.definition),
        visualSeed: 1,
      };
    }
    const routePoints = activeLevels.map((row) => {
      const lv = LEVELS[row.idx]!;
      const stage = stageInChapter(lv.id, openedChapter);
      return resolveMissionTacticalNodePositionPct({
        chapter: openedChapter,
        stage,
        levelId: lv.id,
        override: lv.definition.missionTacticalBriefingMap?.nodePositionPct,
      });
    });
    const focalLv = LEVELS.find((l) => l.id === backdropVisualLevelId) ?? LEVELS[activeLevels[0]!.idx]!;
    const palette = missionTacticalBriefingPaletteFromDefinition(focalLv.id, focalLv.definition);
    return { routePoints, palette, visualSeed: backdropVisualLevelId };
  }, [openedChapter, activeLevels, backdropVisualLevelId]);

  const requestOpenChapter = (chapter: number) => {
    if (pendingChapter != null) return;
    setPendingChapter(chapter);
    if (pendingTimerRef.current != null) window.clearTimeout(pendingTimerRef.current);
    pendingTimerRef.current = window.setTimeout(() => {
      setOpenedChapter(chapter);
      setPhase('pickLevel');
      setPendingChapter(null);
      pendingTimerRef.current = null;
    }, FOLDER_OPEN_TRANSITION_MS);
  };

  const backToChapters = () => {
    if (pendingTimerRef.current != null) {
      window.clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    setPendingChapter(null);
    setSelectedLevelId(null);
    setPhase('pickChapter');
    setOpenedChapter(null);
  };

  useEffect(() => {
    setSelectedLevelId(null);
  }, [openedChapter]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedLevelId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useLayoutEffect(() => {
    if (phase === 'pickLevel') {
      window.scrollTo(0, 0);
      requestAnimationFrame(() => window.scrollTo(0, 0));
      return;
    }
    const y = scrollRestoreYRef.current;
    window.scrollTo(0, y);
    requestAnimationFrame(() => window.scrollTo(0, y));
  }, [phase, scrollRestoreYRef]);

  const chapterTitle = openedChapter != null ? chapterCampaignTagline(openedChapter) : '';

  const dockedBriefProps = useMemo(() => {
    if (selectedLevelId == null || openedChapter == null) return null;
    const row = activeLevels.find((r) => r.levelId === selectedLevelId);
    if (!row) return null;
    const lv = LEVELS[row.idx]!;
    const chapter = openedChapter;
    const stage = stageInChapter(lv.id, chapter);
    const unlocked = isLevelUnlocked(lv.id, highestClearedLevel);
    const cleared = lv.id <= highestClearedLevel;
    const inProgress =
      !cleared &&
      hintChapter === chapter &&
      lv.id === Math.min(LEVEL_MAX, highestClearedLevel + 1);
    const tone: LevelProgressTone = cleared ? 'cleared' : inProgress ? 'inProgress' : 'new';
    return {
      chapterView: chapter,
      level: lv,
      stage,
      unlocked,
      cleared,
      inProgress,
      isBossStage: stage === 10,
      cta: levelCtaText(tone),
      heading: missionBriefDockHeading(lv),
      onStart: () => onStart(row.idx),
    };
  }, [selectedLevelId, openedChapter, activeLevels, highestClearedLevel, hintChapter, onStart]);

  return (
    <TerminalBackdrop className="font-mono text-slate-200 selection:bg-[#F59E0B]/30">
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8">
        <AnimatePresence mode="wait">
          {phase === 'pickChapter' ? (
            <motion.div
              key="chapters"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <motion.header
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex flex-wrap items-center gap-4"
              >
                <button
                  type="button"
                  onClick={onBack}
                  className="flex items-center gap-2 rounded-xl border-2 border-[#1e293b] bg-[#0f141c] px-3 py-2 text-sm font-bold text-slate-200 hover:border-[#F59E0B]/50 hover:text-[#F59E0B]"
                >
                  <ChevronLeft size={18} />
                  返回首頁
                </button>
                <div className="flex items-center gap-2 text-white">
                  <MapIcon className="text-[#F59E0B]" size={24} />
                  <h1 className="text-xl font-black md:text-2xl">行動卷宗 · Mission Briefing</h1>
                </div>
              </motion.header>

              <p className="mb-6 text-sm text-slate-400">
                點選一份卷宗即可展開該章戰區（每章 10 關）。對局途中仍可切換其他卷宗。
              </p>

              <section aria-label="行動卷宗">
                <h2 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500">
                  ACTIVE FOLDERS · 共 {CHAPTER_SLOT_COUNT} 份
                </h2>
                <ul className="flex flex-col gap-2.5 sm:gap-3">
                  {Array.from({ length: CHAPTER_SLOT_COUNT }, (_, i) => {
                    const chapter = i + 1;
                    const rows = chapters.find(([c]) => c === chapter)?.[1];
                    const tag = chapterCampaignTagline(chapter);
                    const titleLine = tag.trim();
                    const rowHeadline = titleLine || `第 ${chapter} 章`;
                    const blurb =
                      chapterSelectBlurb(chapter) ||
                      (rows && rows.length > 0
                        ? `第 ${chapter} 章戰役，共 ${rows.length} 道關卡。`
                        : '本章資料尚未接上。');
                    const isHint = hintChapter === chapter;
                    const hasData = rows != null && rows.length > 0;

                    if (!hasData) {
                      return (
                        <BriefingFolderLocked
                          key={chapter}
                          chapter={chapter}
                          headline={rowHeadline}
                          blurb={blurb}
                          delaySec={i * 0.04}
                        />
                      );
                    }

                    return (
                      <BriefingFolderCard
                        key={chapter}
                        chapter={chapter}
                        headline={rowHeadline}
                        blurb={blurb}
                        rowsCount={rows.length}
                        isHint={isHint}
                        pending={pendingChapter === chapter}
                        delaySec={i * 0.04}
                        onClick={() => requestOpenChapter(chapter)}
                      />
                    );
                  })}
                </ul>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="levels"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="relative flex flex-col"
            >
              <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={backToChapters}
                    className="flex items-center gap-2 rounded-xl border-2 border-[#F59E0B]/50 bg-[#F59E0B]/10 px-3 py-2 text-sm font-bold text-[#F59E0B] hover:bg-[#F59E0B]/20"
                  >
                    <ChevronLeft size={18} />
                    返回卷宗
                  </button>
                  <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-2 rounded-xl border-2 border-[#1e293b] bg-[#0f141c] px-3 py-2 text-sm font-bold text-slate-400 hover:border-slate-600 hover:text-slate-200"
                  >
                    <Home size={18} />
                    首頁
                  </button>
                </div>
                <div className="min-w-0 sm:text-right">
                  <div className="flex items-center gap-2 text-[#F59E0B] sm:justify-end">
                    <MapIcon size={22} />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      第 {openedChapter} 章 · 戰區佈防
                    </span>
                  </div>
                  <h1 className="mt-1 text-2xl font-black text-white md:text-3xl">
                    {chapterTitle || '戰區清單'}
                  </h1>
                </div>
              </header>

              <p className="relative z-10 mb-2 text-center text-[11px] font-bold uppercase tracking-widest text-slate-500 sm:text-xs">
                戰術地圖 · 點六角檢視戰情
              </p>

              {openedChapter != null ? (
                <div className="relative z-10 mt-1 w-full">
                  <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-[#1e293b] bg-[#05070c] shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]">
                    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-2xl">
                      <MissionChapterTacticalBackdrop
                        chapter={openedChapter}
                        routePoints={tacticalBackdrop.routePoints}
                        palette={tacticalBackdrop.palette}
                        visualSeed={tacticalBackdrop.visualSeed}
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-b from-[#0a0d12]/75 via-transparent to-[#0a0d12]/88"
                        aria-hidden
                      />
                    </div>
                    <div className="relative z-10 aspect-[10/7] min-h-[280px] w-full sm:aspect-[16/9] sm:min-h-[340px]">
                      {activeLevels.map((row) => {
                        const lv = LEVELS[row.idx]!;
                        const chapter = openedChapter;
                        const stage = stageInChapter(lv.id, chapter);
                        const pos = resolveMissionTacticalNodePositionPct({
                          chapter,
                          stage,
                          levelId: lv.id,
                          override: lv.definition.missionTacticalBriefingMap?.nodePositionPct,
                        });
                        const unlocked = isLevelUnlocked(lv.id, highestClearedLevel);
                        const cleared = lv.id <= highestClearedLevel;
                        const inProgress =
                          !cleared &&
                          hintChapter === chapter &&
                          lv.id === Math.min(LEVEL_MAX, highestClearedLevel + 1);
                        return (
                          <MissionChapterHexNode
                            key={lv.id}
                            stage={stage}
                            xPct={pos.x}
                            yPct={pos.y}
                            selected={selectedLevelId === lv.id}
                            cleared={cleared}
                            inProgress={inProgress}
                            locked={!unlocked}
                            isBoss={stage === 10}
                            onSelect={() =>
                              setSelectedLevelId((cur) => (cur === lv.id ? null : lv.id))
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              <AnimatePresence>
                {dockedBriefProps ? (
                  <MissionLevelTacticalDockedBrief
                    key={dockedBriefProps.level.id}
                    {...dockedBriefProps}
                    onClose={() => setSelectedLevelId(null)}
                  />
                ) : null}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TerminalBackdrop>
  );
}
