/**
 * 章內關卡 1～10 在戰術地圖上的節點中心（百分比 0～100，原點左上）。
 * 第 1～10 章各用不同幾何主題；路徑 SVG 與六角定位共用。
 * 單關可再用 `missionTacticalBriefingMap.nodePositionPct` 覆寫。
 */

export type MissionChapterNodePct = { x: number; y: number };

/** 每章固定 10 點，索引 0 = 關卡 stage 01 … 索引 9 = stage 10 */
export const MISSION_CHAPTER_NODE_LAYOUTS: readonly (readonly MissionChapterNodePct[])[] = [
  // 第 1 章 — 標準散點：左下起點 → 中央三角 → 右哨 → 上緣 → 頂端目標
  [
    { x: 9, y: 88 },
    { x: 18, y: 82 },
    { x: 46, y: 58 },
    { x: 54, y: 52 },
    { x: 50, y: 66 },
    { x: 82, y: 50 },
    { x: 24, y: 34 },
    { x: 52, y: 26 },
    { x: 76, y: 30 },
    { x: 50, y: 7 },
  ],
  // 第 2 章 — 東向突擊：由西緣低處橫掃至東北高台
  [
    { x: 6, y: 74 },
    { x: 16, y: 60 },
    { x: 30, y: 64 },
    { x: 44, y: 52 },
    { x: 58, y: 56 },
    { x: 74, y: 44 },
    { x: 88, y: 50 },
    { x: 80, y: 30 },
    { x: 64, y: 20 },
    { x: 90, y: 10 },
  ],
  // 第 3 章 — 北鎖鋸齒：左下錨點後左右折返爬升
  [
    { x: 12, y: 88 },
    { x: 28, y: 80 },
    { x: 16, y: 64 },
    { x: 36, y: 58 },
    { x: 22, y: 44 },
    { x: 48, y: 48 },
    { x: 30, y: 30 },
    { x: 56, y: 24 },
    { x: 42, y: 12 },
    { x: 50, y: 6 },
  ],
  // 第 4 章 — 右翼包抄：主軸偏左，兵力沿右側與上緣收攏
  [
    { x: 8, y: 52 },
    { x: 16, y: 68 },
    { x: 20, y: 40 },
    { x: 36, y: 72 },
    { x: 40, y: 36 },
    { x: 58, y: 60 },
    { x: 74, y: 40 },
    { x: 86, y: 54 },
    { x: 78, y: 26 },
    { x: 92, y: 8 },
  ],
  // 第 5 章 — 中軸走廊：沿中央縱軸蛇行，兩側交替
  [
    { x: 48, y: 88 },
    { x: 40, y: 74 },
    { x: 56, y: 66 },
    { x: 44, y: 54 },
    { x: 54, y: 44 },
    { x: 46, y: 32 },
    { x: 52, y: 22 },
    { x: 42, y: 14 },
    { x: 56, y: 10 },
    { x: 50, y: 5 },
  ],
  // 第 6 章 — 雙錨：左下與右下雙集結區，中路匯合後上攻
  [
    { x: 14, y: 84 },
    { x: 10, y: 66 },
    { x: 22, y: 74 },
    { x: 86, y: 72 },
    { x: 82, y: 56 },
    { x: 72, y: 48 },
    { x: 28, y: 40 },
    { x: 58, y: 32 },
    { x: 40, y: 18 },
    { x: 50, y: 7 },
  ],
  // 第 7 章 — 外擴螺旋：由中下向外旋，終點收斂頂心
  [
    { x: 50, y: 80 },
    { x: 36, y: 70 },
    { x: 64, y: 64 },
    { x: 30, y: 52 },
    { x: 70, y: 46 },
    { x: 26, y: 38 },
    { x: 72, y: 32 },
    { x: 34, y: 20 },
    { x: 66, y: 14 },
    { x: 50, y: 6 },
  ],
  // 第 8 章 — 淺灘迂迴：底緣橫移後折返登高
  [
    { x: 6, y: 86 },
    { x: 22, y: 88 },
    { x: 40, y: 82 },
    { x: 58, y: 86 },
    { x: 72, y: 78 },
    { x: 84, y: 62 },
    { x: 70, y: 44 },
    { x: 50, y: 34 },
    { x: 32, y: 20 },
    { x: 50, y: 7 },
  ],
  // 第 9 章 — 高台稜線：整體偏上，多點沿稜線分佈
  [
    { x: 18, y: 86 },
    { x: 10, y: 68 },
    { x: 26, y: 58 },
    { x: 14, y: 46 },
    { x: 34, y: 38 },
    { x: 20, y: 28 },
    { x: 48, y: 24 },
    { x: 30, y: 14 },
    { x: 64, y: 16 },
    { x: 50, y: 5 },
  ],
  // 第 10 章 — 終局輻條：多點自周邊向頂心 Boss 收斂
  [
    { x: 50, y: 86 },
    { x: 26, y: 74 },
    { x: 74, y: 70 },
    { x: 20, y: 52 },
    { x: 80, y: 48 },
    { x: 32, y: 36 },
    { x: 68, y: 30 },
    { x: 38, y: 18 },
    { x: 62, y: 12 },
    { x: 50, y: 5 },
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
