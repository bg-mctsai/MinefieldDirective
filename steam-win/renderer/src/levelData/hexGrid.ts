/**
 * 尖頂朝上、odd-r 列錯位：與 `hexBoardLayout` 的 (x,y) 索引一致。
 * 每格最多 6 個邊鄰（邊界或 forbidden 挖洞後會更少）。
 * 鄰接表參考 Red Blob Games — offset coordinates odd-r。
 */
const EVEN_ROW_DELTAS: readonly [number, number][] = [
  [1, 0],
  [0, -1],
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

const ODD_ROW_DELTAS: readonly [number, number][] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [0, 1],
  [1, 1],
];

export function hexEdgeNeighborCoords(
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number }[] {
  const deltas = (y & 1) === 0 ? EVEN_ROW_DELTAS : ODD_ROW_DELTAS;
  const out: { x: number; y: number }[] = [];
  for (const [dx, dy] of deltas) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < width && ny >= 0 && ny < height) out.push({ x: nx, y: ny });
  }
  return out;
}

export function hexEdgeNeighborKeys(
  x: number,
  y: number,
  width: number,
  height: number,
  validKeys: Set<string>
): string[] {
  const keys: string[] = [];
  for (const { x: nx, y: ny } of hexEdgeNeighborCoords(x, y, width, height)) {
    const k = `${nx},${ny}`;
    if (validKeys.has(k)) keys.push(k);
  }
  return keys;
}
