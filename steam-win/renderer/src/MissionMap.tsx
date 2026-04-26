import type { MutableRefObject } from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, Home, Map as MapIcon } from 'lucide-react';
import { LEVELS, type Level } from './gameLogic';
import { TerminalBackdrop } from './ui/TerminalBackdrop';
import { getAllBestMedals, isLevelUnlocked, LEVEL_MAX } from './game/gameProgressStorage';
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
import { emit } from './audio/AudioEngine';
import { useBgmChannel } from './audio/useBgmChannel';

/** 作戰地圖固定 10 個章節槽位（第 1～10 章），每章一列 */
const CHAPTER_SLOT_COUNT = 10;

/** 「卷宗拉開」過場時間（與 BriefingFolderCard 的視覺強調節拍對齊） */
const FOLDER_OPEN_TRANSITION_MS = 220;
const ENTER_FEEDBACK_DELAY_MS = 100;

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

function chapterPrimaryObjective(chapter: number, chapterTitle: string): string {
  const canned: Record<number, string> = {
    1: '建立佈雷標準流程，完成基礎防區封鎖與節點控制。',
    2: '沿東向走廊擴張雷網，壓縮敵方機動空間。',
    3: '在鋸齒防線布設多層雷區，阻斷敵軍反撲路線。',
    4: '完成右翼包抄佈雷，建立前沿牽制與火力引導帶。',
    5: '鞏固中軸戰線，串接連續雷帶與後勤保護區。',
    6: '整合雙錨兵力，在匯合點構築縱深雷區。',
    7: '沿外擴路徑逐層佈雷，切斷敵方機動縫隙。',
    8: '穿越淺灘迂迴線，部署高風險地形的封鎖雷網。',
    9: '控制稜線制高點，完成壓制型雷區與觀測聯防。',
    10: '執行終局封鎖，佈設核心圈防線並確保戰區穩定。',
  };
  if (canned[chapter]) return canned[chapter]!;
  return `${chapterTitle || `第 ${chapter} 章`}：完成戰區佈雷部署與防線強化。`;
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
  useBgmChannel('mission');
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

  const bestMedalByLevel = useMemo(() => getAllBestMedals(), []);

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
  /** 雙擊進場前短閃回饋（僅 1 個節點） */
  const [confirmFlashLevelId, setConfirmFlashLevelId] = useState<number | null>(null);
  const enterStartTimerRef = useRef<number | null>(null);
  const confirmFlashClearTimerRef = useRef<number | null>(null);

  const activeLevels = useMemo(() => {
    if (openedChapter == null) return [];
    const pair = chapters.find(([c]) => c === openedChapter);
    return pair?.[1] ?? [];
  }, [chapters, openedChapter]);

  /** 底圖色票／地形相位：章內固定，不隨選中關卡跳動 */
  const chapterBackdropLevelId = useMemo(() => {
    if (openedChapter == null) return 1;
    return activeLevels[0]?.levelId ?? 1;
  }, [openedChapter, activeLevels]);

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
    const focalLv = LEVELS.find((l) => l.id === chapterBackdropLevelId) ?? LEVELS[activeLevels[0]!.idx]!;
    const palette = missionTacticalBriefingPaletteFromDefinition(focalLv.id, focalLv.definition);
    return { routePoints, palette, visualSeed: chapterBackdropLevelId };
  }, [openedChapter, activeLevels, chapterBackdropLevelId]);

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
    emit('ui.briefing.closeFolder');
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

  useEffect(
    () => () => {
      if (enterStartTimerRef.current != null) window.clearTimeout(enterStartTimerRef.current);
      if (confirmFlashClearTimerRef.current != null) {
        window.clearTimeout(confirmFlashClearTimerRef.current);
      }
    },
    []
  );

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
  const overallChapterBrief = useMemo(() => {
    if (openedChapter == null) return null;
    const objective = chapterPrimaryObjective(openedChapter, chapterTitle);
    return { objective };
  }, [openedChapter, chapterTitle]);

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

  const triggerEnterFeedbackAndStart = (levelIndex: number, levelId: number) => {
    if (enterStartTimerRef.current != null) return;
    setConfirmFlashLevelId(levelId);
    emit('ui.mission.enterConfirm');
    if (confirmFlashClearTimerRef.current != null) window.clearTimeout(confirmFlashClearTimerRef.current);
    confirmFlashClearTimerRef.current = window.setTimeout(() => {
      setConfirmFlashLevelId(null);
      confirmFlashClearTimerRef.current = null;
    }, ENTER_FEEDBACK_DELAY_MS + 70);
    enterStartTimerRef.current = window.setTimeout(() => {
      enterStartTimerRef.current = null;
      onStart(levelIndex);
    }, ENTER_FEEDBACK_DELAY_MS);
  };

  const startSelectedLevelFromMap = () => {
    if (selectedLevelId == null) return;
    const row = activeLevels.find((item) => item.levelId === selectedLevelId);
    if (!row) return;
    if (!isLevelUnlocked(row.levelId, highestClearedLevel)) return;
    triggerEnterFeedbackAndStart(row.idx, row.levelId);
  };

  return (
    <TerminalBackdrop className="font-mono text-slate-200 selection:bg-[#F59E0B]/30">
      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-4 py-3">
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
                    const chapterUnlocked =
                      hasData && rows.length > 0
                        ? isLevelUnlocked(rows[0]!.levelId, highestClearedLevel)
                        : false;

                    if (!hasData || !chapterUnlocked) {
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
              className="relative flex min-h-0 flex-1 flex-col"
            >
              <header className="mb-2 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={backToChapters}
                    className="flex items-center gap-1.5 rounded-lg border border-[#F59E0B]/50 bg-[#F59E0B]/10 px-2.5 py-1.5 text-xs font-bold text-[#F59E0B] hover:bg-[#F59E0B]/20"
                  >
                    <ChevronLeft size={16} />
                    返回卷宗
                  </button>
                  <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-1.5 rounded-lg border border-[#1e293b] bg-[#0f141c] px-2.5 py-1.5 text-xs font-bold text-slate-400 hover:border-slate-600 hover:text-slate-200"
                  >
                    <Home size={16} />
                    首頁
                  </button>
                </div>
                <div className="min-w-0 sm:text-right">
                  <div className="flex items-center gap-1.5 text-[#F59E0B] sm:justify-end">
                    <MapIcon size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      第 {openedChapter} 章 · 戰區佈防
                    </span>
                  </div>
                  <h1 className="text-lg font-black text-white md:text-xl">
                    {chapterTitle || '戰區清單'}
                  </h1>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-300/55">
                    戰術地圖 · 點六角檢視戰情
                  </p>
                </div>
              </header>

              {openedChapter != null ? (
                <div className="relative z-10 mt-1 flex min-h-0 w-full flex-1 flex-col">
                  <div className="relative mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden rounded-2xl border border-emerald-500/28 bg-[#040806] shadow-[0_0_0_1px_rgba(16,185,129,0.2),inset_0_0_80px_rgba(0,0,0,0.72)]">
                    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-2xl">
                      <MissionChapterTacticalBackdrop
                        chapter={openedChapter}
                        routePoints={tacticalBackdrop.routePoints}
                        palette={tacticalBackdrop.palette}
                        visualSeed={tacticalBackdrop.visualSeed}
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-b from-[#05100a]/76 via-transparent to-[#040907]/92"
                        aria-hidden
                      />
                    </div>
                    <div className="pointer-events-none absolute left-0 right-0 top-0 z-[11] flex items-start justify-between px-5 pt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300/70">
                      <span>STRATEGIC COMMAND MAP</span>
                      <span className="text-emerald-300/40">CH-{String(openedChapter).padStart(2, '0')}</span>
                    </div>
                    <div
                      className="relative z-10 min-h-[320px] w-full flex-1"
                      onDoubleClick={startSelectedLevelFromMap}
                    >
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
                        const inProgressVisual = inProgress && stage !== 1;
                        return (
                          <MissionChapterHexNode
                            key={lv.id}
                            stage={stage}
                            xPct={pos.x}
                            yPct={pos.y}
                            selected={selectedLevelId === lv.id}
                            cleared={cleared}
                            inProgress={inProgressVisual}
                            locked={!unlocked}
                            isBoss={stage === 10}
                            onSelect={() =>
                              setSelectedLevelId((cur) => {
                                const next = cur === lv.id ? null : lv.id;
                                if (next !== cur) emit('ui.select.change');
                                return next;
                              })
                            }
                            onDoubleClick={() => {
                              if (!unlocked) return;
                              setSelectedLevelId(lv.id);
                              triggerEnterFeedbackAndStart(row.idx, lv.id);
                            }}
                            confirmFlash={confirmFlashLevelId === lv.id}
                            bestMedal={bestMedalByLevel[lv.id] ?? null}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <div className="mx-auto mt-2 min-h-[164px] w-full max-w-3xl shrink-0">
                    <AnimatePresence mode="wait" initial={false}>
                      {dockedBriefProps ? (
                        <MissionLevelTacticalDockedBrief
                          key={dockedBriefProps.level.id}
                          {...dockedBriefProps}
                          onClose={() => setSelectedLevelId(null)}
                        />
                      ) : overallChapterBrief ? (
                        <motion.div
                          key="brief-placeholder"
                          initial={{ opacity: 0.2, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0.2, y: -4 }}
                          transition={{ duration: 0.16 }}
                          className="flex min-h-[164px] w-full items-center rounded-md border border-emerald-500/22 bg-[#050a08]/72 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.08)]"
                        >
                          <div className="w-full">
                            <p className="mt-1 text-lg font-black text-emerald-100 sm:text-xl">
                              總體戰術簡報
                            </p>
                            <p className="mt-2 text-sm font-black text-emerald-100/92 sm:text-base">
                              主要目標：{overallChapterBrief.objective}
                            </p>
                            <p className="mt-2 text-sm text-emerald-200/72">
                              點選任一六角節點即可檢視該關戰情與進場資訊。
                            </p>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TerminalBackdrop>
  );
}
