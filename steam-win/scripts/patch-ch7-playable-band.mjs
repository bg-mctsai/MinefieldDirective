/**
 * 第 7 章 maps/7_1～7_8：可玩格 95～110（後關遞增），同步 gridStats、levels timeLimit、據點／通訊節點座標。
 * 執行（cwd = steam-win）：node scripts/patch-ch7-playable-band.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CH7_SHAPES } from './lib/ch7BitmapShapes.mjs';
import { forbiddenFromPlayable, key } from './lib/campaignSilhouettes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, '../renderer/src/levelData/maps');
const LEVELS_PATH = path.resolve(__dirname, '../renderer/src/levelData/levels.json');

/** L61～L68（7_1～7_8）：可玩格 95～110，章內單調遞增 */
const TARGET_PLAYABLE = {
  61: 95,
  62: 97,
  63: 99,
  64: 101,
  65: 103,
  66: 105,
  67: 108,
  68: 110,
};

const MIN_BAND = 95;
const MAX_BAND = 110;

const CMD_SQUARE_STD = {
  maxHand: 3,
  poolType: 'RANDOM',
  weights: { 1: 8, 2: 14, 3: 22, 4: 22, 5: 14, 6: 10, 7: 7, 8: 3 },
};
const CMD_HEX_STD = {
  maxHand: 3,
  poolType: 'RANDOM',
  weights: { 1: 18, 2: 22, 3: 20, 4: 18, 5: 12, 6: 10 },
};
const NEIGH8 = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

function rowsToPlayable(rows) {
  const H = rows.length;
  const W = rows[0].length;
  const playable = new Set();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (rows[y][x] === '#') playable.add(key(x, y));
    }
  }
  return { W, H, playable };
}

/** 由現有 '#' 向外一層一層填滿，直到達標 */
function expandPlayable(W, H, playable, target) {
  const next = new Set(playable);
  if (next.size >= target) return next;

  const candidates = () => {
    const c = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const k = key(x, y);
        if (next.has(k)) continue;
        let adj = 0;
        for (const [dx, dy] of NEIGH8) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < W && ny >= 0 && ny < H && next.has(key(nx, ny))) adj++;
        }
        if (adj > 0) c.push({ x, y, adj, dist: Math.hypot(x - W / 2, y - H / 2) });
      }
    }
    c.sort((a, b) => b.adj - a.adj || a.dist - b.dist);
    return c;
  };

  while (next.size < target) {
    const c = candidates();
    if (c.length === 0) break;
    next.add(key(c[0].x, c[0].y));
  }
  return next;
}

function gridStats(W, H, forbiddenCount) {
  const total = W * H;
  return { totalCells: total, forbiddenCellCount: forbiddenCount, playableCells: total - forbiddenCount };
}

function playableCells(W, H, playable) {
  const cells = [];
  for (const k of playable) {
    cells.push(k.split(',').map(Number));
  }
  return cells;
}

function pickSpreadCenters(W, H, playable, count, avoid = []) {
  const avoidSet = new Set(avoid.map(([x, y]) => key(x, y)));
  const cells = playableCells(W, H, playable).filter(([x, y]) => !avoidSet.has(key(x, y)));
  const cx = (W - 1) / 2;
  const cy = (H - 1) / 2;
  cells.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cy) - Math.hypot(b[0] - cx, b[1] - cy));
  if (count <= 0 || cells.length === 0) return [];
  if (count === 1) return [cells[0]];
  const picked = [cells[0]];
  while (picked.length < count) {
    let best = null;
    let bestD = -1;
    for (const c of cells) {
      if (picked.some((p) => p[0] === c[0] && p[1] === c[1])) continue;
      const d = Math.min(...picked.map((p) => Math.hypot(c[0] - p[0], c[1] - p[1])));
      if (d > bestD) {
        bestD = d;
        best = c;
      }
    }
    if (!best) break;
    picked.push(best);
  }
  return picked;
}

const levelsDoc = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8').replace(/^\uFEFF/, ''));

for (let srcId = 61; srcId <= 68; srcId++) {
  const mapRef = `7_${srcId - 60}`;
  const shape = CH7_SHAPES[srcId];
  if (!shape) {
    console.error(`missing CH7_SHAPES[${srcId}]`);
    process.exit(1);
  }

  const target = TARGET_PLAYABLE[srcId];
  if (target == null) {
    console.error(`${mapRef}: missing TARGET_PLAYABLE[${srcId}]`);
    process.exit(1);
  }
  let { W, H, playable } = rowsToPlayable(shape.rows);
  const before = playable.size;
  playable = expandPlayable(W, H, playable, target);
  const n = playable.size;

  if (n !== target || n < MIN_BAND || n > MAX_BAND) {
    console.error(`${mapRef}: playable ${n} not in ${MIN_BAND}..${MAX_BAND} (was ${before}, target ${target})`);
    process.exit(1);
  }

  const forbidden = forbiddenFromPlayable(W, H, playable);
  const mapLayout =
    shape.grid === 'SQUARE'
      ? { type: 'SQUARE', width: W, height: H, forbiddenCells: forbidden }
      : { type: 'HEXAGON', placeholder: { width: W, height: H }, forbiddenCells: forbidden };

  const outPath = path.join(MAPS_DIR, `${mapRef}.json`);
  fs.writeFileSync(
    outPath,
    `${JSON.stringify({ mapLayout, mapTheme: shape.theme, gridStats: gridStats(W, H, forbidden.length) }, null, 2)}\n`,
    'utf8',
  );

  const lv = levelsDoc.levels.find((l) => l.mapRef === mapRef);
  if (lv) {
    lv.timeLimit = n - 15;
    const w = lv.commands?.weights ?? {};
    const hexStd = w['1'] === 18 && w['2'] === 22 && w['7'] == null;
    const squareStd = w['1'] === 8 && w['2'] === 14 && w['7'] != null;
    if (shape.grid === 'SQUARE' && hexStd) lv.commands = { ...CMD_SQUARE_STD };
    else if (shape.grid === 'HEXAGON' && squareStd) lv.commands = { ...CMD_HEX_STD };
    if (Array.isArray(lv.digitOutposts) && lv.digitOutposts.length > 0) {
      lv.digitOutposts = pickSpreadCenters(W, H, playable, lv.digitOutposts.length);
    }
    if (Array.isArray(lv.mineBonusTargetCells) && lv.mineBonusTargetCells.length > 0) {
      lv.mineBonusTargetCells = pickSpreadCenters(
        W,
        H,
        playable,
        lv.mineBonusTargetCells.length,
        lv.digitOutposts ?? [],
      );
    }
  }

  const tag = `${before}→${n}`;
  console.log(`${mapRef} ${shape.grid} ${W}×${H} playable ${tag} timeLimit=${n - 15} ${shape.theme}`);
}

fs.writeFileSync(LEVELS_PATH, `${JSON.stringify(levelsDoc, null, 2)}\n`, 'utf8');
console.log('\nlevels.json timeLimit / digitOutposts synced');
