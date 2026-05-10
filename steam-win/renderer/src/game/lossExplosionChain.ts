/** 邏輯敗北時「違規連鎖」地雷：逐一引爆的序列與畫面階段 */

export type LossChainPhase = 'none' | 'popping' | 'dead';

/** 當 findForced 鄰域標記為空時，用盤上已揭示雷做逐一引爆序列（蜂巢／高禁佈時較常觸發） */
export function fallbackLossExplosionCellsFromRevealedKeys(
  revealedMineKeys: ReadonlySet<string>,
  origin: { x: number; y: number },
): { x: number; y: number }[] {
  const coords: { x: number; y: number }[] = [];
  for (const k of revealedMineKeys) {
    const comma = k.indexOf(',');
    const nx = Number(k.slice(0, comma));
    const ny = Number(k.slice(comma + 1));
    if (!Number.isFinite(nx) || !Number.isFinite(ny)) continue;
    coords.push({ x: nx, y: ny });
  }
  return coords;
}

export function sortLossExplosionCells(
  cells: { x: number; y: number }[],
  origin?: { x: number; y: number },
): string[] {
  const arr = cells.map((c) => ({ x: c.x, y: c.y }));
  arr.sort((a, b) => {
    if (origin) {
      const da = Math.abs(a.x - origin.x) + Math.abs(a.y - origin.y);
      const db = Math.abs(b.x - origin.x) + Math.abs(b.y - origin.y);
      if (da !== db) return da - db;
    }
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });
  return arr.map((c) => `${c.x},${c.y}`);
}

/** 逾時引爆：盤上已知／強制存在的雷格（無全圖解答時無法列出隱藏雷） */
export function timeoutLossExplosionKeys(
  revealedMineKeys: Iterable<string>,
  dynamicMineKeys: Iterable<string>,
  forcedMineCells: readonly [number, number][] | undefined,
): string[] {
  const keys = new Set<string>();
  for (const k of revealedMineKeys) keys.add(k);
  for (const k of dynamicMineKeys) keys.add(k);
  for (const [x, y] of forcedMineCells ?? []) keys.add(`${x},${y}`);
  const coords = Array.from(keys, (k) => {
    const comma = k.indexOf(',');
    return { x: Number(k.slice(0, comma)), y: Number(k.slice(comma + 1)) };
  }).filter((c) => Number.isFinite(c.x) && Number.isFinite(c.y));
  return sortLossExplosionCells(coords, undefined);
}

export function lossChainPhaseForKey(
  cellKey: string,
  seq: readonly string[],
  waveIndex: number,
): LossChainPhase {
  const i = seq.indexOf(cellKey);
  if (i < 0) return 'none';
  // 未開播／尚未輪到：維持一般紅雷外觀（勿整排一起變淡紅，蜂巢特別明顯）
  if (waveIndex < 0) return 'none';
  if (i < waveIndex) return 'dead';
  if (i === waveIndex) return 'popping';
  return 'none';
}
