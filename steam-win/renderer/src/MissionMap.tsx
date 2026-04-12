import type { MutableRefObject } from 'react';
import { useLayoutEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Home, Lock, Map as MapIcon } from 'lucide-react';
import { LEVELS } from './gameLogic';
import { TerminalBackdrop } from './ui/TerminalBackdrop';
import { isLevelUnlocked, LEVEL_MAX } from './game/gameProgressStorage';
import { chapterCampaignTagline } from './game/levelStrategyGuideModel';
import { stageInChapter } from './game/chapterStage';
import missionChapterBlurbs from './missionMapChapterBlurbs.json';

/** 戰區列：整列可點，避免每關一大塊橘鈕 */
const LEVEL_ROW =
  'flex w-full flex-row items-center justify-between gap-2 rounded-2xl border-2 bg-[#0f141c]/95 px-3 py-2.5 sm:gap-3 sm:px-3.5 sm:py-3';

/** 作戰地圖固定 10 個章節槽位（第 1～10 章），每章一列 */
const CHAPTER_SLOT_COUNT = 10;

/** 章節列：整列可點，左文案、右僅箭頭提示 */
const CHAPTER_ROW =
  'group flex w-full flex-row items-stretch justify-between gap-3 rounded-2xl border-2 bg-[#0f141c]/95 py-3.5 pl-4 pr-3 text-left sm:gap-4 sm:py-4 sm:pl-6 sm:pr-4';

const CHAPTER_BLURBS = missionChapterBlurbs.byChapter as Record<string, string>;

function chapterSelectBlurb(chapter: number): string {
  return CHAPTER_BLURBS[String(chapter)]?.trim() ?? '';
}

function nextPlayableChapter(highestClearedLevel: number): number | undefined {
  const nextId = Math.min(LEVEL_MAX, Math.max(1, highestClearedLevel + 1));
  return LEVELS.find((l) => l.id === nextId)?.definition.chapter;
}

type Phase = 'pickChapter' | 'pickLevel';

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

  const activeLevels = useMemo(() => {
    if (openedChapter == null) return [];
    const pair = chapters.find(([c]) => c === openedChapter);
    return pair?.[1] ?? [];
  }, [chapters, openedChapter]);

  const openChapter = (chapter: number) => {
    setOpenedChapter(chapter);
    setPhase('pickLevel');
  };

  const backToChapters = () => {
    setPhase('pickChapter');
    setOpenedChapter(null);
  };

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
                  <h1 className="text-xl font-black md:text-2xl">章節選擇 · Chapter Selection</h1>
                </div>
              </motion.header>

              <p className="mb-6 text-sm text-slate-500">
                點選整列章節卡片進入該章戰區（每章 10 關）。戰鬥中仍可切換其他地圖。
              </p>

              <section aria-label="戰役章節">
                <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                  章節（共 {CHAPTER_SLOT_COUNT} 章）
                </h2>
                <ul className="flex flex-col gap-2.5 sm:gap-3">
                  {Array.from({ length: CHAPTER_SLOT_COUNT }, (_, i) => {
                    const chapter = i + 1;
                    const rows = chapters.find(([c]) => c === chapter)?.[1];
                    const tag = chapterCampaignTagline(chapter);
                    const titleLine = tag.trim();
                    const rowHeadline = titleLine || `第 ${chapter} 章`;
                    const blurb = chapterSelectBlurb(chapter);
                    const isHint = hintChapter === chapter;
                    const hasData = rows != null && rows.length > 0;
                    const openLabel = `開啟「${rowHeadline}」戰區清單`;

                    return (
                      <motion.li
                        key={chapter}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="w-full"
                      >
                        {hasData ? (
                          <button
                            type="button"
                            onClick={() => openChapter(chapter)}
                            aria-label={openLabel}
                            title={openLabel}
                            className={`${CHAPTER_ROW} cursor-pointer border-[#1e293b] shadow-[0_8px_28px_rgba(0,0,0,0.28)] transition-[border-color,background-color,transform,box-shadow] hover:border-[#F59E0B]/70 hover:bg-[#141a24] hover:shadow-[0_12px_36px_rgba(245,158,11,0.12)] active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]/75 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0d12]`}
                          >
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5 pr-1">
                              <span
                                className="truncate text-base font-black tracking-tight text-white sm:text-lg"
                                title={rowHeadline}
                              >
                                {rowHeadline}
                              </span>
                              <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">
                                {blurb || `第 ${chapter} 章戰役，共 ${rows.length} 道關卡。`}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 sm:text-xs">
                                <span className="font-medium text-[#F59E0B]/90">點此列進入</span>
                                <span className="text-slate-600">·</span>
                                <span>第 {chapter} 章</span>
                                {isHint ? (
                                  <span className="rounded border border-[#F59E0B]/45 bg-[#F59E0B]/12 px-1.5 py-0.5 text-[10px] font-bold text-[#F59E0B]">
                                    進行中
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-center justify-center border-l border-[#1e293b]/80 pl-2 sm:pl-3">
                              <ChevronRight
                                className="text-slate-600 transition-colors group-hover:text-[#F59E0B] group-focus-visible:text-[#F59E0B]"
                                size={22}
                                strokeWidth={2.25}
                                aria-hidden
                              />
                            </div>
                          </button>
                        ) : (
                          <div
                            className={`${CHAPTER_ROW} cursor-not-allowed border-dashed border-slate-700 opacity-55`}
                            aria-disabled
                          >
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                              <span
                                className="truncate text-base font-black text-slate-500 sm:text-lg"
                                title={rowHeadline}
                              >
                                {rowHeadline}
                              </span>
                              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                                {blurb || '本章資料尚未接上。'}
                              </p>
                              <div className="text-[11px] text-slate-600 sm:text-xs">第 {chapter} 章 · 尚無戰區資料</div>
                            </div>
                          </div>
                        )}
                      </motion.li>
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
            >
              <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={backToChapters}
                    className="flex items-center gap-2 rounded-xl border-2 border-[#F59E0B]/50 bg-[#F59E0B]/10 px-3 py-2 text-sm font-bold text-[#F59E0B] hover:bg-[#F59E0B]/20"
                  >
                    <ChevronLeft size={18} />
                    返回章節
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
                      第 {openedChapter} 章
                    </span>
                  </div>
                  <h1 className="mt-1 text-2xl font-black text-white md:text-3xl">
                    {chapterTitle || '戰區清單'}
                  </h1>
                </div>
              </header>

              {/* 每章 10 關：3+3+3+1；第 10 關大關橫幅＝上方三格同列總寬 */}
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {activeLevels.map((row, i) => {
                  const lv = LEVELS[row.idx]!;
                  const mapTheme = lv.definition.mapTheme?.trim();
                  const unlocked = isLevelUnlocked(lv.id, highestClearedLevel);
                  const tenSlotFinal = activeLevels.length === 10 && i === 9;
                  const stage = stageInChapter(lv.id, openedChapter ?? lv.definition.chapter);
                  return (
                    <motion.li
                      key={lv.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={tenSlotFinal ? 'sm:col-span-3' : ''}
                    >
                      {unlocked ? (
                        <button
                          type="button"
                          onClick={() => onStart(row.idx)}
                          aria-label={`出擊第 ${stage} 關`}
                          title={`出擊第 ${stage} 關`}
                          className={`${LEVEL_ROW} group border-[#1e293b] text-left shadow-[0_6px_20px_rgba(0,0,0,0.22)] transition-[border-color,background-color,transform,box-shadow] hover:border-[#F59E0B]/55 hover:bg-[#141a24] hover:shadow-[0_8px_28px_rgba(245,158,11,0.06)] active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0d12] ${tenSlotFinal ? 'w-full ring-1 ring-inset ring-[#F59E0B]/35' : ''
                            }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-base font-black leading-tight text-white sm:text-lg">
                              第 {stage} 關
                            </div>
                            {mapTheme ? (
                              <div className="mt-0.5 text-[11px] leading-snug text-slate-300 sm:text-xs">{mapTheme}</div>
                            ) : null}
                            <div className="mt-0.5 text-[11px] leading-snug text-slate-500 sm:text-xs">
                              {lv.cells.length} 格可部署 · 寬{lv.width}×高{lv.height} 邊界
                            </div>
                            <div className="mt-1 text-[10px] font-bold text-[#F59E0B]/80 sm:text-[11px]">
                              點此列出擊
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-center justify-center border-l border-[#1e293b]/80 pl-2 sm:pl-3">
                            <ChevronRight
                              className="text-slate-600 transition-colors group-hover:text-[#F59E0B]"
                              size={20}
                              strokeWidth={2.25}
                              aria-hidden
                            />
                          </div>
                        </button>
                      ) : (
                        <div
                          className={`${LEVEL_ROW} cursor-not-allowed border-dashed border-slate-700 text-left opacity-55 ${tenSlotFinal ? 'w-full' : ''
                            }`}
                          aria-disabled
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-base font-black leading-tight text-slate-500 sm:text-lg">
                              第 {stage} 關
                            </div>
                            {mapTheme ? (
                              <div className="mt-0.5 text-[11px] leading-snug text-slate-500 sm:text-xs">{mapTheme}</div>
                            ) : null}
                            <div className="mt-0.5 text-[11px] leading-snug text-slate-600 sm:text-xs">
                              {lv.cells.length} 格可部署 · 寬{lv.width}×高{lv.height} 邊界
                            </div>
                            <div className="mt-1 text-[10px] font-bold text-slate-600 sm:text-[11px]">已鎖定</div>
                          </div>
                          <div className="flex shrink-0 items-center border-l border-slate-800 pl-2 sm:pl-3">
                            <Lock className="text-slate-600" size={18} aria-hidden />
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
