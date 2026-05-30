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
 * 相鄰節點中心建議 ≥約 12%（歐幾里得距離），避免卷宗地圖上誤觸鄰關。
 */
export const MISSION_CHAPTER_NODE_LAYOUTS: readonly (readonly MissionChapterNodePct[])[] = [
  // 第 1 章 — 新兵訓練衛星圖：西濱河口 → 西北林帶 → 工業廓 → 丘腳 → 演訓環 → 北坡 → 核心指令（Boss）
  [
    { x: 12, y: 78 },
    { x: 10, y: 56 },
    { x: 24, y: 48 },
    { x: 34, y: 36 },
    { x: 44, y: 46 },
    { x: 56, y: 36 },
    { x: 58, y: 22 },
    { x: 46, y: 18 },
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
  // 第 4 章 — 蜂巢戰線：右翼包抄，Boss 東北角
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
  // 第 5 章 — 斷線封鎖：中軸蛇行，Boss 置中；拉開 5～7 關避免節點疊在視覺上過近
  [
    { x: 48, y: 78 },
    { x: 38, y: 62 },
    { x: 58, y: 52 },
    { x: 42, y: 42 },
    { x: 62, y: 30 },
    { x: 34, y: 22 },
    { x: 46, y: 28 },
    { x: 52, y: 46 },
  ],
  // 第 6 章 — 深海要塞：底艙→中軸廊道蛇行匯合指揮台，避免左右兩角各一坨
  [
    { x: 22, y: 74 },
    { x: 36, y: 64 },
    { x: 52, y: 58 },
    { x: 68, y: 52 },
    { x: 58, y: 42 },
    { x: 44, y: 34 },
    { x: 58, y: 24 },
    { x: 50, y: 18 },
  ],
  // 第 7 章 — 信號干擾區：之字穿越中帶，少貼左右邊界
  [
    { x: 50, y: 72 },
    { x: 38, y: 62 },
    { x: 52, y: 54 },
    { x: 64, y: 46 },
    { x: 46, y: 38 },
    { x: 58, y: 30 },
    { x: 42, y: 24 },
    { x: 50, y: 18 },
  ],
  // 第 8 章 — 引爆危機：底緣起點後立刻斜切進中盤，再迂迴至 Boss
  [
    { x: 36, y: 74 },
    { x: 50, y: 68 },
    { x: 38, y: 58 },
    { x: 56, y: 50 },
    { x: 44, y: 40 },
    { x: 62, y: 34 },
    { x: 44, y: 26 },
    { x: 50, y: 18 },
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
