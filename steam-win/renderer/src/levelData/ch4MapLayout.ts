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

/** 第四章三角／蜂巢占位：每關總格數 70～100（寬×高），每 10 關循環 */
const CH4_TRIANGLE_LAYOUTS: { width: number; height: number }[] = [
  { width: 8, height: 9 },
  { width: 9, height: 9 },
  { width: 10, height: 8 },
  { width: 8, height: 10 },
  { width: 9, height: 10 },
  { width: 10, height: 9 },
  { width: 7, height: 10 },
  { width: 10, height: 7 },
  { width: 9, height: 8 },
  { width: 10, height: 10 },
];

/**
 * 41～42：完整蜂巢占位矩形（無禁格）。
 * 43～50：同尺寸內以種子隨機挖 `forbiddenCells` 形成空格區（不可佈署）。
 */
export function buildCh4HexMapLayout(levelId: number, seed: string): MapLayout {
  const phase = levelId - 41;
  const { width, height } = CH4_TRIANGLE_LAYOUTS[phase]!;
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

/**
 * 31～32：完整三角鑲嵌（教學手感）。
 * 33 起：同尺寸邊界內以種子隨機挖 `forbiddenCells` 形成碎裂地形（可部署格數變少、拓撲變化）。
 */
export function buildCh4TriangleMapLayout(levelId: number, seed: string): MapLayout {
  const phase = ((levelId - 31) % 10 + 10) % 10;
  const { width, height } = CH4_TRIANGLE_LAYOUTS[phase]!;
  if (levelId <= 32) {
    return { type: 'TRIANGLE', placeholder: { width, height } };
  }
  const area = width * height;
  const roll = mulberry32(hashSeed(`${seed}-terrain-n`))();
  const frac = 0.12 + roll * 0.14;
  let nForbidden = Math.floor(area * frac);
  const maxF = Math.max(6, Math.floor(area * 0.32));
  nForbidden = Math.min(Math.max(nForbidden, 6), maxF);
  const forbiddenCells = seededForbiddenCells(`${seed}-terrain-cells`, width, height, nForbidden);
  return {
    type: 'TRIANGLE',
    placeholder: { width, height },
    forbiddenCells,
  };
}
