/**
 * 手調 '#' 剪影：轉 playable Set、水平鏡像、由 '#' 格挑炸點。
 */
import { key } from './campaignSilhouettes.mjs';

export function rowsBitmapToPlayable(rows) {
  const H = rows.length;
  const W = rows[0].length;
  for (let y = 0; y < H; y++) {
    if (rows[y].length !== W) {
      throw new Error(`bitmap row ${y}: len ${rows[y].length} !== W ${W}`);
    }
  }
  const playable = new Set();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (rows[y][x] === '#') playable.add(key(x, y));
    }
  }
  return { W, H, playable };
}

export function mirrorRowsH(rows) {
  return rows.map((line) => line.split('').reverse().join(''));
}

/** 在 '#' 上挑 1～3 個盡量分散的炸點（由左而上掃序取分位） */
export function pickBlastsFromHashRows(rows, count) {
  const pts = [];
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      if (rows[y][x] === '#') pts.push([x, y]);
    }
  }
  if (pts.length < count) {
    throw new Error(`pickBlasts: need ${count} on '#', only ${pts.length}`);
  }
  const at = (i) => pts[Math.min(Math.max(0, i), pts.length - 1)];
  if (count === 1) return [at(Math.floor(pts.length / 2))];
  if (count === 2) return [at(0), at(pts.length - 1)];
  const cand = [at(Math.floor(pts.length * 0.12)), at(Math.floor(pts.length * 0.5)), at(Math.floor(pts.length * 0.88))];
  const seen = new Set();
  const out = [];
  for (const p of cand) {
    const k = key(p[0], p[1]);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(p);
    }
  }
  for (const p of pts) {
    if (out.length >= count) break;
    const k = key(p[0], p[1]);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(p);
    }
  }
  return out.slice(0, count);
}

export function assertPlayableInBand(levelId, n, min = 70, max = 100) {
  if (n < min || n > max) {
    throw new Error(`L${levelId}: playable ${n} not in ${min}..${max}`);
  }
}
