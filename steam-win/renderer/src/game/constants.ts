/** 棋格邊長（px），與 Soldier 位移計算一致 */
export const BOARD_CELL_PX = 40;

/** 棋格間距（px），須與 GameBoard grid gap、Soldier 位移一致 */
export const BOARD_GAP_PX = 4;

/** 盤面容器 p-4 左右合計 */
export const BOARD_PADDING_PX = 32;

/** 與 GameBoard `p-3` 一致，小兵／疊圖座標需加此偏移對齊內容區 */
export const GAME_BOARD_FRAME_PAD_PX = 12;

/** 盤面外框上限：超過則縮小格點，避免 16×2 等極寬盤面橫向溢出 */
export const BOARD_MAX_OUTER_W_PX = 680;
export const BOARD_MAX_OUTER_H_PX = 560;

/**
 * 依「畫面上實際欄列數」算出格邊長（維持方形格）。
 * 方格剪影關卡請傳可玩格外接框（與 GameBoard 的 gridW/gridH 一致），勿傳 mapLayout 全圖寬高，否則禁區很大時格點會被過度縮小。
 */
export function boardCellPxForLevel(width: number, height: number): number {
  const gap = BOARD_GAP_PX;
  const pad = BOARD_PADDING_PX;
  const naturalOuterW = width * BOARD_CELL_PX + (width - 1) * gap + pad;
  const naturalOuterH = height * BOARD_CELL_PX + (height - 1) * gap + pad;
  if (naturalOuterW <= BOARD_MAX_OUTER_W_PX && naturalOuterH <= BOARD_MAX_OUTER_H_PX) {
    return BOARD_CELL_PX;
  }
  const innerW = BOARD_MAX_OUTER_W_PX - pad;
  const innerH = BOARD_MAX_OUTER_H_PX - pad;
  const fromW = Math.floor((innerW - (width - 1) * gap) / width);
  const fromH = Math.floor((innerH - (height - 1) * gap) / height);
  return Math.min(BOARD_CELL_PX, Math.max(20, Math.min(fromW, fromH)));
}

/** 小兵移動動畫時間（ms） */
export const SOLDIER_MOVE_MS = 600;

/** 鄰焰共振（neighborPlacedDigitBonus）：底數在格上停留（ms）後才開始飛「+1」 */
export const NEIGHBOR_PLACED_BONUS_HOLD_BASE_MS = 100;
/** 鄰焰共振：「+1」從鄰格熱源飛向落子格（ms） */
export const NEIGHBOR_PLACED_BONUS_FLIGHT_MS = 420;
/** 鄰焰共振：飛抵後數字跳變前短停（ms） */
export const NEIGHBOR_PLACED_BONUS_AFTER_LAND_MS = 90;

/** 剩餘秒數 ≤ 此值時每秒播放倒數滴答（與 UI 紅字門檻一致） */
export const LAST_COUNTDOWN_SOUND_SECONDS = 10;

/** 爆炸後轉為失敗狀態的延遲（ms）（無連鎖序列時） */
export const EXPLOSION_RESOLVE_MS = 1500;

/** 違規地雷連鎖：第一顆延遲 */
export const LOSS_EXPLOSION_FIRST_DELAY_MS = 160;

/** 違規地雷連鎖：顆與顆之間間隔 */
export const LOSS_EXPLOSION_STAGGER_MS = 220;

/** 連鎖最後一顆播完後，多久切到「任務失敗」畫面 */
export const LOSS_EXPLOSION_CHAIN_SETTLE_MS = 520;

/**
 * 自動標出「必定為雷／必定安全」時，只套用離本次埋數格多遠以內（切比雪夫距離）。
 * 全盤邏輯仍會在 findForced 裡計算，但遠離此半徑的格不會被自動揭開。
 */
export const FORCED_AUTO_REVEAL_CHEBYSHEV_RADIUS = 3;
