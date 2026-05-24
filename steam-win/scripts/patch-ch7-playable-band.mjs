/**
 * 第 7 章 maps/7_1～7_8：可玩格擴至 90～110，同步 gridStats、levels timeLimit、據點座標。
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

/** L61～L64 維持手調剪影原尺寸；L65～L68 擴至目標可玩格 */
const TARGET_PLAYABLE = {
  65: 90,
  66: 100,
  67: 102,
  68: 105,
};

const MIN_BAND = 90;
const MAX_BAND = 110;

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

function pickOutpostCenters(W, H, playable, count) {
  const cells = [];
  for (const k of playable) {
    const [x, y] = k.split(',').map(Number);
    cells.push([x, y]);
  }
  const cx = (W - 1) / 2;
  const cy = (H - 1) / 2;
  cells.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cy) - Math.hypot(b[0] - cx, b[1] - cy));
  if (count === 1) return [cells[0]];
  const a = cells[0];
  let best = cells[1];
  let bestD = -1;
  for (let i = 1; i < cells.length; i++) {
    const d = Math.hypot(cells[i][0] - a[0], cells[i][1] - a[1]);
    if (d > bestD) {
      bestD = d;
      best = cells[i];
    }
  }
  return [a, best];
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
  let { W, H, playable } = rowsToPlayable(shape.rows);
  const before = playable.size;
  if (target != null) {
    playable = expandPlayable(W, H, playable, target);
  }
  const n = playable.size;

  if (target != null && (n < MIN_BAND || n > MAX_BAND)) {
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
    if (target != null && Array.isArray(lv.digitOutposts) && lv.digitOutposts.length > 0) {
      lv.digitOutposts = pickOutpostCenters(W, H, playable, lv.digitOutposts.length);
    }
  }

  const tag = target != null ? `${before}→${n}` : `${n} (original)`;
  console.log(`${mapRef} ${shape.grid} ${W}×${H} playable ${tag} timeLimit=${n - 15} ${shape.theme}`);
}

fs.writeFileSync(LEVELS_PATH, `${JSON.stringify(levelsDoc, null, 2)}\n`, 'utf8');
console.log('\nlevels.json timeLimit / digitOutposts synced');
