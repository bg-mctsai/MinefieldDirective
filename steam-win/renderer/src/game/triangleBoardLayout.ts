import { BOARD_CELL_PX, BOARD_MAX_OUTER_H_PX, BOARD_MAX_OUTER_W_PX, BOARD_PADDING_PX } from './constants';

const SQRT3 = Math.sqrt(3);

export function triangleRowHeightPx(side: number): number {
  return (side * SQRT3) / 2;
}

/** 與 `triangleGrid.ts` 一致：內接於寬 side、高 rowH 的軸對齊包圍盒 */
export function triangleVerticesPx(
  x: number,
  y: number,
  side: number
): { ax: number; ay: number; bx: number; by: number; cx: number; cy: number; pointUp: boolean } {
  const rowH = triangleRowHeightPx(side);
  const left = x * (side / 2);
  const top = y * rowH;
  const mx = left + side / 2;
  const pointUp = ((x + y) & 1) === 0;
  if (pointUp) {
    return { ax: mx, ay: top, bx: left, by: top + rowH, cx: left + side, cy: top + rowH, pointUp };
  }
  return { ax: left, ay: top, bx: left + side, by: top, cx: mx, cy: top + rowH, pointUp };
}

export function triangleCentroidPx(x: number, y: number, side: number): { cx: number; cy: number } {
  const rowH = triangleRowHeightPx(side);
  const { pointUp } = triangleVerticesPx(x, y, side);
  const left = x * (side / 2);
  const top = y * rowH;
  const mx = left + side / 2;
  if (pointUp) {
    return { cx: mx, cy: top + (2 * rowH) / 3 };
  }
  return { cx: mx, cy: top + rowH / 3 };
}

export function triangleBoardContentSizePx(width: number, height: number, side: number): { w: number; h: number } {
  const rowH = triangleRowHeightPx(side);
  return {
    w: ((width + 1) * side) / 2,
    h: height * rowH,
  };
}

/** 縮放三角邊長使整塊鑲嵌落入外框上限；格數少時從較大邊長起算，視覺上三角較大 */
export function triangleSidePxForLevel(width: number, height: number): number {
  const pad = BOARD_PADDING_PX;
  const innerW = BOARD_MAX_OUTER_W_PX - pad;
  const innerH = BOARD_MAX_OUTER_H_PX - pad;
  const contentW = (s: number) => triangleBoardContentSizePx(width, height, s).w;
  const contentH = (s: number) => triangleBoardContentSizePx(width, height, s).h;
  let s = 56;
  while (contentW(s) > innerW || contentH(s) > innerH) {
    s -= 1;
    if (s < 18) break;
  }
  return Math.max(20, s);
}

function sign(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  return (px - bx) * (ay - by) - (ax - bx) * (py - by);
}

export function pointInTriangle(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number
): boolean {
  const d1 = sign(px, py, ax, ay, bx, by);
  const d2 = sign(px, py, bx, by, cx, cy);
  const d3 = sign(px, py, cx, cy, ax, ay);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}
