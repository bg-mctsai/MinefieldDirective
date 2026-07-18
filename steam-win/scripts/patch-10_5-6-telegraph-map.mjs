/**
 * 10_5：電報去掉 7、8（保留 1～6）
 * 10_6：重產「鄰焰三橫堤」剪影（錯位堤 + 斜焰橋），並重排據點／炸點
 *
 * node scripts/patch-10_5-6-telegraph-map.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { forbiddenFromPlayable, key } from './lib/campaignSilhouettes.mjs';
import { CH10_SHAPES } from './lib/ch10ShapeBuilder.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MAPS_DIR = path.join(ROOT, 'renderer/src/levelData/maps');
const LEVELS_PATH = path.join(ROOT, 'renderer/src/levelData/levels.json');

const WEIGHTS_1_TO_6 = {
  1: 12,
  2: 16,
  3: 20,
  4: 22,
  5: 18,
  6: 14,
};

function gridStats(W, H, forbiddenCount) {
  const total = W * H;
  return { totalCells: total, forbiddenCellCount: forbiddenCount, playableCells: total - forbiddenCount };
}

function playableSetFromRows(rows) {
  const s = new Set();
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      if (rows[y][x] === '#') s.add(key(x, y));
    }
  }
  return s;
}

function chebyshev(a, b) {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
}

function cellDegree(play, x, y) {
  let d = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      if (play.has(key(x + dx, y + dy))) d++;
    }
  }
  return d;
}

function pickPlayable(play, avoidKeys, preferCenter, phW, phH, minSep = 4) {
  const avoid = avoidKeys.map((c) => [c[0], c[1]]);
  const cx = phW / 2;
  const cy = phH / 2;
  const candidates = [...play]
    .map((k) => {
      const [x, y] = k.split(',').map(Number);
      return { pos: [x, y], x, y };
    })
    .filter(({ pos, x, y }) => {
      if (avoid.some((a) => a[0] === x && a[1] === y)) return false;
      return avoid.every((a) => chebyshev(pos, a) >= minSep);
    })
    .map(({ pos, x, y }) => {
      const dist = (x - cx) ** 2 + (y - cy) ** 2;
      const deg = cellDegree(play, x, y);
      const ring = Math.abs(Math.sqrt(dist) - Math.min(phW, phH) * 0.28);
      const score = preferCenter ? dist - deg * 8 : ring * 20 - deg * 6;
      return { pos, score };
    })
    .sort((a, b) => a.score - b.score);
  if (!candidates.length) throw new Error('no playable cell with separation');
  return candidates[0].pos;
}

function pickNPlayable(play, n, avoidKeys, phW, phH) {
  const picked = [];
  const avoid = [...avoidKeys];
  for (let i = 0; i < n; i++) {
    const p = pickPlayable(play, avoid, i % 2 === 0, phW, phH);
    picked.push(p);
    avoid.push(p);
  }
  return picked;
}

/** 三橫堤：盡量一堤一據點（依 y 分帶） */
function pickOutpostsOnBands(play, rows, n, avoidKeys, phW, phH) {
  const W = rows[0].length;
  const fatYs = [];
  for (let y = 0; y < rows.length; y++) {
    if ((rows[y].match(/#/g) || []).length >= W * 0.4) fatYs.push(y);
  }
  const bands = [];
  let cur = null;
  for (const y of fatYs) {
    if (!cur || y !== cur.yEnd + 1) {
      cur = { yStart: y, yEnd: y };
      bands.push(cur);
    } else {
      cur.yEnd = y;
    }
  }
  const picked = [];
  const avoid = [...avoidKeys];
  for (let i = 0; i < n; i++) {
    const band = bands[i % Math.max(1, bands.length)];
    const midY = band ? Math.floor((band.yStart + band.yEnd) / 2) : Math.floor(phH / 2);
    const preferX = phW * (0.3 + (i % 3) * 0.2);
    const candidates = [...play]
      .map((k) => {
        const [x, y] = k.split(',').map(Number);
        return { pos: [x, y], x, y };
      })
      .filter(({ pos, x, y }) => {
        if (avoid.some((a) => a[0] === x && a[1] === y)) return false;
        if (band && (y < band.yStart || y > band.yEnd)) return false;
        return avoid.every((a) => chebyshev(pos, a) >= 3);
      })
      .map(({ pos, x, y }) => {
        const deg = cellDegree(play, x, y);
        const score = Math.abs(y - midY) * 20 + Math.abs(x - preferX) - deg * 5;
        return { pos, score };
      })
      .sort((a, b) => a.score - b.score);
    if (!candidates.length) {
      const fallback = pickPlayable(play, avoid, i % 2 === 0, phW, phH, 3);
      picked.push(fallback);
      avoid.push(fallback);
      continue;
    }
    picked.push(candidates[0].pos);
    avoid.push(candidates[0].pos);
  }
  return picked;
}

function countFatBands(rows) {
  const W = rows[0].length;
  const fat = rows.map((line) => ((line.match(/#/g) || []).length >= W * 0.4));
  let groups = 0;
  let inG = false;
  for (const f of fat) {
    if (f && !inG) {
      groups++;
      inG = true;
    }
    if (!f) inG = false;
  }
  return groups;
}

function degreeHist(rows) {
  const W = rows[0].length;
  const H = rows.length;
  const hist = {};
  let ge6 = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (rows[y][x] !== '#') continue;
      let d = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < W && ny >= 0 && ny < H && rows[ny][nx] === '#') d++;
        }
      }
      hist[d] = (hist[d] || 0) + 1;
      if (d >= 6) ge6++;
    }
  }
  return { hist, ge6 };
}

const doc = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8').replace(/^\uFEFF/, ''));

// --- 10_5：weights 1～6 ---
const lv5 = doc.levels.find((l) => l.levelId === 77);
if (!lv5) {
  console.error('missing L77');
  process.exit(1);
}
lv5.commands = {
  maxHand: lv5.commands?.maxHand ?? 3,
  poolType: 'WEIGHTED',
  weights: WEIGHTS_1_TO_6,
};
console.log('10_5 L77 weights → 1～6', WEIGHTS_1_TO_6);

// --- 10_6：重產地圖 ---
const MAP_REF = '10_6';
const LEVEL_ID = 78;
const shape = CH10_SHAPES[MAP_REF];
if (!shape) {
  console.error(`missing shape ${MAP_REF}`);
  process.exit(1);
}

const { W, H, rows, theme, playable: n } = shape;
const bands = countFatBands(rows);
const { hist, ge6 } = degreeHist(rows);
if (bands < 3) {
  console.error(`${MAP_REF}: band count ${bands} < 3`);
  process.exit(1);
}

const play = playableSetFromRows(rows);
const forbidden = forbiddenFromPlayable(W, H, play);
const mapLayout = { type: 'SQUARE', width: W, height: H, forbiddenCells: forbidden };
fs.writeFileSync(
  path.join(MAPS_DIR, `${MAP_REF}.json`),
  `${JSON.stringify({ mapLayout, mapTheme: theme, gridStats: gridStats(W, H, forbidden.length) }, null, 2)}\n`,
  'utf8',
);

const lv6 = doc.levels.find((l) => l.levelId === LEVEL_ID);
if (!lv6) {
  console.error(`missing L${LEVEL_ID}`);
  process.exit(1);
}

const avoid = [];
const digitOutposts = pickOutpostsOnBands(play, rows, 3, avoid, W, H);
avoid.push(...digitOutposts);
const blastPos = pickNPlayable(play, 3, avoid, W, H);
const prevBlasts = Array.isArray(lv6.blastPoints) ? lv6.blastPoints : [];
lv6.blastPoints = blastPos.map((pos, i) => ({
  pos,
  countdownSec: prevBlasts[i]?.countdownSec ?? [30, 25, 20][i] ?? 20,
  defuseBonusSec: prevBlasts[i]?.defuseBonusSec ?? (i < 2 ? 10 : 9),
}));
lv6.digitOutposts = digitOutposts;
if (n !== 205) {
  lv6.timeLimit = n - 15;
}

fs.writeFileSync(LEVELS_PATH, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');

console.log(
  `${MAP_REF} L${LEVEL_ID} ${W}×${H} playable=${n} bands=${bands} ge6=${ge6} hist=${JSON.stringify(hist)}`,
);
console.log(`outposts=${JSON.stringify(digitOutposts)}`);
console.log(`blasts=${JSON.stringify(blastPos)}`);
console.log(`timeLimit=${lv6.timeLimit}`);
console.log(rows.join('\n'));
