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
  /** 占位矩形內禁佈格，與畫面蜂巢索引一致；可形成碎裂／空格區 */
  forbiddenCells?: [number, number][];
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

export type EventType = 'JAMMING' | 'EMP' | 'REINFORCE';

export type LevelEvent =
  | {
      trigger: EventTrigger;
      threshold: number;
      type: 'JAMMING' | 'EMP';
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

export type BlastPoint = {
  pos: [number, number];
  /** 倒數秒數；歸零前若周圍格子邏輯尚未確認所有地雷，即觸發爆炸失敗 */
  countdownSec: number;
  /** 成功解除後加入主計時器的獎勵秒數（未填預設 0） */
  defuseBonusSec?: number;
};

export interface LevelDefinition {
  levelId: number;
  chapter: number;
  title: string;
  gridSystem: GridSystem;
  coverageGoal: number;
  timeLimit: number;
  initialSeed: string;
  /** 可選；外置 maps/{mapRef}.json 的 `mapTheme`：極短戰場名（建議 2～3 字、最多 5 字），供對局頂欄與關卡選擇列 */
  mapTheme?: string;
  mapLayout: MapLayout;
  commands: CommandConfig;
  events: LevelEvent[];
  /** 進入關卡時顯示的長官簡報（字串陣列）；載入時由 chapterEntryBriefings.json 依 levelId 合併寫入 */
  chapterEntryBriefing?: string[];
  /** 可選：飄動雲層遮罩（僅視覺，不影響邏輯） */
  mapCloudOverlay?: MapCloudOverlayConfig;
  /** 可選：開局即固定為地雷的座標；solver 會把這些格視為必雷 */
  forcedMineCells?: [number, number][];
  /** 可選：當此清單中的格子被邏輯確認為地雷時，加秒獎勵（預設 5 秒） */
  mineBonusTargetCells?: [number, number][];
  /** 可選：每個目標地雷確認時加的秒數；未填時預設 5 */
  mineBonusSeconds?: number;
  /** 可選：每次玩家成功佈署後，隨機在「鄰居皆無數字」的空格新增一顆廢雷（佔格、不計入鄰格數字雷數） */
  dynamicMinePerMove?: boolean;
  /**
   * 信號干擾區：每道待辦電碼在 UI 上 1～8 往返輪播；點選電報鎖定當下數字後再點格佈署。
   */
  commandSlotReceiveJamming?: boolean;
  /**
   * 信號干擾：輪播每換一個數字的間隔（毫秒）。未填時用程式預設；過小／過大會被 clamp。
   */
  commandSlotJammingStepMs?: number;
  /**
   * 引爆危機章節——地圖上的定時炸點。
   * 每個炸點獨立倒數 countdownSec 秒；歸零前若周圍格子邏輯尚未確認所有地雷，即觸發爆炸失敗。
   * 成功解除後可獲 defuseBonusSec 秒加入主計時器。
   */
  blastPoints?: BlastPoint[];
  /**
   * 可選；座標須為可部署格。每格必須在盤面上有「數字佈署」（含開局 mapLayout.prePlaced 轉成之提示格），不可僅推論為安全空格。
   * 若總覆蓋率已達標但任一格據點仍無數字，本次佈署後視同指令失敗並引爆。
   * 若據點格被邏輯揭示為地雷或出現動態廢雷佔格，同樣立即失敗。
   */
  digitOutposts?: [number, number][];
  /**
   * 僅由 levels.json 此旗標控制；程式不依 chapter／levelId 推斷。
   * true 時：實際放下格子的數字 = 手牌（或干擾鎖定）底數 +「邏輯相鄰」且已有數字的鄰格數。
   * 鄰接與 solver 一致（方格八鄰、三角／蜂巢依 gridTopology）。
   */
  neighborPlacedDigitBonus?: boolean;
  rewards: LevelRewards;
}

/**
 * 存檔用：mapLayout 可外置於 `levelData/maps/{mapRef}.json`（與內嵌 mapLayout 二擇一；併存時以內嵌為準）。
 */
export type LevelDefinitionStored = Omit<LevelDefinition, 'mapLayout' | 'mapTheme'> & {
  mapLayout?: MapLayout;
  mapRef?: string;
  /** 可選；僅內嵌 mapLayout 且未用 mapRef 時可寫在 levels.json（多數主題請寫入 maps 檔） */
  mapTheme?: string;
};
