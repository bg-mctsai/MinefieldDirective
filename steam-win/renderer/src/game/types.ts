import type { Level } from '../gameLogic';

/** 佈署中：鄰焰共振關卡會先有 approach（小兵），再有 resonance（格上底數遞增到最終值） */
export type MovingSoldierState =
  | {
      x: number;
      y: number;
      /** 含鄰格加成後的最終值 */
      value: number;
      /** 電報／鎖定顯示的底數 */
      baseValue: number;
      /** 邏輯鄰格已佈數字格數；0 時僅 phase approach */
      neighborBonus: number;
      phase: 'approach';
    }
  | {
      x: number;
      y: number;
      value: number;
      baseValue: number;
      neighborBonus: number;
      phase: 'resonance';
      /** 共振動畫當下顯示的數字（baseValue … value） */
      resonanceShown: number;
      /** 造成 +1 的鄰格（順序＝每段飛行對應的熱源） */
      resonanceContributorCells: { x: number; y: number }[];
      /** 當前「+1」飛行起點；null 表示飛行結束、格上為穩態數字 */
      flightFrom: { x: number; y: number } | null;
    };

export interface GameState {
  gameId: number;
  /** 同局重現用：同 level + runSeed 必須得到同一隨機流程 */
  runSeed: string;
  /** seeded RNG 內部狀態（uint32） */
  rngState: number;
  level: Level;
  placedNumbers: { x: number; y: number; value: number }[];
  revealedMines: Set<string>;
  revealedClear: Set<string>;
  hand: number[];
  placedInTurn: number;
  status: 'playing' | 'won' | 'lost' | 'exploding';
  message: string;
  conflictCells: { x: number; y: number }[];
  /** 邏輯敗北時，剛埋格八鄰內「放錯前」已強制為雷的格（繪 X 標引爆關聯） */
  explosionMarkCells: { x: number; y: number }[];
  /** 敗北連鎖：要「一顆一顆爆」的地雷格鍵順序（由近到遠再 y,x） */
  lossSequentialExplosionKeys: string[];
  /** 連鎖進度：-1 尚未開始；0..n-1 為當前正在爆的那顆索引；>=n 表示全爆完 */
  lossExplosionWaveIndex: number;
  /** 限時關卡剩餘秒數；`null` 表示本關不計時（僅開發／例外狀態；企劃資料應一律給正整數 timeLimit） */
  secondsLeft: number | null;
  /** 限時關：首次從長官電報選定電碼後才開始倒數 */
  timerStarted: boolean;
  /** 已領過加秒獎勵的目標雷格，避免重複加秒 */
  rewardedMineTargets: Set<string>;
  /** 深海要塞：每次行動後動態新增的地雷座標（作為 forcedMine，視覺上與靜態雷區別） */
  dynamicMines: Set<string>;
  /** 信號干擾：輪播時間基準（ms）；非干擾關為 0 */
  jammingEpochMs: number;
  /** 信號干擾：玩家點選某道電報時鎖定的顯示數字（該格停止輪播）；佈署後清空 */
  jammingLockedSlot: { slotIndex: number; value: number } | null;
  /**
   * 引爆危機：各炸點剩餘倒數秒數。key = "x,y"；從 Map 中刪除代表已解除。
   * 非引爆危機關卡為空 Map。
   */
  blastPointsCountdown: Map<string, number>;
}
