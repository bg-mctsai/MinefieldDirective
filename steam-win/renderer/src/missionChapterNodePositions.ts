/**
 * 章內關卡 1～8 在戰術地圖上的節點中心（百分比 0～100，原點左上）。
 * 第 1～10 章各用不同幾何主題；路徑 SVG 與六角定位共用。
 * 單關可再用 `missionTacticalBriefingMap.nodePositionPct` 覆寫。
 */

export type MissionChapterNodePct = { x: number; y: number };

/** 每章固定 8 點，索引 0 = 關卡 stage 01 … 索引 7 = stage 08 */
/**
 * 所有節點需保留安全邊距（避開 hex 光暈與狀態標籤被裁）：
 *   x ∈ [8, 92]、y ∈ [16, 84]
 * 第 8 關（Boss）可放畫面中段、中右、偏上，不強制置頂。
 */
export const MISSION_CHAPTER_NODE_LAYOUTS: readonly (readonly MissionChapterNodePct[])[] = [
  // 第 1 章 — 新兵訓練衛星圖：西濱河口 → 西北林帶 → 工業廓 → 丘腳 → 演訓環 → 北坡 → 核心指令（Boss）
  [
    { x: 14, y: 78 },
    { x: 12, y: 60 },
    { x: 24, y: 52 },
    { x: 32, y: 42 },
    { x: 42, y: 50 },
    { x: 50, y: 42 },
    { x: 52, y: 30 },
    { x: 50, y: 20 },
  ],
  // 第 2 章 — 巷戰封鎖線：西巷→市場→東幹道→屋頂→巷尾 Boss（東北）
  [
    { x: 12, y: 76 },
    { x: 24, y: 62 },
    { x: 36, y: 56 },
    { x: 50, y: 50 },
    { x: 64, y: 48 },
    { x: 76, y: 42 },
    { x: 82, y: 30 },
    { x: 88, y: 20 },
  ],
  // 第 3 章 — 乾谷據點：鋸齒折返爬升，Boss 落中上
  [
    { x: 18, y: 78 },
    { x: 30, y: 68 },
    { x: 22, y: 58 },
    { x: 38, y: 50 },
    { x: 26, y: 42 },
    { x: 46, y: 36 },
    { x: 32, y: 26 },
    { x: 48, y: 18 },
  ],
  // 第 4 章 — 三角高地：右翼包抄，Boss 東北角
  [
    { x: 12, y: 55 },
    { x: 22, y: 68 },
    { x: 24, y: 45 },
    { x: 42, y: 66 },
    { x: 44, y: 36 },
    { x: 58, y: 54 },
    { x: 74, y: 38 },
    { x: 86, y: 22 },
  ],
  // 第 5 章 — 蜂巢防線：中軸蛇行，Boss 置中（巢心）
  [
    { x: 48, y: 76 },
    { x: 40, y: 64 },
    { x: 56, y: 54 },
    { x: 44, y: 44 },
    { x: 58, y: 32 },
    { x: 40, y: 24 },
    { x: 52, y: 30 },
    { x: 50, y: 48 },
  ],
  // 第 6 章 — 深海要塞：雙錨匯合，Boss 中上
  [
    { x: 18, y: 76 },
    { x: 14, y: 62 },
    { x: 28, y: 56 },
    { x: 80, y: 70 },
    { x: 76, y: 54 },
    { x: 66, y: 42 },
    { x: 38, y: 36 },
    { x: 50, y: 22 },
  ],
  // 第 7 章 — 信號干擾區：外擴螺旋收斂頂心
  [
    { x: 50, y: 74 },
    { x: 38, y: 64 },
    { x: 62, y: 58 },
    { x: 30, y: 48 },
    { x: 68, y: 42 },
    { x: 28, y: 32 },
    { x: 64, y: 26 },
    { x: 50, y: 18 },
  ],
  // 第 8 章 — 引爆危機：淺灘迂迴，Boss 偏上
  [
    { x: 12, y: 78 },
    { x: 28, y: 80 },
    { x: 44, y: 74 },
    { x: 60, y: 76 },
    { x: 74, y: 64 },
    { x: 80, y: 48 },
    { x: 58, y: 34 },
    { x: 42, y: 22 },
  ],
  // 第 9 章 — 鄰焰共振：稜線迂迴，Boss 右中段
  [
    { x: 22, y: 76 },
    { x: 16, y: 62 },
    { x: 30, y: 52 },
    { x: 20, y: 42 },
    { x: 38, y: 32 },
    { x: 26, y: 22 },
    { x: 48, y: 18 },
    { x: 76, y: 40 },
  ],
  // 第 10 章 — 終焉防線：輻條收斂，Boss 置中
  [
    { x: 50, y: 76 },
    { x: 28, y: 66 },
    { x: 74, y: 62 },
    { x: 22, y: 50 },
    { x: 78, y: 46 },
    { x: 32, y: 32 },
    { x: 68, y: 26 },
    { x: 50, y: 48 },
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
