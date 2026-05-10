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

/** 尖頂六角邊序（與 `hexPolygonPoints` 頂點 0→1→… 一致）對應到上列 deltas 的索引；odd-r 偶奇列皆同。 */
const HEX_EDGE_TO_DELTA_INDEX: readonly number[] = [1, 0, 5, 4, 3, 2];

/** 第 `edgeIndex` 條邊朝向外側的格座標增量 (dx,dy) */
export function hexOffsetForEdge(y: number, edgeIndex: number): readonly [number, number] {
  const deltas = (y & 1) === 0 ? EVEN_ROW_DELTAS : ODD_ROW_DELTAS;
  return deltas[HEX_EDGE_TO_DELTA_INDEX[edgeIndex]!]!;
}

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
