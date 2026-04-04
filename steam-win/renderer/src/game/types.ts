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
  /** 限時關卡剩餘秒數；`null` 表示本關不計時（`timeLimit === 0`） */
  secondsLeft: number | null;
  /** 限時關：首次從長官電報選定電碼後才開始倒數 */
  timerStarted: boolean;
}
