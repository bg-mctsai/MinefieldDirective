import type { MutableRefObject } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Home, Map as MapIcon } from 'lucide-react';
import { LEVELS, type Level } from './gameLogic';
import { TerminalBackdrop } from './ui/TerminalBackdrop';
import { getAllBestMedals, isLevelUnlocked, nextPlayableLevelKey } from './game/gameProgressStorage';
import { chapterCampaignTagline } from './game/levelStrategyGuideModel';
import { LEVELS_PER_CHAPTER, stageInChapter } from './game/chapterStage';
import missionChapterBlurbs from './missionMapChapterBlurbs.json';
import { BriefingFolderCard } from './BriefingFolderCard';
import { MissionChapterHexNode } from './MissionChapterHexNode';
import { MissionChapterTacticalBackdrop } from './MissionChapterTacticalBackdrop';
import { MissionLevelBriefHeroComms } from './MissionLevelBriefHeroComms';
import { MissionLevelTacticalDockedBrief } from './MissionLevelTacticalDockedBrief';
import {
  missionTacticalBriefingPaletteFromDefinition,
  resolveMissionTacticalNodePositionPct,
} from './missionTacticalBriefingMapResolve';
import { emit } from './audio/AudioEngine';
import { useBgmChannel } from './audio/useBgmChannel';
import missionTacticalMapCornerLogo from './assets/mission-hex-badges/logo.png';

/** 作戰地圖固定 10 個章節槽位（第 1～10 章），每章一列 */
const CHAPTER_SLOT_COUNT = 10;

/** 「卷宗拉開」過場時間（與 BriefingFolderCard 的視覺強調節拍對齊） */
const FOLDER_OPEN_TRANSITION_MS = 220;
const ENTER_FEEDBACK_DELAY_MS = 100;

type ChapterBlurbEntry = string | string[];
const CHAPTER_BLURBS = missionChapterBlurbs.byChapter as Record<string, ChapterBlurbEntry>;
const MAP_PAN_LIMIT_X = 360;
const MAP_PAN_LIMIT_Y = 260;
/** 方向鍵／畫面箭頭單次平移量（px，與拖曳同一座標系） */
const MAP_ARROW_PAN_STEP_PX = 52;
/** 底圖尚未載入時，與可平移層 `inset-[-34%]` 一致（用於點選關卡時置中換算） */
const MAP_INSET_FRAC = 0.34;
const MAP_CONTENT_SCALE = 1 + MAP_INSET_FRAC * 2;

type TerrainCoverLayout = { wd: number; hd: number; k: number };

function clampMissionMapPan(x: number, y: number) {
  return {
    x: Math.max(-MAP_PAN_LIMIT_X, Math.min(MAP_PAN_LIMIT_X, x)),
    y: Math.max(-MAP_PAN_LIMIT_Y, Math.min(MAP_PAN_LIMIT_Y, y)),
  };
}

/**
 * 戰術「世界」相對可視區：等比套用原圖，且至少比可視區大這麼多倍（每軸取 k 再與鋪滿視窗的 k 取 max）。
 * 例：可視 100×100、MULT=2 → 世界至少約 2×vw／2×vh 對應的等比邊長。
 */
/** 戰術「世界」至少為可視區的幾倍（愈大＝圖層愈大、六角／地形愈放大、拖曳範圍愈長） */
const MAP_WORLD_VIEW_MULT = 2;

/** 戰術地圖可視區相對左欄 main 的內縮（不吃滿四邊）；改這裡即可調整留白 */
const MAP_VIEWPORT_FRAME_CLASS = 'p-2.5 sm:p-4 md:p-5';

/** 外框「邊槽」厚度（px）；內圈高光與地圖圓角需與此一致 */
const MAP_BEZEL_PAD_PX = 7;

/** 可視區 vw×vh 為「窗」，世界 wd×hd 為大地圖（≥ 視窗，等比原圖）；平移範圍由 clampPanCover 鎖邊 */
function missionMapCoverBox(vw: number, vh: number, natW: number, natH: number): TerrainCoverLayout {
  const kFill = Math.max(vw / natW, vh / natH);
  const kWide = Math.max((MAP_WORLD_VIEW_MULT * vw) / natW, (MAP_WORLD_VIEW_MULT * vh) / natH);
  const k = Math.max(kFill, kWide);
  let wd = Math.max(Math.ceil(k * natW), Math.ceil(vw));
  if (wd <= vw) wd = vw + 1;
  /** 與原圖同比例（避免 wd/hd 各自 ceil 後 object-cover 仍留空隙） */
  let hd = Math.max(Math.ceil((wd * natH) / natW), Math.ceil(vh));
  if (hd <= vh) hd = vh + 1;
  wd = Math.max(wd, Math.ceil((hd * natW) / natH));
  hd = Math.max(Math.ceil((wd * natH) / natW), Math.ceil(vh));
  return { wd, hd, k: wd / natW };
}

/** 視窗永遠被地圖「cover」填滿時，平移範圍＝整張已縮放地圖的可走區域 */
function clampPanCover(x: number, y: number, vw: number, vh: number, wd: number, hd: number) {
  const minX = vw - wd;
  const maxX = 0;
  const minY = vh - hd;
  const maxY = 0;
  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(minY, y)),
  };
}

/** 可視區像素：優先讀 ref（flex 晚結算時 state 會偏小 → hd 不足 → 底部／右側露黑） */
function viewportPxForMap(el: HTMLDivElement | null, stored: { w: number; h: number }): { vw: number; vh: number } {
  const cw = el ? Math.round(el.clientWidth) : 0;
  const ch = el ? Math.round(el.clientHeight) : 0;
  const vw = cw >= 8 ? cw : stored.w;
  const vh = ch >= 8 ? ch : stored.h;
  return { vw, vh };
}

/** 與 terrainCoverLayout 同一套：live 不足時用 mapViewportPx 補（重新整理首幀常為 0） */
function viewportPxResolved(el: HTMLDivElement | null, stored: { w: number; h: number }): { vw: number; vh: number } {
  let { vw, vh } = viewportPxForMap(el, stored);
  if (vw < 8 || vh < 8) {
    vw = Math.max(vw, stored.w);
    vh = Math.max(vh, stored.h);
  }
  return { vw, vh };
}

function normalizeChapterBlurb(value: ChapterBlurbEntry | undefined): string {
  if (value == null) return '';
  if (Array.isArray(value)) {
    return value
      .map((s) => String(s).trim())
      .filter(Boolean)
      .join('\n');
  }
  return String(value).trim();
}

function chapterSelectBlurb(chapter: number): string {
  return normalizeChapterBlurb(CHAPTER_BLURBS[String(chapter)]);
}

function nextPlayableChapter(clearedLevelKeys: string[]): number | undefined {
  const nextKey = nextPlayableLevelKey(clearedLevelKeys, LEVELS.map((l) => l.levelKey));
  return LEVELS.find((l) => l.levelKey === nextKey)?.definition.chapter;
}

/** 該章最後一關已通關（整章完成）→ 卷宗列表縮略顯示 */
function isChapterFullyCleared(rows: { levelKey: string }[], clearedLevelKeys: Set<string>): boolean {
  if (rows.length === 0) return false;
  return rows.every((r) => clearedLevelKeys.has(r.levelKey));
}

/**
 * 進入本章作戰地圖時預選關卡：優先主線「下一關」落在本章；否則本章首個未通關；已全通則本章最後一關。
 */
function initialProgressLevelIdInChapter(
  rows: { levelKey: string }[],
  clearedLevelKeys: Set<string>,
  orderedLevelKeys: string[],
): string | null {
  if (rows.length === 0) return null;
  const nextPlayable = nextPlayableLevelKey([...clearedLevelKeys], orderedLevelKeys);
  if (nextPlayable && rows.some((r) => r.levelKey === nextPlayable)) return nextPlayable;
  const firstUncleared = rows.find((r) => !clearedLevelKeys.has(r.levelKey));
  if (firstUncleared) return firstUncleared.levelKey;
  return rows[rows.length - 1]!.levelKey;
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

/** 章內戰術圖節點（%）：第 1～10 章依 `missionChapterNodePositions`／關卡 JSON `nodePositionPct` 覆寫。 */
function missionMapTacticalNodePct(chapter: number, stage: number, level: Level): { x: number; y: number } {
  const ch = Math.min(10, Math.max(1, Math.floor(chapter)));
  return resolveMissionTacticalNodePositionPct({
    chapter: ch,
    stage,
    levelId: level.id,
    override: level.definition.missionTacticalBriefingMap?.nodePositionPct,
  });
}

/** 地圖外框 HUD：假電文／格線座標（依章節穩定衍生，無即時時鐘避免額外 render） */
function missionMapHudTelemetry(chapter: number) {
  const sec = String(chapter).padStart(2, '0');
  const zuluH = (11 + chapter * 5) % 24;
  const zuluM = (chapter * 13 + 7) % 60;
  const latDeg = (22 + chapter * 4) % 40 + 8;
  const latMin = (chapter * 11) % 60;
  const lonDeg = (118 + chapter * 3) % 35 + 115;
  const lonMin = (chapter * 19) % 60;
  const hash = (chapter * 7919) % 900 + 100;
  const dataMm = (chapter * 3 + 7) % 60;
  const dataSs = (chapter * 11 + 19) % 60;
  const codeA = String((chapter * 173) % 10000).padStart(4, '0');
  const codeB = String((chapter * 89 + 41) % 10000).padStart(4, '0');
  const chk = ((chapter * 1103515245) >>> 0).toString(16).slice(-6).toUpperCase();
  const msgId = `MSG-${sec}-${String((chapter * 503) % 9000 + 1000).padStart(4, '0')}`;
  const emconTier = (['ALPHA', 'BRAVO', 'CHARLIE'] as const)[chapter % 3]!;
  return {
    pdSector: `PD-SEC-${sec}`,
    clockStub: `ZULU ${String(zuluH).padStart(2, '0')}:${String(zuluM).padStart(2, '0')}`,
    dataReadout: `DATA ${String(dataMm).padStart(2, '0')}:${String(dataSs).padStart(2, '0')}`,
    specLine: `SPEC ${latDeg}°${latMin}′N · ${lonDeg}°${lonMin}′E`,
    linkVhf: 'LINK-VHF-SECURE',
    channelPair: `CH-${sec} · ${codeA}/${codeB}`,
    sitrep: `SITREP-${sec}-${hash}`,
    emcon: `EMCON · ${emconTier}`,
    sigint: chapter % 2 === 0 ? 'SIGINT · STANDBY' : 'SIGINT · ACQUIRING',
    msgId,
    chainStub: `CHAIN CMD · MFD-OPS-${sec}`,
    checksum: `CHK ${chk}`,
  };
}

export default function MissionMap({
  onBack,
  onStart,
  clearedLevelKeys,
  scrollRestoreYRef,
  initialOpenChapter = null,
  devMissionChapterUnlockToggle,
}: {
  onBack: () => void;
  onStart: (levelIndex: number) => void;
  clearedLevelKeys: string[];
  scrollRestoreYRef: MutableRefObject<number>;
  /** 非 null 時一進作戰地圖即顯示該章關卡列表（例如從對局返回） */
  initialOpenChapter?: number | null;
  /** DEV：行動卷宗「開放全部章節 ↔ 還原鎖定」 */
  devMissionChapterUnlockToggle?: {
    unlockAllActive: boolean;
    onToggleUnlockAll: () => void;
  };
}) {
  useBgmChannel('mission');
  const chapters = useMemo(() => {
    const byChapter = new Map<number, { idx: number; levelId: number; levelKey: string; stage: number }[]>();
    for (let idx = 0; idx < LEVELS.length; idx += 1) {
      const lv = LEVELS[idx];
      const ch = lv.definition.chapter;
      if (!Number.isFinite(ch)) continue;
      const list = byChapter.get(ch) ?? [];
      list.push({ idx, levelId: lv.id, levelKey: lv.levelKey, stage: lv.stage });
      byChapter.set(ch, list);
    }
    for (const list of byChapter.values()) {
      list.sort((a, b) => a.stage - b.stage);
    }
    return [...byChapter.entries()].sort((a, b) => a[0] - b[0]);
  }, []);

  const bestMedalByLevel = useMemo(() => getAllBestMedals(), []);

  const clearedLevelKeySet = useMemo(() => new Set(clearedLevelKeys), [clearedLevelKeys]);
  const orderedLevelKeys = useMemo(() => LEVELS.map((l) => l.levelKey), []);
  const hintChapter = useMemo(() => nextPlayableChapter(clearedLevelKeys), [clearedLevelKeys]);

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
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  /** 雙擊進場前短閃回饋（僅 1 個節點） */
  const [confirmFlashLevelId, setConfirmFlashLevelId] = useState<number | null>(null);
  const enterStartTimerRef = useRef<number | null>(null);
  const confirmFlashClearTimerRef = useRef<number | null>(null);
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const [isMapDragging, setIsMapDragging] = useState(false);
  const mapDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const mapLayerRef = useRef<HTMLDivElement | null>(null);
  /** 拖曳中直接寫 DOM transform，避免每幀 setState 整頁重繪 */
  const mapPanLiveRef = useRef(mapPan);
  /** 上一筆有效的 cover 尺寸（避免 ref 首幀 0×0 / flex 延遲時 terrainCoverLayout 變 null → 地圖層無寬高 → 整區全黑） */
  const stableTerrainCoverRef = useRef<TerrainCoverLayout | null>(null);
  const terrainNaturalKeyRef = useRef<string>('');
  const [terrainNaturalPx, setTerrainNaturalPx] = useState<{ w: number; h: number } | null>(null);
  const [mapViewportPx, setMapViewportPx] = useState({ w: 0, h: 0 });
  const lastChapterPanRef = useRef<number | null>(null);
  const prevHadTerrainCoverRef = useRef(false);

  const onTerrainNaturalSize = useCallback((nw: number, nh: number) => {
    setTerrainNaturalPx({ w: nw, h: nh });
  }, []);

  const applyMapPanToDom = useCallback((x: number, y: number) => {
    mapPanLiveRef.current = { x, y };
    const el = mapLayerRef.current;
    if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  useLayoutEffect(() => {
    applyMapPanToDom(mapPan.x, mapPan.y);
  }, [mapPan.x, mapPan.y, applyMapPanToDom]);

  const terrainNaturalKey =
    terrainNaturalPx == null ? '' : `${terrainNaturalPx.w}x${terrainNaturalPx.h}`;
  if (terrainNaturalKey !== terrainNaturalKeyRef.current) {
    terrainNaturalKeyRef.current = terrainNaturalKey;
    stableTerrainCoverRef.current = null;
  }

  const terrainCoverLayout: TerrainCoverLayout | null = (() => {
    if (!terrainNaturalPx) return null;
    const { vw, vh } = viewportPxResolved(mapViewportRef.current, mapViewportPx);
    if (vw >= 8 && vh >= 8) {
      const L = missionMapCoverBox(vw, vh, terrainNaturalPx.w, terrainNaturalPx.h);
      stableTerrainCoverRef.current = L;
      return L;
    }
    return stableTerrainCoverRef.current;
  })();

  const clampMapPan = useCallback(
    (x: number, y: number) => {
      const el = mapViewportRef.current;
      const { vw, vh } = viewportPxResolved(el, mapViewportPx);
      if (vw >= 8 && vh >= 8 && terrainNaturalPx) {
        const { wd, hd } = missionMapCoverBox(vw, vh, terrainNaturalPx.w, terrainNaturalPx.h);
        return clampPanCover(x, y, vw, vh, wd, hd);
      }
      return clampMissionMapPan(x, y);
    },
    [terrainNaturalPx, mapViewportPx.w, mapViewportPx.h],
  );

  const nudgeMapPan = useCallback(
    (dx: number, dy: number) => {
      setMapPan((p) => clampMapPan(p.x + dx, p.y + dy));
    },
    [clampMapPan],
  );

  const mapArrowAvailability = useMemo(() => {
    const el = mapViewportRef.current;
    const { vw, vh } = viewportPxResolved(el, mapViewportPx);
    if (vw < 8 || vh < 8) {
      return { canPanLeft: false, canPanRight: false, canPanUp: false, canPanDown: false };
    }
    const { x, y } = mapPan;
    if (!terrainNaturalPx) {
      return {
        canPanLeft: x > -MAP_PAN_LIMIT_X + 1,
        canPanRight: x < MAP_PAN_LIMIT_X - 1,
        canPanUp: y > -MAP_PAN_LIMIT_Y + 1,
        canPanDown: y < MAP_PAN_LIMIT_Y - 1,
      };
    }
    const { wd, hd } = missionMapCoverBox(vw, vh, terrainNaturalPx.w, terrainNaturalPx.h);
    const minX = vw - wd;
    const maxX = 0;
    const minY = vh - hd;
    const maxY = 0;
    const eps = 1;
    return {
      canPanLeft: x > minX + eps,
      canPanRight: x < maxX - eps,
      canPanUp: y > minY + eps,
      canPanDown: y < maxY - eps,
    };
  }, [mapPan.x, mapPan.y, mapViewportPx.w, mapViewportPx.h, terrainNaturalPx]);

  const activeLevels = useMemo(() => {
    if (openedChapter == null) return [];
    const pair = chapters.find(([c]) => c === openedChapter);
    return pair?.[1] ?? [];
  }, [chapters, openedChapter]);

  const tacticalCommsLevelIds = useMemo(
    () => activeLevels.map((r) => r.levelId),
    [activeLevels],
  );

  /** 底圖／裝飾 seed：跟章節走，切換關卡節點不重掛戰術底圖 */
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
      const stage = stageInChapter(lv.stage);
      return missionMapTacticalNodePct(openedChapter, stage, lv);
    });
    const decorSeed = activeLevels[0]!.levelId;
    const focalLv = LEVELS[activeLevels[0]!.idx]!;
    const palette = missionTacticalBriefingPaletteFromDefinition(focalLv.id, focalLv.definition);
    return { routePoints, palette, visualSeed: decorSeed };
  }, [openedChapter, activeLevels]);

  const missionHudTelemetry = useMemo(
    () => (openedChapter != null ? missionMapHudTelemetry(openedChapter) : null),
    [openedChapter],
  );

  const requestOpenChapter = (chapter: number) => {
    if (pendingChapter != null) return;
    const openNow = () => {
      setOpenedChapter(chapter);
      setPhase('pickLevel');
      setPendingChapter(null);
      pendingTimerRef.current = null;
    };
    setPendingChapter(chapter);
    if (pendingTimerRef.current != null) window.clearTimeout(pendingTimerRef.current);
    const delayMs =
      typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
        ? 0
        : FOLDER_OPEN_TRANSITION_MS;
    if (delayMs <= 0) {
      openNow();
      return;
    }
    pendingTimerRef.current = window.setTimeout(openNow, delayMs);
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
    if (openedChapter == null) {
      setSelectedLevelId(null);
      return;
    }
    const rows = chapters.find(([c]) => c === openedChapter)?.[1] ?? [];
    setSelectedLevelId(initialProgressLevelIdInChapter(rows, clearedLevelKeySet, orderedLevelKeys));
  }, [openedChapter, chapters, clearedLevelKeySet, orderedLevelKeys]);
  useEffect(() => {
    setIsMapDragging(false);
    mapDragRef.current = null;
    setTerrainNaturalPx(null);
  }, [openedChapter]);

  useEffect(() => {
    if (phase !== 'pickLevel') {
      lastChapterPanRef.current = null;
      prevHadTerrainCoverRef.current = false;
    }
  }, [phase]);

  useLayoutEffect(() => {
    if (phase !== 'pickLevel') return;
    const el = mapViewportRef.current;
    if (!el) return;

    const sync = () => {
      const w = Math.round(el.clientWidth);
      const h = Math.round(el.clientHeight);
      if (w < 8 || h < 8) return;
      setMapViewportPx((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };

    sync();
    const t = window.setTimeout(sync, 0);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      sync();
      raf2 = requestAnimationFrame(sync);
    });

    const ro = new ResizeObserver(() => {
      sync();
      requestAnimationFrame(sync);
    });
    ro.observe(el, { box: 'border-box' });

    const onWin = () => sync();
    window.addEventListener('resize', onWin);

    return () => {
      window.clearTimeout(t);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      ro.disconnect();
      window.removeEventListener('resize', onWin);
    };
  }, [phase, openedChapter]);

  /** 底圖 onLoad 後 flex 高度常再變一次，補一次同步避免 vh 偏小 */
  useLayoutEffect(() => {
    if (phase !== 'pickLevel' || terrainNaturalPx == null) return;
    const el = mapViewportRef.current;
    if (!el) return;
    const w = Math.round(el.clientWidth);
    const h = Math.round(el.clientHeight);
    if (w >= 8 && h >= 8) {
      setMapViewportPx((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    }
  }, [phase, terrainNaturalPx]);

  useLayoutEffect(() => {
    if (phase !== 'pickLevel' || openedChapter == null) return;
    let { vw, vh } = viewportPxResolved(mapViewportRef.current, mapViewportPx);
    if (vw < 8 || vh < 8) return;

    if (!terrainNaturalPx) {
      prevHadTerrainCoverRef.current = false;
      setMapPan((p) => clampMissionMapPan(p.x, p.y));
      return;
    }

    const { wd, hd } = missionMapCoverBox(vw, vh, terrainNaturalPx.w, terrainNaturalPx.h);
    const coverJustReady = !prevHadTerrainCoverRef.current;
    prevHadTerrainCoverRef.current = true;

    if (coverJustReady || lastChapterPanRef.current !== openedChapter) {
      lastChapterPanRef.current = openedChapter;
      /** 左上角錨點：可視區左上角＝地圖左上角（平移範圍內 x,y 最大為 0） */
      setMapPan({ x: 0, y: 0 });
      return;
    }

    setMapPan((p) => clampPanCover(p.x, p.y, vw, vh, wd, hd));
  }, [phase, openedChapter, terrainNaturalPx, mapViewportPx.w, mapViewportPx.h]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedLevelId(null);
        return;
      }
      if (phase !== 'pickLevel' || openedChapter == null) return;
      const tag = e.target as HTMLElement | null;
      if (
        tag instanceof HTMLInputElement ||
        tag instanceof HTMLTextAreaElement ||
        tag?.isContentEditable
      ) {
        return;
      }
      const step = MAP_ARROW_PAN_STEP_PX;
      /** 方向鍵＝「要看那一側的地」：右鍵看東邊 → 圖層左移（x 減），以此類推 */
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        nudgeMapPan(0, step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nudgeMapPan(0, -step);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nudgeMapPan(step, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nudgeMapPan(-step, 0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, openedChapter, nudgeMapPan]);

  useEffect(
    () => () => {
      if (pendingTimerRef.current != null) {
        window.clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
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
    const row = activeLevels.find((r) => r.levelKey === selectedLevelId);
    if (!row) return null;
    const lv = LEVELS[row.idx]!;
    const chapter = openedChapter;
    const stage = stageInChapter(lv.stage);
    const unlocked = isLevelUnlocked(lv.levelKey, clearedLevelKeys, orderedLevelKeys);
    const cleared = clearedLevelKeySet.has(lv.levelKey);
    const inProgress =
      !cleared &&
      hintChapter === chapter &&
      nextPlayableLevelKey(clearedLevelKeys, orderedLevelKeys) === lv.levelKey;
    const tone: LevelProgressTone = cleared ? 'cleared' : inProgress ? 'inProgress' : 'new';
    return {
      level: lv,
      stage,
      unlocked,
      cleared,
      inProgress,
      isBossStage: stage === LEVELS_PER_CHAPTER,
      cta: levelCtaText(tone),
      heading: missionBriefDockHeading(lv),
      onStart: () => onStart(row.idx),
    };
  }, [selectedLevelId, openedChapter, activeLevels, clearedLevelKeys, orderedLevelKeys, clearedLevelKeySet, hintChapter, onStart]);
  const selectedLevelMapPos = useMemo(() => {
    if (selectedLevelId == null || openedChapter == null) return null;
    const row = activeLevels.find((r) => r.levelKey === selectedLevelId);
    if (!row) return null;
    const lv = LEVELS[row.idx]!;
    const stage = stageInChapter(lv.stage);
    return missionMapTacticalNodePct(openedChapter, stage, lv);
  }, [selectedLevelId, openedChapter, activeLevels]);

  /** 點選關卡後將該六角中心對齊戰術地圖視窗中心 */
  useLayoutEffect(() => {
    if (selectedLevelId == null || selectedLevelMapPos == null || openedChapter == null) return;
    const { vw: w, vh: h } = viewportPxResolved(mapViewportRef.current, mapViewportPx);
    if (w < 8 || h < 8) return;
    const { x: xPct, y: yPct } = selectedLevelMapPos;
    if (terrainNaturalPx) {
      const { wd, hd } = missionMapCoverBox(w, h, terrainNaturalPx.w, terrainNaturalPx.h);
      const px = w / 2 - (xPct / 100) * wd;
      const py = h / 2 - (yPct / 100) * hd;
      setMapPan(clampPanCover(px, py, w, h, wd, hd));
      return;
    }
    const px = w * (0.5 + MAP_INSET_FRAC - (MAP_CONTENT_SCALE * xPct) / 100);
    const py = h * (0.5 + MAP_INSET_FRAC - (MAP_CONTENT_SCALE * yPct) / 100);
    setMapPan(clampMissionMapPan(px, py));
  }, [selectedLevelId, selectedLevelMapPos, openedChapter, terrainNaturalPx, mapViewportPx.w, mapViewportPx.h]);

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
    const row = activeLevels.find((item) => item.levelKey === selectedLevelId);
    if (!row) return;
    if (!isLevelUnlocked(row.levelKey, clearedLevelKeys, orderedLevelKeys)) return;
    triggerEnterFeedbackAndStart(row.idx, row.levelId);
  };
  const onMapPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-mission-hex="1"], [data-mission-docked-brief="1"]')) return;
    mapDragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: mapPanLiveRef.current.x,
      originY: mapPanLiveRef.current.y,
    };
    setIsMapDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMapPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = mapDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const next = clampMapPan(
      drag.originX + (e.clientX - drag.startX),
      drag.originY + (e.clientY - drag.startY),
    );
    applyMapPanToDom(next.x, next.y);
  };
  const onMapPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = mapDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    mapDragRef.current = null;
    setIsMapDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    const { x, y } = mapPanLiveRef.current;
    setMapPan(clampMapPan(x, y));
  };

  return (
    <TerminalBackdrop scanlineOpacity={0.06} className="font-mono text-slate-200 selection:bg-[#F59E0B]/30">
      <div
        className={`relative z-10 flex w-full flex-col ${phase === 'pickLevel' ? 'min-h-[100dvh] px-3 py-3 md:px-5' : 'mx-auto max-h-[100dvh] min-h-[100dvh] max-w-[min(96vw,1760px)] overflow-hidden px-4 py-3 md:px-10 md:py-4'
          }`}
      >
        <AnimatePresence mode="wait">
          {phase === 'pickChapter' ? (
            <motion.div
              key="chapters"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain touch-manipulation"
            >
              <motion.header
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex shrink-0 flex-wrap items-center gap-4 md:mb-10 md:gap-5"
              >
                <button
                  type="button"
                  onClick={onBack}
                  className="flex items-center gap-2 rounded-xl border-2 border-[#1e293b] bg-[#0f141c] px-4 py-2.5 text-base font-bold text-slate-200 hover:border-[#F59E0B]/50 hover:text-[#F59E0B]"
                >
                  <ChevronLeft size={18} />
                  返回首頁
                </button>
                <div className="flex flex-wrap items-center gap-3 text-white">
                  <div className="flex items-center gap-2">
                    <MapIcon className="text-[#F59E0B]" size={24} />
                    <h1 className="text-2xl font-black md:text-3xl">行動卷宗</h1>
                  </div>
                  {devMissionChapterUnlockToggle != null && (
                    <button
                      type="button"
                      onClick={devMissionChapterUnlockToggle.onToggleUnlockAll}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                        devMissionChapterUnlockToggle.unlockAllActive
                          ? 'border-rose-400/70 bg-rose-950/40 text-rose-100 hover:bg-rose-900/50'
                          : 'border-emerald-400/60 bg-emerald-950/35 text-emerald-100 hover:bg-emerald-900/45'
                      }`}
                      aria-pressed={devMissionChapterUnlockToggle.unlockAllActive}
                      aria-label={
                        devMissionChapterUnlockToggle.unlockAllActive
                          ? '測試：還原行動卷宗章節鎖定'
                          : '測試：開放行動卷宗全部章節'
                      }
                    >
                      {devMissionChapterUnlockToggle.unlockAllActive
                        ? '測試 · 還原鎖定'
                        : '測試 · 開放全部章節'}
                    </button>
                  )}
                </div>
              </motion.header>

              <section aria-label="行動卷宗">
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
                        ? isLevelUnlocked(rows[0]!.levelKey, clearedLevelKeys, orderedLevelKeys)
                        : false;

                    if (!hasData || !chapterUnlocked) {
                      return null;
                    }

                    const collapsed = isChapterFullyCleared(rows, clearedLevelKeySet);

                    return (
                      <BriefingFolderCard
                        key={chapter}
                        chapter={chapter}
                        headline={rowHeadline}
                        blurb={blurb}
                        rowsCount={rows.length}
                        isHint={isHint}
                        collapsed={collapsed}
                        pending={pendingChapter === chapter}
                        delaySec={i * 0.04}
                        onEnterMap={() => requestOpenChapter(chapter)}
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
              {openedChapter != null ? (
                <div className="mission-metal-shell relative z-10 mt-1 mx-auto flex min-h-0 w-full max-w-[1920px] flex-1 overflow-hidden rounded-2xl">
                  <div className="relative z-20 flex min-h-0 flex-1 flex-col gap-2 p-3">
                    <div className="relative z-30 flex shrink-0 flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={backToChapters}
                        className="flex items-center gap-1 rounded-lg border border-[#F59E0B]/50 bg-[#F59E0B]/10 px-2.5 py-1.5 text-xs font-bold text-[#F59E0B] hover:bg-[#F59E0B]/20"
                      >
                        <ChevronLeft size={14} />
                        卷宗
                      </button>
                      <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-1 rounded-lg border border-[#1e293b] bg-[#0f141c] px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:border-slate-600 hover:text-slate-200"
                      >
                        <Home size={14} />
                        首頁
                      </button>
                    </div>
                    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
                    <main className="relative flex min-h-[min(58dvh,520px)] min-w-0 flex-col overflow-hidden rounded-xl lg:h-full lg:min-h-0">
                      <div
                        className={`flex min-h-0 h-full min-w-0 flex-1 flex-col ${MAP_VIEWPORT_FRAME_CLASS}`}
                      >
                        <div
                          className={[
                            'relative isolate flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl',
                            'bg-[linear-gradient(168deg,#5e6773_0%,#363c46_38%,#181b22_58%,#060708_100%)]',
                            'shadow-[0_0_0_1px_rgba(0,0,0,0.92),0_0_0_2px_rgba(100,116,139,0.38),0_2px_0_rgba(255,255,255,0.1),0_18px_52px_rgba(0,0,0,0.78),inset_0_2px_0_rgba(255,255,255,0.14),inset_0_-5px_16px_rgba(0,0,0,0.62)]',
                          ].join(' ')}
                          style={{ padding: MAP_BEZEL_PAD_PX }}
                        >
                          <div
                            className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/55"
                            aria-hidden
                          />
                          <div
                            className={`pointer-events-none absolute rounded-[9px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09),inset_0_3px_18px_rgba(148,163,184,0.08),inset_0_-2px_12px_rgba(0,0,0,0.52)]`}
                            style={{
                              top: MAP_BEZEL_PAD_PX,
                              left: MAP_BEZEL_PAD_PX,
                              right: MAP_BEZEL_PAD_PX,
                              bottom: MAP_BEZEL_PAD_PX,
                            }}
                            aria-hidden
                          />
                          <div
                            className="pointer-events-none absolute inset-y-4 left-[5px] w-px bg-gradient-to-b from-transparent via-white/22 to-transparent opacity-70"
                            aria-hidden
                          />
                          <div
                            className="pointer-events-none absolute inset-y-4 right-[5px] w-px bg-gradient-to-b from-transparent via-white/14 to-transparent opacity-70"
                            aria-hidden
                          />
                          <span
                            className="pointer-events-none absolute left-2.5 top-2.5 z-20 h-7 w-7 rounded-tl-lg border-l-[3px] border-t-[3px] border-slate-400/45"
                            aria-hidden
                          />
                          <span
                            className="pointer-events-none absolute right-2.5 top-2.5 z-20 h-7 w-7 rounded-tr-lg border-r-[3px] border-t-[3px] border-slate-400/45"
                            aria-hidden
                          />
                          <span
                            className="pointer-events-none absolute bottom-14 left-2.5 z-20 h-7 w-7 rounded-bl-lg border-b-[3px] border-l-[3px] border-slate-500/35"
                            aria-hidden
                          />
                          <span
                            className="pointer-events-none absolute bottom-14 right-2.5 z-20 h-7 w-7 rounded-br-lg border-b-[3px] border-r-[3px] border-slate-500/35"
                            aria-hidden
                          />
                          <span
                            className="pointer-events-none absolute left-[11px] top-[11px] z-[25] h-2 w-2 rounded-full bg-gradient-to-br from-slate-400/55 via-slate-900 to-black shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.85)]"
                            aria-hidden
                          />
                          <span
                            className="pointer-events-none absolute right-[11px] top-[11px] z-[25] h-2 w-2 rounded-full bg-gradient-to-br from-slate-400/55 via-slate-900 to-black shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.85)]"
                            aria-hidden
                          />
                          <span
                            className="pointer-events-none absolute bottom-14 left-[11px] z-[25] h-2 w-2 rounded-full bg-gradient-to-br from-slate-400/55 via-slate-900 to-black shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.85)]"
                            aria-hidden
                          />
                          <span
                            className="pointer-events-none absolute bottom-14 right-[11px] z-[25] h-2 w-2 rounded-full bg-gradient-to-br from-slate-400/55 via-slate-900 to-black shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.85)]"
                            aria-hidden
                          />
                          {missionHudTelemetry ? (
                            <div className="pointer-events-none relative z-30 flex shrink-0 flex-col gap-1 border-b border-slate-600/45 bg-[linear-gradient(180deg,rgba(12,14,18,0.78)_0%,rgba(6,7,10,0.5)_100%)] px-2.5 py-1.5 font-mono text-[9px] leading-tight text-slate-400/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.45)]">
                              <div
                                className="pointer-events-none absolute inset-x-2 top-1 h-px opacity-40 [background:repeating-linear-gradient(90deg,rgba(148,163,184,0.5)_0_3px,transparent_3px_6px)]"
                                aria-hidden
                              />
                              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5 pt-0.5">
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <div className="flex flex-wrap items-center gap-x-2">
                                    <span className="text-[10px] font-bold tracking-[0.12em] text-[#d6cfc0]">
                                      {missionHudTelemetry.pdSector}
                                    </span>
                                    <span className="text-[8px] text-slate-600/95">│</span>
                                    <span className="text-[8px] tracking-wide text-slate-500/88">{missionHudTelemetry.emcon}</span>
                                  </div>
                                  <p className="max-w-[min(100%,42rem)] truncate text-[8px] text-slate-500/92">{missionHudTelemetry.specLine}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <div className="text-[10px] tabular-nums tracking-[0.08em] text-amber-200/75">
                                    {missionHudTelemetry.dataReadout}
                                  </div>
                                  <div className="text-[8px] tabular-nums text-slate-500/80">{missionHudTelemetry.clockStub}</div>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 border-t border-slate-600/30 pt-1 text-[8px] text-slate-500/88">
                                <span className="font-semibold text-slate-400/95">{missionHudTelemetry.linkVhf}</span>
                                <span className="text-slate-600/90">·</span>
                                <span className="tabular-nums tracking-tight">{missionHudTelemetry.channelPair}</span>
                                <span className="text-slate-600/90">│</span>
                                <span className="truncate">{missionHudTelemetry.sigint}</span>
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-x-2 text-[7px] text-slate-600/85">
                                <span className="truncate">{missionHudTelemetry.sitrep}</span>
                                <span className="shrink-0 tabular-nums text-slate-500/75">{missionHudTelemetry.checksum}</span>
                              </div>
                              <div className="flex items-center gap-2 border-t border-slate-600/25 pt-1 text-[7px] uppercase tracking-[0.14em] text-slate-600/75">
                                <span className="inline-flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400/65 shadow-[0_0_7px_rgba(56,189,248,0.45)]" />
                                  NET
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500/55" />
                                  SYNC
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500/50" />
                                  LOG
                                </span>
                                <span className="ml-auto truncate font-normal normal-case tracking-normal text-slate-600/80">
                                  {missionHudTelemetry.chainStub}
                                </span>
                              </div>
                            </div>
                          ) : null}
                          <div className="relative flex min-h-0 min-w-0 flex-1 flex-row items-stretch gap-0">
                            <div
                              className="pointer-events-none flex w-[18px] shrink-0 items-center justify-center self-stretch border-r border-slate-600/40 bg-gradient-to-b from-[#14161c]/95 via-[#0c0e12]/90 to-[#08090c]/95 font-mono text-[6.5px] font-bold uppercase leading-none tracking-[0.28em] text-slate-500/42 [text-orientation:mixed] [writing-mode:vertical-rl] shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)]"
                              aria-hidden
                            >
                              戰域格網
                            </div>
                            <div
                              ref={mapViewportRef}
                              className={`mission-map-viewport relative z-10 min-h-0 w-full min-w-0 flex-1 overflow-hidden rounded-[9px] bg-[#0a0b0f] shadow-[inset_0_0_0_2px_rgba(0,0,0,0.82),inset_0_2px_0_rgba(255,255,255,0.05),inset_0_0_56px_rgba(0,0,0,0.48)] touch-none select-none overscroll-contain ${terrainNaturalPx ? '' : 'min-h-[240px]'} ${isMapDragging ? 'cursor-grabbing mission-map-viewport--dragging' : 'cursor-grab'}`}
                            onDoubleClick={() => {
                              if (isMapDragging) return;
                              startSelectedLevelFromMap();
                            }}
                            onPointerDown={onMapPointerDown}
                            onPointerMove={onMapPointerMove}
                            onPointerUp={onMapPointerUp}
                            onPointerCancel={onMapPointerUp}
                          >
                            <div className="pointer-events-none absolute inset-0 z-[26]">
                              {(
                                [
                                  {
                                    key: 'up',
                                    className:
                                      'left-1/2 top-2 -translate-x-1/2',
                                    Icon: ChevronUp,
                                    disabled: !mapArrowAvailability.canPanDown,
                                    label: '視野向上',
                                    onNudge: () => nudgeMapPan(0, MAP_ARROW_PAN_STEP_PX),
                                  },
                                  {
                                    key: 'down',
                                    className:
                                      'bottom-2 left-1/2 -translate-x-1/2',
                                    Icon: ChevronDown,
                                    disabled: !mapArrowAvailability.canPanUp,
                                    label: '視野向下',
                                    onNudge: () => nudgeMapPan(0, -MAP_ARROW_PAN_STEP_PX),
                                  },
                                  {
                                    key: 'left',
                                    className:
                                      'left-2 top-1/2 -translate-y-1/2',
                                    Icon: ChevronLeft,
                                    disabled: !mapArrowAvailability.canPanRight,
                                    label: '視野向左',
                                    onNudge: () => nudgeMapPan(MAP_ARROW_PAN_STEP_PX, 0),
                                  },
                                  {
                                    key: 'right',
                                    className:
                                      'right-2 top-1/2 -translate-y-1/2',
                                    Icon: ChevronRight,
                                    disabled: !mapArrowAvailability.canPanLeft,
                                    label: '視野向右',
                                    onNudge: () => nudgeMapPan(-MAP_ARROW_PAN_STEP_PX, 0),
                                  },
                                ] as const
                              ).map(({ key, className, Icon, disabled, label, onNudge }) => (
                                <button
                                  key={key}
                                  type="button"
                                  disabled={disabled}
                                  aria-label={label}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNudge();
                                  }}
                                  className={`pointer-events-auto absolute flex h-10 w-10 items-center justify-center rounded-lg border border-slate-600/50 bg-[linear-gradient(180deg,rgba(38,43,52,0.94)_0%,rgba(14,16,21,0.97)_100%)] text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_3px_12px_rgba(0,0,0,0.5)] hover:bg-slate-800/65 disabled:pointer-events-none disabled:opacity-35 ${className}`}
                                >
                                  <Icon size={18} strokeWidth={2.25} />
                                </button>
                              ))}
                            </div>
                            <div className="pointer-events-none absolute inset-0 z-[10] overflow-hidden" aria-hidden>
                              <div className="mission-map-viewport-scanline absolute inset-x-0 top-0 h-[18%] bg-gradient-to-b from-transparent via-slate-300/[0.07] to-transparent" />
                            </div>
                            <div className="mission-map-viewport-grain pointer-events-none absolute inset-0 z-[11]" aria-hidden />
                            <div
                              ref={mapLayerRef}
                              className={`mission-map-pan-layer absolute top-0 left-0 z-[12] ${terrainCoverLayout ? '' : 'inset-[-34%]'}`}
                              style={{
                                ...(terrainCoverLayout
                                  ? { width: terrainCoverLayout.wd, height: terrainCoverLayout.hd }
                                  : {}),
                              }}
                            >
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_26%,rgba(148,163,184,0.06),transparent_50%),radial-gradient(circle_at_82%_71%,rgba(100,116,139,0.05),transparent_48%)]" />
                          <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(148,163,184,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.09)_1px,transparent_1px)] [background-size:40px_40px]" />
                          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px)] [background-size:110px_110px]" />
                          <div className="pointer-events-none absolute inset-0">
                            <MissionChapterTacticalBackdrop
                              chapter={openedChapter}
                              routePoints={tacticalBackdrop.routePoints}
                              palette={tacticalBackdrop.palette}
                              visualSeed={tacticalBackdrop.visualSeed}
                              onTerrainNaturalSize={onTerrainNaturalSize}
                            />
                          </div>
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#030506]/28 via-transparent to-[#050708]/38" />
                          <div className="relative z-10 h-full w-full pointer-events-none">
                            {activeLevels.map((row) => {
                              const lv = LEVELS[row.idx]!;
                              const chapter = openedChapter;
                              const stage = stageInChapter(lv.stage);
                              const pos = missionMapTacticalNodePct(chapter, stage, lv);
                              const unlocked = isLevelUnlocked(lv.levelKey, clearedLevelKeys, orderedLevelKeys);
                              const cleared = clearedLevelKeySet.has(lv.levelKey);
                              const inProgress =
                                !cleared &&
                                hintChapter === chapter &&
                                nextPlayableLevelKey(clearedLevelKeys, orderedLevelKeys) === lv.levelKey;
                              const inProgressVisual = inProgress && stage !== 1;
                              return (
                                <MissionChapterHexNode
                                  key={lv.id}
                                  clipKey={String(lv.id)}
                                  stage={stage}
                                  xPct={pos.x}
                                  yPct={pos.y}
                                  selected={selectedLevelId === lv.levelKey}
                                  cleared={cleared}
                                  inProgress={inProgressVisual}
                                  locked={!unlocked}
                                  isBoss={stage === LEVELS_PER_CHAPTER}
                                  onSelect={() => {
                                    if (!unlocked) return;
                                    setSelectedLevelId((cur) => {
                                      if (cur === lv.levelKey) {
                                        triggerEnterFeedbackAndStart(row.idx, lv.id);
                                        return cur;
                                      }
                                      emit('ui.select.change');
                                      return lv.levelKey;
                                    });
                                  }}
                                  onDoubleClick={() => {
                                    if (!unlocked) return;
                                    setSelectedLevelId(lv.levelKey);
                                    triggerEnterFeedbackAndStart(row.idx, lv.id);
                                  }}
                                  confirmFlash={confirmFlashLevelId === lv.id}
                                  bestMedal={bestMedalByLevel[lv.levelKey] ?? null}
                                />
                              );
                            })}
                            <AnimatePresence mode="wait" initial={false}>
                              {dockedBriefProps && selectedLevelMapPos ? (
                                <motion.div
                                  key={dockedBriefProps.level.id}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.18 }}
                                  className="pointer-events-auto absolute z-40 w-[min(19.5rem,88vw)] min-w-[15.5rem] max-w-[92vw]"
                                  style={{
                                    left: `${selectedLevelMapPos.x}%`,
                                    /** 座標為六角按鈕中心；青框只包住徽章（≈5.65–6.1rem 高），取約半高 + 箭頭間隙 */
                                    top: `calc(${selectedLevelMapPos.y}% + 3.15rem)`,
                                    transform: 'translateX(-50%)',
                                  }}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onDoubleClick={(e) => e.stopPropagation()}
                                >
                                  <span
                                    aria-hidden
                                    className="pointer-events-none absolute -top-[6px] left-1/2 z-30 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-l border-t border-emerald-500/45 bg-[#050a08]/98"
                                  />
                                  <MissionLevelTacticalDockedBrief
                                    {...dockedBriefProps}
                                    onClose={() => setSelectedLevelId(null)}
                                  />
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          </div>
                        </div>
                          <div
                            className="pointer-events-none absolute inset-x-0 top-0 z-[13] h-[7px] opacity-38 [background:repeating-linear-gradient(90deg,rgba(148,163,184,0.42)_0_1px,transparent_1px_7px)]"
                            aria-hidden
                          />
                          <div
                            className="pointer-events-none absolute inset-x-0 top-[7px] z-[13] flex justify-between px-1 font-mono text-[7px] uppercase tracking-[0.14em] text-slate-500/55"
                            aria-hidden
                          >
                            <span>0</span>
                            <span>scale · km</span>
                            <span>∞</span>
                          </div>
                          <div className="pointer-events-none absolute bottom-2.5 right-2.5 z-[25]" aria-hidden>
                            <img
                              src={missionTacticalMapCornerLogo}
                              alt=""
                              draggable={false}
                              className="h-8 w-auto max-w-[min(28vw,140px)] object-contain object-right opacity-90 [filter:drop-shadow(0_2px_10px_rgba(0,0,0,0.72))]"
                            />
                          </div>
                          </div>
                            <div
                              className="pointer-events-none flex w-[18px] shrink-0 items-center justify-center self-stretch border-l border-slate-600/40 bg-gradient-to-b from-[#14161c]/95 via-[#0c0e12]/90 to-[#08090c]/95 font-mono text-[6.5px] font-bold uppercase leading-none tracking-[0.28em] text-slate-500/42 [text-orientation:mixed] [writing-mode:vertical-rl] shadow-[inset_1px_0_0_rgba(255,255,255,0.06)]"
                              aria-hidden
                            >
                              態勢鏈路
                            </div>
                          </div>
                          <div
                            className="pointer-events-none flex shrink-0 flex-col items-center justify-center gap-0.5 px-2 pb-0.5 pt-1"
                            aria-hidden
                          >
                            <span className="rounded border border-slate-500/45 bg-[linear-gradient(180deg,rgba(55,62,72,0.55)_0%,rgba(10,11,14,0.85)_100%)] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-300/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_1px_2px_rgba(0,0,0,0.6)]">
                              戰術顯控 · TACTICAL DISPLAY
                            </span>
                            <span className="font-mono text-[7px] tracking-[0.16em] text-slate-500/50">
                              REL-12 · AES-256 · ENCRYPTED FEED
                            </span>
                          </div>
                        </div>
                      </div>
                    </main>

                    <aside className="hidden min-h-0 min-w-0 flex-col gap-3 lg:flex lg:h-full">
                      <div className="mission-metal-panel rounded-xl p-3">
                        <div className="flex items-center gap-1.5 border-b border-slate-600/35 pb-2 text-[#F59E0B]">
                          <MapIcon size={16} aria-hidden />
                          <span className="text-xs font-bold uppercase tracking-[0.08em] text-slate-300">
                            第 {openedChapter} 章 · 戰區佈防
                          </span>
                        </div>
                        <h1 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
                          {chapterTitle.trim() || `第 ${openedChapter} 章`}
                        </h1>
                      </div>

                      <div className="min-h-0 flex-1">
                        <AnimatePresence mode="wait" initial={false}>
                          {overallChapterBrief ? (
                            <motion.div
                              key="brief-placeholder"
                              initial={{ opacity: 0.2, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0.2, y: -4 }}
                              transition={{ duration: 0.16 }}
                              className="mission-metal-panel flex min-h-[360px] w-full flex-col rounded-md px-4 py-3 pl-5"
                            >
                              <p className="text-lg font-black text-slate-200/95 sm:text-xl">總體戰術簡報</p>

                              <p className="mt-3 text-sm font-black leading-snug text-slate-300/95 sm:text-base">
                                主要目標：{overallChapterBrief.objective}
                              </p>

                              <div className="mt-4 border-t border-emerald-600/20 pt-4">
                                <div className="mb-3 flex items-end justify-between gap-2">
                                  <h2 className="text-xs font-black uppercase tracking-[0.1em] text-emerald-200/90">
                                    戰術頻道
                                  </h2>
                                  <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.14em] text-slate-500/75">
                                    UHF · ADA
                                  </span>
                                </div>
                                <MissionLevelBriefHeroComms
                                  levelIds={tacticalCommsLevelIds}
                                  rotateIntervalMs={3000}
                                  layout="stacked"
                                />
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    </aside>
                    </div>
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
