/**
 * 企劃用關卡資料結構（單一真相來源）。
 * 調整 coverageGoal、timeLimit、weights、events 等即可改難度與體驗。
 */

export type GridSystem = 'SQUARE' | 'HEXAGON' | 'TRIANGLE' | 'MIXED';

export type MapLayoutType = 'SQUARE' | 'MIXED' | 'CROSS' | 'DIAMOND' | 'TRIANGLE' | 'HEXAGON';

export type SquareMapLayout = {
  type: 'SQUARE';
  width: number;
  height: number;
  forbiddenCells?: [number, number][];
  prePlaced?: { pos: [number, number]; value: number }[];
};

export type MixedSector = {
  id: string;
  shape: 'SQUARE' | 'HEXAGON' | 'TRIANGLE';
  offset: { x: number; y: number };
  size: [number, number];
};

export type MixedMapLayout = {
  type: 'MIXED';
  sectors: MixedSector[];
};

/** 延伸：十字（第二章），與現有 solver 網格相容 */
export type CrossMapLayout = {
  type: 'CROSS';
  width: number;
  height: number;
};

/** 延伸：菱形（第二章） */
export type DiamondMapLayout = {
  type: 'DIAMOND';
  /** 半徑（曼哈頓距離），中心在 (radius, radius) */
  radius: number;
};

/** 三角鑲嵌：索引 (x,y) 見 `triangleGrid.ts`；可選 forbidden 從矩形範圍內剔除 */
export type TriangleMapLayout = {
  type: 'TRIANGLE';
  placeholder: { width: number; height: number };
  forbiddenCells?: [number, number][];
};

export type HexagonMapLayout = {
  type: 'HEXAGON';
  /** 暫用方格替代（TODO: 六角鄰接） */
  placeholder: { width: number; height: number };
};

export type MapLayout =
  | SquareMapLayout
  | MixedMapLayout
  | CrossMapLayout
  | DiamondMapLayout
  | TriangleMapLayout
  | HexagonMapLayout;

export type CommandPoolType = 'RANDOM' | 'WEIGHTED';

export type CommandConfig = {
  maxHand: number;
  poolType: CommandPoolType;
  /** 鍵為數字字串；權重為 0 可視為不出現 */
  weights: Record<string, number>;
};

export type EventTrigger = 'PROGRESS' | 'TIME_LEFT';

export type EventType = 'SANDSTORM' | 'JAMMING' | 'EMP' | 'REINFORCE';

export type LevelEvent =
  | {
      trigger: EventTrigger;
      threshold: number;
      type: 'SANDSTORM' | 'JAMMING' | 'EMP';
      duration: number;
    }
  | {
      trigger: EventTrigger;
      threshold: number;
      type: 'REINFORCE';
      count: number;
    };

export type LevelRewards = {
  /** 通關解鎖角色 id，尚未實作則僅供企劃標記 */
  unlockCharacterIds?: string[];
  narrativeFlag?: string;
  /** 企劃待辦說明 */
  todo?: string[];
};

/**
 * 盤面視覺層：有機形雲塊巡迴霧層（不阻擋點擊）。
 * 雲沿棋盤巡迴；半透明＋漸層＋模糊，底下格子會微微透出。
 * centerX／centerY：0～1，微調巡迴起點。
 */
export type MapCloudOverlayConfig = {
  centerX: number;
  centerY: number;
  /** 雲塊尺度係數：相對棋盤較短邊之比例（愈大遮住面積愈大） */
  radius: number;
  /** @deprecated 全圖巡迴，忽略（保留舊 JSON） */
  driftX?: number;
  /** @deprecated 同上 */
  driftY?: number;
  /** 巡迴一整圈秒數 */
  periodSec?: number;
  /** 整體霧濃度 0～1（愈低格子愈透；預設約 0.52） */
  opacity?: number;
  /** 柔邊模糊強度（px 量級，會換算成 SVG blur；預設約 16） */
  blurPx?: number;
};

export interface LevelDefinition {
  levelId: number;
  chapter: number;
  title: string;
  gridSystem: GridSystem;
  coverageGoal: number;
  timeLimit: number;
  initialSeed: string;
  mapLayout: MapLayout;
  commands: CommandConfig;
  events: LevelEvent[];
  /** 各章首戰可選：進入關卡時顯示的長官簡報（長官發電報、部屬依數字佈雷；字串陣列逐行） */
  chapterEntryBriefing?: string[];
  /** 可選：飄動雲層遮罩（僅視覺，不影響邏輯） */
  mapCloudOverlay?: MapCloudOverlayConfig;
  rewards: LevelRewards;
}
