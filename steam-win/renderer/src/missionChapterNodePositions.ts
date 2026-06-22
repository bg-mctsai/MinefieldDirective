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
  // 第 1 章 — 新兵訓練：西濱河口起點 → 西北林帶 → 工業廓 → 演訓外環 → 東麓丘陵 → 北境核心（Boss）
  [
    { x: 10, y: 78 },
    { x: 8, y: 58 },
    { x: 22, y: 46 },
    { x: 42, y: 54 },
    { x: 62, y: 44 },
    { x: 78, y: 38 },
    { x: 84, y: 24 },
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
  // 第 3 章 — 乾谷據點：谷口起點 → 鋸齒折返爬升（西↔東交替）→ 東側裸坡（Boss）
  [
    { x: 18, y: 78 },
    { x: 12, y: 62 },
    { x: 32, y: 56 },
    { x: 16, y: 42 },
    { x: 44, y: 38 },
    { x: 28, y: 26 },
    { x: 58, y: 20 },
    { x: 82, y: 48 },
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
  // 第 5 章 — 斷線封鎖：西緣起點 → 北緣封鎖 → 東翼延伸 → 封鎖接合區（Boss）；節點分散利用整張大地圖
  [
    { x: 14, y: 68 },
    { x: 12, y: 48 },
    { x: 26, y: 30 },
    { x: 48, y: 16 },
    { x: 72, y: 24 },
    { x: 86, y: 40 },
    { x: 74, y: 62 },
    { x: 50, y: 44 },
  ],
  // 第 6 章 — 深海要塞：底艙外殼環繞（逆時針）→ 指揮隔艙 → 上浮廊道（Boss）
  [
    { x: 10, y: 76 },
    { x: 28, y: 70 },
    { x: 52, y: 74 },
    { x: 76, y: 64 },
    { x: 88, y: 46 },
    { x: 70, y: 26 },
    { x: 34, y: 22 },
    { x: 50, y: 18 },
  ],
  // 第 7 章 — 信號干擾區：節點偏移至地名錨點外側（不遮字、節點間 ≥12%、距地名 ≥13%）
  // 7_1 噪訊農場 → 7_2 校準靶區 → 7_3 屏蔽谷 → 7_4 同步遮蔽區 → 7_5 旁瓣發射井 → 7_6 假訊號池 → 7_7 電離反射點 → 7_8 主干擾源
  [
    { x: 8, y: 78 },
    { x: 24, y: 84 },
    { x: 10, y: 56 },
    { x: 82, y: 58 },
    { x: 30, y: 22 },
    { x: 92, y: 38 },
    { x: 72, y: 22 },
    { x: 64, y: 34 },
  ],
  // 第 8 章 — 引爆危機：西南起點 → 西緣北上 → 東南繞行 → 主炸點核心（Boss）
  [
    { x: 14, y: 78 },
    { x: 28, y: 66 },
    { x: 10, y: 52 },
    { x: 36, y: 42 },
    { x: 60, y: 50 },
    { x: 84, y: 62 },
    { x: 72, y: 30 },
    { x: 50, y: 18 },
  ],
  // 第 9 章 — 鄰焰共振：西緣起點 → 南折東進 → 北緣橫切 → 核心共振室（Boss 右中段）
  [
    { x: 12, y: 76 },
    { x: 18, y: 58 },
    { x: 32, y: 70 },
    { x: 54, y: 58 },
    { x: 26, y: 38 },
    { x: 58, y: 26 },
    { x: 82, y: 22 },
    { x: 76, y: 44 },
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
