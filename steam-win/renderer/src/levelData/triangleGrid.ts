/**
 * 等邊三角鑲嵌：以矩形索引 (x,y) 表示每一個三角格，0<=x<width、0<=y<height。
 *  orientation：((x + y) & 1) === 0 為「尖角朝上 ▲」，否則為「尖角朝下 ▼」。
 *  邊鄰接（共用邊的三角）恰好三方向：
 *  - ▲：(x-1,y)、(x+1,y)、(x,y+1)
 *  - ▼：(x-1,y)、(x+1,y)、(x,y-1)
 *  邊界格自然只有 1～2 個有效鄰居。
 */
export function triangleEdgeNeighborCoords(
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const up = ((x + y) & 1) === 0;
  const cand = up
    ? [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y + 1 },
      ]
    : [
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
      ];
  for (const c of cand) {
    if (c.x >= 0 && c.x < width && c.y >= 0 && c.y < height) out.push(c);
  }
  return out;
}

export function triangleEdgeNeighborKeys(
  x: number,
  y: number,
  width: number,
  height: number,
  validKeys: Set<string>
): string[] {
  const keys: string[] = [];
  for (const { x: nx, y: ny } of triangleEdgeNeighborCoords(x, y, width, height)) {
    const k = `${nx},${ny}`;
    if (validKeys.has(k)) keys.push(k);
  }
  return keys;
}
