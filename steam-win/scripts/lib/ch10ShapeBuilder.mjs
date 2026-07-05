/**
 * 第 10 章 bitmap 剪影產生器：大盤雕刻 → 裁切至目標格數，保留造型差異。
 */
import { key } from './campaignSilhouettes.mjs';

export const CH10_TARGETS = {
  '10_1': { targetPlay: 150, type: 'SQUARE', theme: '終焉對角' },
  '10_2': { targetPlay: 162, type: 'HEXAGON', theme: '稜線雙工峽', maxW: 22, maxH: 17 },
  '10_3': { targetPlay: 172, type: 'HEXAGON', theme: '鑰芯' },
  '10_4': { targetPlay: 183, type: 'SQUARE', theme: '廢雷場' },
  '10_5': { targetPlay: 194, type: 'SQUARE', theme: '干擾槽掃' },
  '10_6': { targetPlay: 205, type: 'SQUARE', theme: '鄰焰三橫堤' },
  '10_7': { targetPlay: 216, type: 'SQUARE', theme: '邊炸', preferCompact: false },
  '10_8': { targetPlay: 230, type: 'SQUARE', theme: '鑽石邊', preferCompact: false },
};

function blank(W, H, fill = '.') {
  return Array.from({ length: H }, () => fill.repeat(W));
}

function set(rows, x, y, ch = '#') {
  if (y < 0 || y >= rows.length || x < 0 || x >= rows[0].length) return;
  rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1);
}

function countHash(rows) {
  let n = 0;
  for (const line of rows) for (const c of line) if (c === '#') n++;
  return n;
}

function cloneRows(rows) {
  return rows.map((r) => r);
}

function carveDiagonal(rows, W, H, band = 3) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d1 = Math.abs(x - y);
      const d2 = Math.abs(x + y - (W + H - 2) / 2);
      if (d1 > band && d2 > band) set(rows, x, y, '.');
    }
  }
}

function carveTwinRidge(rows, W, H, gapW, p = 0) {
  const gap = gapW + p;
  const gapStart = Math.floor((W - gap) / 2);
  const gapEnd = gapStart + gap - 1;
  for (let y = 0; y < H; y++) {
    const t = Math.min(y, H - 1 - y);
    const shrink = t < 2 ? 2 - t : 0;
    for (let x = 0; x < W; x++) {
      const inGap = x >= gapStart && x <= gapEnd;
      const inLeft = x < gapStart && x >= shrink;
      const inRight = x > gapEnd && x < W - shrink;
      if (!inLeft && !inRight) set(rows, x, y, '.');
    }
  }
}

function carveKeyhole(rows, W, H) {
  const cx = (W - 1) / 2;
  const cy = Math.floor(H * 0.34);
  const r = Math.min(W, H) * 0.42;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const inHead = (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2;
      const inStem = Math.abs(x - cx) <= 2.5 && y >= cy - 2 && y < H;
      if (!inHead && !inStem) set(rows, x, y, '.');
    }
  }
}

function carveMinefield(rows, W, H, step = 4) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if ((x + y) % step === 0) set(rows, x, y, '.');
    }
  }
}

function carveScan(rows, W, H) {
  for (let y = 0; y < H; y++) {
    if (y % 3 === 1) {
      for (let x = 1; x < W - 1; x++) set(rows, x, y, '.');
    }
  }
}

function carveTripleBars(rows, W, H) {
  for (let y = 0; y < H; y++) {
    if (y % 5 >= 2) {
      for (let x = 0; x < W; x++) set(rows, x, y, '.');
    }
  }
}

function carveHollow(rows, W, H, margin = 1) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const edge = x < margin || x >= W - margin || y < margin || y >= H - margin;
      if (!edge) set(rows, x, y, '.');
    }
  }
}

function carveDiamond(rows, W, H, scale = 1) {
  const cx = (W - 1) / 2;
  const cy = (H - 1) / 2;
  const maxD = (Math.min(cx, cy) + 0.5) * scale;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = Math.abs(x - cx) + Math.abs(y - cy);
      if (d > maxD) set(rows, x, y, '.');
    }
  }
}

const CARVER_FNS = [
  (r, W, H, p) => carveDiagonal(r, W, H, 2 + p),
  (r, W, H, p) => carveTwinRidge(r, W, H, 3 + (p % 2), p),
  (r, W, H) => carveKeyhole(r, W, H),
  (r, W, H, p) => carveMinefield(r, W, H, 3 + p),
  (r, W, H) => carveScan(r, W, H),
  (r, W, H) => carveTripleBars(r, W, H),
  (r, W, H, p) => carveHollow(r, W, H, 1 + (p % 2)),
  (r, W, H, p) => carveDiamond(r, W, H, 0.88 + p * 0.04),
];

/** 裁切或補邊至 target（補邊僅加在 # 鄰格） */
function fitToTarget(rows, target) {
  const W = rows[0].length;
  const H = rows.length;
  const cx = (W - 1) / 2;
  const cy = (H - 1) / 2;

  const neighbors = (x, y) => {
    let c = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < W && ny >= 0 && ny < H && rows[ny][nx] === '#') c++;
      }
    }
    return c;
  };

  let n = countHash(rows);

  while (n > target) {
    let best = null;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (rows[y][x] !== '#') continue;
        const adj = neighbors(x, y);
        const dist = (x - cx) ** 2 + (y - cy) ** 2;
        if (!best || adj < best.adj || (adj === best.adj && dist > best.dist)) {
          best = { x, y, adj, dist };
        }
      }
    }
    if (!best) break;
    set(rows, best.x, best.y, '.');
    n--;
  }

  while (n < target) {
    let best = null;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (rows[y][x] === '#') continue;
        const adj = neighbors(x, y);
        if (adj === 0) continue;
        const dist = (x - cx) ** 2 + (y - cy) ** 2;
        const score = adj * 100 - dist;
        if (!best || score > best.score) best = { x, y, score };
      }
    }
    if (!best) break;
    set(rows, best.x, best.y, '#');
    n++;
  }

  return n;
}

function shapeScore(rows) {
  const W = rows[0].length;
  const H = rows.length;
  let holes = 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (rows[y][x] === '.') {
        let sur = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (rows[y + dy][x + dx] === '#') sur++;
          }
        }
        if (sur >= 6) holes++;
      }
    }
  }
  return holes;
}

/** 裁掉 placeholder 外圈空白，略縮視覺戰場（保留 pad 格邊距） */
function cropToBounds(rows, pad = 1) {
  const H = rows.length;
  const W = rows[0].length;
  let minX = W;
  let maxX = 0;
  let minY = H;
  let maxY = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (rows[y][x] !== '#') continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  if (minX > maxX) return { rows, W, H };
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(W - 1, maxX + pad);
  maxY = Math.min(H - 1, maxY + pad);
  const cropped = [];
  for (let y = minY; y <= maxY; y++) {
    cropped.push(rows[y].slice(minX, maxX + 1));
  }
  return { rows: cropped, W: maxX - minX + 1, H: maxY - minY + 1 };
}

function buildShape(mapRef, idx, target, minPlay, meta = {}) {
  const carver = CARVER_FNS[idx];
  let best = null;

  const minW = meta.minW ?? 18 + idx;
  const maxW = meta.maxW ?? 24 + idx * 2;
  const minH = meta.minH ?? 14 + Math.floor(idx / 2);
  const maxH = meta.maxH ?? 18 + idx;
  const cropPad = meta.cropPad ?? 1;
  const preferCompact = meta.preferCompact !== false;

  for (let W = minW; W <= maxW; W++) {
    for (let H = minH; H <= maxH; H++) {
      for (let p = 0; p < 4; p++) {
        const rows = blank(W, H, '#');
        carver(rows, W, H, p);
        const carved = countHash(rows);
        if (carved <= minPlay) continue;

        const trimmed = cloneRows(rows);
        const n = fitToTarget(trimmed, target);
        if (n !== target || n <= minPlay) continue;

        const diff = Math.abs(n - target);
        const score = shapeScore(trimmed);
        const cropped = cropToBounds(trimmed, cropPad);
        const area = cropped.W * cropped.H;
        if (
          !best ||
          diff < best.diff ||
          (diff === best.diff && score > best.score) ||
          (diff === best.diff &&
            score === best.score &&
            (preferCompact ? area < best.area : area > best.area))
        ) {
          best = {
            W: cropped.W,
            H: cropped.H,
            rows: cropped.rows,
            n,
            diff,
            area,
            score,
          };
        }
      }
    }
  }

  if (!best) {
    throw new Error(`${mapRef}: cannot build shape for target ${target} (min ${minPlay})`);
  }
  return best;
}

export function buildAllCh10Shapes() {
  const out = {};
  let minPlay = 0;
  const refs = Object.keys(CH10_TARGETS);
  refs.forEach((mapRef, idx) => {
    const meta = CH10_TARGETS[mapRef];
    const built = buildShape(mapRef, idx, meta.targetPlay, minPlay, meta);
    minPlay = built.n;
    out[mapRef] = {
      W: built.W,
      H: built.H,
      type: meta.type,
      theme: meta.theme,
      targetPlay: meta.targetPlay,
      rows: built.rows,
      playable: built.n,
    };
  });
  return out;
}

export const CH10_SHAPES = buildAllCh10Shapes();
