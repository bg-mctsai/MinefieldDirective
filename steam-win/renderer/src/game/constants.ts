/** 棋格邊長（px），與 Soldier 位移計算一致 */
export const BOARD_CELL_PX = 40;

/** 棋格間距（px），須與 GameBoard grid gap、Soldier 位移一致 */
export const BOARD_GAP_PX = 4;

/** 盤面容器 p-4 左右合計 */
export const BOARD_PADDING_PX = 32;

/** 盤面外框上限：超過則縮小格點，避免 16×2 等極寬盤面橫向溢出 */
export const BOARD_MAX_OUTER_W_PX = 680;
export const BOARD_MAX_OUTER_H_PX = 560;

/** 依關卡寬高算出實際格邊長（維持方形格） */
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

/** 爆炸後轉為失敗狀態的延遲（ms） */
export const EXPLOSION_RESOLVE_MS = 1500;

/**
 * 自動標出「必定為雷／必定安全」時，只套用離本次埋數格多遠以內（切比雪夫距離）。
 * 全盤邏輯仍會在 findForced 裡計算，但遠離此半徑的格不會被自動揭開。
 */
export const FORCED_AUTO_REVEAL_CHEBYSHEV_RADIUS = 3;
