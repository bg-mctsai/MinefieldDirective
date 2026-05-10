import { BOARD_GAP_PX, GAME_BOARD_FRAME_PAD_PX } from './constants';
import { hexCenterScreenPx } from './hexBoardLayout';

export type OverlayBoardLayout = 'square' | 'hex';

/** 盤面 p-3 內容區座標：與 Soldier / 共振疊圖一致 */
export function overlayBoardCellCenterPx(
  layout: OverlayBoardLayout,
  x: number,
  y: number,
  cellSize: number,
  hexMin?: { x: number; y: number },
  /** 方格盤：僅渲染 cells 外接框時，邏輯座標 (x,y) 對齊到裁切後網格的左上角 */
  squareGridMin?: { x: number; y: number },
): { cx: number; cy: number } {
  const pad = GAME_BOARD_FRAME_PAD_PX;
  if (layout === 'square') {
    const step = cellSize + BOARD_GAP_PX;
    const ox = squareGridMin?.x ?? 0;
    const oy = squareGridMin?.y ?? 0;
    return {
      cx: pad + (x - ox) * step + cellSize / 2,
      cy: pad + (y - oy) * step + cellSize / 2,
    };
  }
  const h = hexMin ?? { x: 0, y: 0 };
  const c = hexCenterScreenPx(x, y, cellSize, h.x, h.y);
  return { cx: pad + c.cx, cy: pad + c.cy };
}
