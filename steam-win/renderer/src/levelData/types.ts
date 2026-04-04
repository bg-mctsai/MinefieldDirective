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

/** 尚未實作幾何時保留企劃意圖，執行時由 buildRuntimeLevel 使用 placeholder */
export type TriangleMapLayout = {
  type: 'TRIANGLE';
  /** 暫用方格替代時的邊界（TODO: 三角鑲嵌鄰接） */
  placeholder: { width: number; height: number };
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
  rewards: LevelRewards;
}
