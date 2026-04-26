/**
 * 章內關卡 1～10 在戰術地圖上的節點中心（百分比 0～100，原點左上）。
 * 第 1～10 章各用不同幾何主題；路徑 SVG 與六角定位共用。
 * 單關可再用 `missionTacticalBriefingMap.nodePositionPct` 覆寫。
 */

export type MissionChapterNodePct = { x: number; y: number };

/** 每章固定 10 點，索引 0 = 關卡 stage 01 … 索引 9 = stage 10 */
/**
 * 所有節點需保留安全邊距（避開 hex 光暈與 "COMPLETED" 標籤被裁）：
 *   x ∈ [8, 92]、y ∈ [16, 84]
 * 第 10 關（Boss）可放畫面中段、中右、偏上，不強制置頂。
 */
export const MISSION_CHAPTER_NODE_LAYOUTS: readonly (readonly MissionChapterNodePct[])[] = [
  // 第 1 章 — 標準散點：左下起點 → 中央三角 → 右哨 → 上緣 → 上方 Boss
  [
    { x: 10, y: 82 },
    { x: 22, y: 74 },
    { x: 40, y: 66 },
    { x: 56, y: 60 },
    { x: 44, y: 50 },
    { x: 78, y: 54 },
    { x: 28, y: 40 },
    { x: 54, y: 34 },
    { x: 76, y: 32 },
    { x: 50, y: 18 },
  ],
  // 第 2 章 — 東向突擊：由西緣橫掃至東北高台（Boss 落右上）
  [
    { x: 10, y: 72 },
    { x: 20, y: 60 },
    { x: 32, y: 66 },
    { x: 44, y: 54 },
    { x: 56, y: 58 },
    { x: 70, y: 46 },
    { x: 84, y: 52 },
    { x: 74, y: 34 },
    { x: 58, y: 26 },
    { x: 86, y: 20 },
  ],
  // 第 3 章 — 北鎖鋸齒：左右折返爬升（Boss 落中上）
  [
    { x: 14, y: 82 },
    { x: 28, y: 74 },
    { x: 18, y: 64 },
    { x: 36, y: 58 },
    { x: 24, y: 48 },
    { x: 48, y: 50 },
    { x: 32, y: 36 },
    { x: 56, y: 32 },
    { x: 44, y: 24 },
    { x: 52, y: 18 },
  ],
  // 第 4 章 — 右翼包抄（Boss 落右上角）
  [
    { x: 10, y: 52 },
    { x: 18, y: 66 },
    { x: 22, y: 42 },
    { x: 36, y: 70 },
    { x: 40, y: 38 },
    { x: 56, y: 60 },
    { x: 70, y: 42 },
    { x: 82, y: 54 },
    { x: 76, y: 30 },
    { x: 88, y: 20 },
  ],
  // 第 5 章 — 中軸走廊：縱向蛇行（Boss 落正中央，避開頂）
  [
    { x: 46, y: 80 },
    { x: 38, y: 70 },
    { x: 54, y: 64 },
    { x: 42, y: 56 },
    { x: 56, y: 46 },
    { x: 44, y: 36 },
    { x: 58, y: 28 },
    { x: 38, y: 24 },
    { x: 30, y: 44 },
    { x: 50, y: 50 },
  ],
  // 第 6 章 — 雙錨匯合（Boss 落中上）
  [
    { x: 16, y: 80 },
    { x: 12, y: 66 },
    { x: 26, y: 72 },
    { x: 82, y: 72 },
    { x: 78, y: 58 },
    { x: 68, y: 48 },
    { x: 32, y: 42 },
    { x: 58, y: 36 },
    { x: 42, y: 24 },
    { x: 50, y: 18 },
  ],
  // 第 7 章 — 外擴螺旋收斂頂心（Boss 置中偏上）
  [
    { x: 50, y: 78 },
    { x: 36, y: 70 },
    { x: 64, y: 66 },
    { x: 30, y: 54 },
    { x: 70, y: 48 },
    { x: 28, y: 40 },
    { x: 72, y: 36 },
    { x: 38, y: 26 },
    { x: 62, y: 24 },
    { x: 50, y: 20 },
  ],
  // 第 8 章 — 淺灘迂迴（Boss 落中左上）
  [
    { x: 10, y: 80 },
    { x: 24, y: 82 },
    { x: 40, y: 78 },
    { x: 56, y: 82 },
    { x: 70, y: 72 },
    { x: 82, y: 58 },
    { x: 70, y: 44 },
    { x: 52, y: 36 },
    { x: 34, y: 28 },
    { x: 44, y: 20 },
  ],
  // 第 9 章 — 高台稜線（Boss 落右中段，不強制置頂）
  [
    { x: 18, y: 80 },
    { x: 12, y: 68 },
    { x: 26, y: 58 },
    { x: 16, y: 46 },
    { x: 34, y: 40 },
    { x: 22, y: 30 },
    { x: 46, y: 26 },
    { x: 32, y: 20 },
    { x: 60, y: 22 },
    { x: 78, y: 46 },
  ],
  // 第 10 章 — 終局輻條：多點自周邊向 Boss 收斂（Boss 置正中央）
  [
    { x: 50, y: 82 },
    { x: 26, y: 74 },
    { x: 74, y: 70 },
    { x: 18, y: 56 },
    { x: 82, y: 52 },
    { x: 30, y: 36 },
    { x: 68, y: 30 },
    { x: 38, y: 22 },
    { x: 62, y: 20 },
    { x: 50, y: 50 },
  ],
] as const;

/** 第 1 章佈局（與舊常數相容；新程式請用 `missionChapterNodeLayout`） */
export const MISSION_CHAPTER_LEVEL_NODE_POSITIONS_PCT: readonly MissionChapterNodePct[] =
  MISSION_CHAPTER_NODE_LAYOUTS[0]!;

export function missionChapterNodeLayout(chapter: number): readonly MissionChapterNodePct[] {
  const c = Math.min(10, Math.max(1, Math.floor(chapter)));
  return MISSION_CHAPTER_NODE_LAYOUTS[c - 1]!;
}

export function chapterStagePosition(
  chapter: number,
  stage: number,
): MissionChapterNodePct | undefined {
  const layout = missionChapterNodeLayout(chapter);
  const i = stage - 1;
  if (i < 0 || i >= layout.length) return undefined;
  return layout[i];
}
