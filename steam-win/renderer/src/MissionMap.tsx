import type { MutableRefObject } from 'react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Flag, Home, Lock, Map as MapIcon } from 'lucide-react';
import { LEVELS } from './gameLogic';
import { TerminalBackdrop } from './ui/TerminalBackdrop';
import { isLevelUnlocked, LEVEL_MAX } from './game/gameProgressStorage';
import { chapterCampaignTagline } from './game/levelStrategyGuideModel';
import { stageInChapter } from './game/chapterStage';
import missionChapterBlurbs from './missionMapChapterBlurbs.json';
import { BriefingFolderCard, BriefingFolderLocked } from './BriefingFolderCard';
import { ChapterTacticalMap } from './game/ChapterTacticalMap';
import { MissionOperativeStrip } from './MissionOperativeStrip';
import { getStoredHeroId } from './heroes';
import { MissionLevelCommsBlock, formatMissionChannelCode } from './MissionLevelCommsBlock';

/** 戰區關卡卡：直向堆疊，上列頻道／操作、下列標題全寬，避免與 CH 擠同一行 */
const LEVEL_ROW =
  'flex w-full flex-col items-stretch gap-2 rounded-2xl border-2 bg-[#0f141c]/95 px-3 py-2.5 sm:gap-2.5 sm:px-3.5 sm:py-3';

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
  if (tone === 'cleared') return '重返戰區';
  if (tone === 'inProgress') return '接續任務';
  return '接受任務';
}

function levelRowTitle(stage: number, mapTheme: string | undefined, levelId: number, chapter: number): string {
  const theme = mapTheme?.trim();
  const pad = String(stage).padStart(2, '0');
  const tag = `CH.${pad} ${formatMissionChannelCode(levelId, chapter, stage)}`;
  return theme ? `${tag}：${theme}` : tag;
}

/** 裝飾用座標（依關卡固定，無地理意義） */
function levelCardLocLine(levelId: number, chapter: number, stage: number): string {
  const seed = (levelId * 47 + chapter * 91 + stage * 23) >>> 0;
  const lat = 22.42 + (seed % 180) / 1000;
  const lng = 120.28 + ((seed >>> 8) % 350) / 1000;
  return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
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
  const [operativeId, setOperativeId] = useState(getStoredHeroId);
  const [previewLevelId, setPreviewLevelId] = useState<number | null>(null);

  const activeLevels = useMemo(() => {
    if (openedChapter == null) return [];
    const pair = chapters.find(([c]) => c === openedChapter);
    return pair?.[1] ?? [];
  }, [chapters, openedChapter]);

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
    setPreviewLevelId(null);
    setPhase('pickChapter');
    setOpenedChapter(null);
  };

  useLayoutEffect(() => {
    if (phase === 'pickLevel') setOperativeId(getStoredHeroId());
  }, [phase, openedChapter]);

  const defaultPreviewLevelId = useMemo(() => {
    if (activeLevels.length === 0) return 1;
    const nextId = Math.min(LEVEL_MAX, Math.max(1, highestClearedLevel + 1));
    const nextRow = activeLevels.find((r) => r.levelId === nextId);
    if (nextRow && isLevelUnlocked(nextRow.levelId, highestClearedLevel)) return nextRow.levelId;
    const unlocked = activeLevels.find((r) => isLevelUnlocked(r.levelId, highestClearedLevel));
    return unlocked?.levelId ?? activeLevels[0]!.levelId;
  }, [activeLevels, highestClearedLevel]);

  const effectivePreviewLevelId = previewLevelId ?? defaultPreviewLevelId;

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

  /** 該章已過關的最高 stage（用於背景插旗） */
  const clearedStageMaxInChapter = useMemo(() => {
    if (openedChapter == null) return 0;
    let m = 0;
    for (const row of activeLevels) {
      if (row.levelId <= highestClearedLevel) {
        const s = stageInChapter(row.levelId, openedChapter);
        if (s > m) m = s;
      }
    }
    return m;
  }, [activeLevels, highestClearedLevel, openedChapter]);

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
              className="relative"
            >
              {/* 戰術佈防圖背景 */}
              {openedChapter != null && (
                <div
                  className="pointer-events-none absolute inset-x-0 top-24 -z-10 mx-auto h-[420px] max-w-2xl opacity-[0.16]"
                  aria-hidden
                >
                  <ChapterTacticalMap
                    chapter={openedChapter}
                    clearedStageMax={clearedStageMaxInChapter}
                    totalStages={activeLevels.length}
                  />
                </div>
              )}

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

              <div className="relative z-10 mb-5 w-full">
                <MissionOperativeStrip
                  operativeId={operativeId}
                  onOperativeChange={setOperativeId}
                  previewLevelId={effectivePreviewLevelId}
                />
              </div>

              {/* 每章 10 關：3+3+3+1；第 10 關大關橫幅＝上方三格同列總寬 */}
              <ul className="relative z-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {activeLevels.map((row, i) => {
                  const lv = LEVELS[row.idx]!;
                  const mapTheme = lv.definition.mapTheme?.trim();
                  const chapter = openedChapter ?? lv.definition.chapter;
                  const unlocked = isLevelUnlocked(lv.id, highestClearedLevel);
                  const tenSlotFinal = activeLevels.length === 10 && i === 9;
                  const stage = stageInChapter(lv.id, chapter);
                  const cleared = lv.id <= highestClearedLevel;
                  const inProgress = !cleared && hintChapter === chapter
                    && lv.id === Math.min(LEVEL_MAX, highestClearedLevel + 1);
                  const tone: LevelProgressTone = cleared ? 'cleared' : inProgress ? 'inProgress' : 'new';
                  const cta = levelCtaText(tone);

                  return (
                    <motion.li
                      key={lv.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={tenSlotFinal ? 'sm:col-span-3' : ''}
                      onMouseEnter={() => setPreviewLevelId(lv.id)}
                      onMouseLeave={() => setPreviewLevelId(null)}
                    >
                      {unlocked ? (
                        <button
                          type="button"
                          onClick={() => onStart(row.idx)}
                          aria-label={`${cta}：${levelRowTitle(stage, mapTheme, lv.id, chapter)}`}
                          title={`${cta}：${levelRowTitle(stage, mapTheme, lv.id, chapter)} · ${lv.cells.length} 格可部署 · 寬${lv.width}×高${lv.height}`}
                          className={`${LEVEL_ROW} group relative border-[#1e293b] pb-6 text-left shadow-[0_6px_20px_rgba(0,0,0,0.22)] transition-[border-color,background-color,transform,box-shadow] hover:border-[#F59E0B]/55 hover:bg-[#141a24] hover:shadow-[0_8px_28px_rgba(245,158,11,0.06)] active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0d12] ${tenSlotFinal ? 'w-full ring-1 ring-inset ring-[#F59E0B]/35' : ''}`}
                        >
                          <div className="flex w-full min-w-0 flex-row items-center justify-between gap-3 sm:gap-4">
                            <div className="-ml-1 flex shrink-0 items-center py-0.5 sm:-ml-1.5">
                              <MissionLevelCommsBlock
                                stage={stage}
                                levelId={lv.id}
                                chapter={chapter}
                                cleared={cleared}
                                isBossStage={stage === 10}
                                relaxed={tenSlotFinal}
                                inProgress={inProgress}
                              />
                            </div>
                            <div className="ml-1 flex shrink-0 flex-row items-center gap-1.5 border-l border-[#1e293b]/80 pl-2.5 sm:ml-2 sm:gap-2 sm:pl-3">
                              {cleared ? (
                                <span
                                  className="inline-flex items-center gap-1 rounded-md border border-emerald-500/55 bg-emerald-500/12 px-1.5 py-0.5 text-[10px] font-black text-emerald-400"
                                  title="已完成"
                                >
                                  <Flag size={10} strokeWidth={2.5} />
                                  已完成
                                </span>
                              ) : null}
                              <ChevronRight
                                className="text-slate-600 transition-colors group-hover:text-[#F59E0B]"
                                size={20}
                                strokeWidth={2.25}
                                aria-hidden
                              />
                            </div>
                          </div>
                          <div className="w-full min-w-0 border-t border-[#1e293b]/70 pt-1.5">
                            {mapTheme ? (
                              <div className="line-clamp-3 text-base font-black leading-snug text-white sm:text-lg">
                                {mapTheme}
                              </div>
                            ) : (
                              <div className="text-base font-bold leading-snug text-slate-500 sm:text-lg">—</div>
                            )}
                          </div>
                          <div
                            className="pointer-events-none absolute inset-x-2.5 bottom-2 flex items-end justify-between sm:inset-x-3.5"
                            aria-hidden
                          >
                            <div className="flex min-w-0 items-end gap-2">
                              <span className="mission-card-crop-lb" />
                              <span className="max-w-[calc(100%-2.5rem)] truncate font-mono text-[7.5px] font-medium tracking-wide text-slate-600/90 sm:text-[8px]">
                                LOC: {levelCardLocLine(lv.id, chapter, stage)}
                              </span>
                            </div>
                            <span className="mission-card-crop-br" />
                          </div>
                        </button>
                      ) : (
                        <div
                          className={`${LEVEL_ROW} relative cursor-not-allowed border-dashed border-slate-700 pb-6 text-left opacity-55 ${tenSlotFinal ? 'w-full' : ''}`}
                          aria-disabled
                          title={`${levelRowTitle(stage, mapTheme, lv.id, chapter)} · ${lv.cells.length} 格 · 寬${lv.width}×高${lv.height}`}
                        >
                          <div className="flex w-full min-w-0 flex-row items-center justify-between gap-3 opacity-80 sm:gap-4">
                            <div className="-ml-1 flex shrink-0 items-center py-0.5 sm:-ml-1.5">
                              <MissionLevelCommsBlock
                                stage={stage}
                                levelId={lv.id}
                                chapter={chapter}
                                cleared={false}
                                locked
                                isBossStage={stage === 10}
                                relaxed={tenSlotFinal}
                              />
                            </div>
                            <div className="ml-1 flex shrink-0 items-center border-l border-slate-800 pl-2.5 sm:ml-2 sm:pl-3">
                              <Lock className="text-slate-600" size={18} aria-hidden />
                            </div>
                          </div>
                          <div className="w-full min-w-0 border-t border-slate-800/90 pt-1.5">
                            {mapTheme ? (
                              <div className="line-clamp-3 text-base font-black leading-snug text-slate-500 sm:text-lg">{mapTheme}</div>
                            ) : (
                              <div className="text-base font-bold leading-snug text-slate-600 sm:text-lg">—</div>
                            )}
                          </div>
                          <div
                            className="pointer-events-none absolute inset-x-2.5 bottom-2 flex items-end justify-between sm:inset-x-3.5"
                            aria-hidden
                          >
                            <div className="flex min-w-0 items-end gap-2">
                              <span className="mission-card-crop-lb" />
                              <span className="max-w-[calc(100%-2.5rem)] truncate font-mono text-[7.5px] font-medium tracking-wide text-slate-600/70 sm:text-[8px]">
                                LOC: {levelCardLocLine(lv.id, chapter, stage)}
                              </span>
                            </div>
                            <span className="mission-card-crop-br" />
                          </div>
                        </div>
                      )}
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TerminalBackdrop>
  );
}
