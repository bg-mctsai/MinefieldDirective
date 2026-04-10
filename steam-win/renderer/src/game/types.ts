import type { Level } from '../gameLogic';

export interface GameState {
  gameId: number;
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
  /** 限時關卡剩餘秒數；`null` 表示本關不計時（`timeLimit === 0`） */
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
}
