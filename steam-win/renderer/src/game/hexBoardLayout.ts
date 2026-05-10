import { BOARD_MAX_OUTER_H_PX, BOARD_MAX_OUTER_W_PX, BOARD_PADDING_PX } from './constants';

const SQRT3 = Math.sqrt(3);

/**
 * 尖頂朝上、odd-r 列錯位：與 placeholder 矩形索引 (x,y) 一一對應，
 * 邏輯座標仍為離散格，僅畫面為蜂巢鋪排。
 */
export function hexCenterPx(x: number, y: number, r: number): { cx: number; cy: number } {
  return {
    cx: SQRT3 * r * (x + 0.5 * (y & 1)),
    cy: 1.5 * r * y,
  };
}

export function hexPolygonPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + i * (Math.PI / 3);
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(' ');
}

/** 頂點序與 `hexPolygonPoints` 相同：0 為正上方，順時針。 */
export function hexVertexScreenPx(
  cx: number,
  cy: number,
  r: number,
  vertexIndex: number,
): { x: number; y: number } {
  const a = -Math.PI / 2 + (vertexIndex % 6) * (Math.PI / 3);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

export function hexBoardBoundsPx(w: number, h: number, r: number): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const { cx, cy } = hexCenterPx(x, y, r);
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + i * (Math.PI / 3);
        const px = cx + r * Math.cos(a);
        const py = cy + r * Math.sin(a);
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

/** 僅可玩格：裁掉 placeholder 外圈全禁的留白（與方格盤緊外接框同一意圖） */
export function hexBoardBoundsPxForCells(cells: { x: number; y: number }[], r: number): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of cells) {
    const { cx, cy } = hexCenterPx(c.x, c.y, r);
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + i * (Math.PI / 3);
      const px = cx + r * Math.cos(a);
      const py = cy + r * Math.sin(a);
      minX = Math.min(minX, px);
      minY = Math.min(minY, py);
      maxX = Math.max(maxX, px);
      maxY = Math.max(maxY, py);
    }
  }
  if (!Number.isFinite(minX) || cells.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  return { minX, minY, maxX, maxY };
}

const HEX_VIEW_PADDING = 3;

export function hexBoardContentSizePx(
  width: number,
  height: number,
  r: number
): { w: number; h: number; minX: number; minY: number } {
  const b = hexBoardBoundsPx(width, height, r);
  const p = HEX_VIEW_PADDING;
  return {
    w: b.maxX - b.minX + 2 * p,
    h: b.maxY - b.minY + 2 * p,
    minX: b.minX - p,
    minY: b.minY - p,
  };
}

export function hexBoardContentSizePxForCells(
  cells: { x: number; y: number }[],
  r: number,
): { w: number; h: number; minX: number; minY: number } {
  const b = hexBoardBoundsPxForCells(cells, r);
  const p = HEX_VIEW_PADDING;
  if (cells.length === 0) {
    return { w: 2 * p, h: 2 * p, minX: -p, minY: -p };
  }
  return {
    w: b.maxX - b.minX + 2 * p,
    h: b.maxY - b.minY + 2 * p,
    minX: b.minX - p,
    minY: b.minY - p,
  };
}

export function hexCenterScreenPx(
  x: number,
  y: number,
  r: number,
  minX: number,
  minY: number
): { cx: number; cy: number } {
  const c = hexCenterPx(x, y, r);
  return { cx: c.cx - minX, cy: c.cy - minY };
}

/** 縮放外接圓半徑 r，使整塊蜂巢落入外框上限 */
export function hexRadiusPxForLevel(width: number, height: number): number {
  const pad = BOARD_PADDING_PX;
  const innerW = BOARD_MAX_OUTER_W_PX - pad;
  const innerH = BOARD_MAX_OUTER_H_PX - pad;
  let r = 32;
  while (r >= 12) {
    const { w, h } = hexBoardContentSizePx(width, height, r);
    if (w <= innerW && h <= innerH) break;
    r -= 1;
  }
  return Math.max(12, r);
}
