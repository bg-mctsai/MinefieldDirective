import type { MapLayout } from './types';

function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededForbiddenCells(seed: string, width: number, height: number, count: number): [number, number][] {
  const roll = mulberry32(hashSeed(seed));
  const cells: [number, number][] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      cells.push([x, y]);
    }
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(roll() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells.slice(0, Math.min(count, cells.length));
}

/**
 * 第四章蜂巢占位矩形（與外置 maps/4_1～4_8 的 placeholder 一致；實際可玩格見各檔 forbidden）。
 */
const CH4_HEX_PLACEHOLDER_LAYOUTS: { width: number; height: number }[] = [
  { width: 10, height: 5 },
  { width: 9, height: 7 },
  { width: 10, height: 7 },
  { width: 11, height: 7 },
  { width: 10, height: 8 },
  { width: 10, height: 9 },
  { width: 11, height: 9 },
  { width: 10, height: 10 },
  { width: 10, height: 10 },
  { width: 10, height: 10 },
];

/**
 * 41～42：完整蜂巢占位矩形（無禁格）。
 * 43～50：同尺寸內以種子隨機挖 `forbiddenCells` 形成空格區（不可佈署）。
 */
export function buildCh4HexMapLayout(levelId: number, seed: string): MapLayout {
  const phase = levelId - 41;
  const { width, height } = CH4_HEX_PLACEHOLDER_LAYOUTS[phase]!;
  if (levelId <= 42) {
    return { type: 'HEXAGON', placeholder: { width, height } };
  }
  const area = width * height;
  const roll = mulberry32(hashSeed(`${seed}-hex-terrain-n`))();
  const frac = 0.12 + roll * 0.14;
  let nForbidden = Math.floor(area * frac);
  const maxF = Math.max(6, Math.floor(area * 0.32));
  nForbidden = Math.min(Math.max(nForbidden, 6), maxF);
  const forbiddenCells = seededForbiddenCells(`${seed}-hex-terrain-cells`, width, height, nForbidden);
  return {
    type: 'HEXAGON',
    placeholder: { width, height },
    forbiddenCells,
  };
}
