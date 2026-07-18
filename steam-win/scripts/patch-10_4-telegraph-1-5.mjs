/**
 * 10_4：電報改 1～5；廢雷場剪影改稀疏彈坑（提高 deg≥6 可放 5 的格）。
 * 僅動 maps/10_4.json 與 levels.json 的 L76，不重跑整章。
 *
 * node scripts/patch-10_4-telegraph-1-5.mjs
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

const LEVEL_ID = 76;
const MAP_REF = '10_4';

const WEIGHTS_1_TO_5 = {
  1: 14,
  2: 18,
  3: 22,
  4: 24,
  5: 22,
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

/** 拉開間距；preferCenter 偏中、否則偏中外環，並優先高鄰居度 */
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
      // 中心候選：近中 + 高 deg；外環候選：距中約 0.35*R 附近
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

const shape = CH10_SHAPES[MAP_REF];
if (!shape) {
  console.error(`missing shape ${MAP_REF}`);
  process.exit(1);
}

const { W, H, rows, theme, playable: n } = shape;
const play = playableSetFromRows(rows);
const forbidden = forbiddenFromPlayable(W, H, play);
const { hist, ge6 } = degreeHist(rows);

const mapLayout = { type: 'SQUARE', width: W, height: H, forbiddenCells: forbidden };
fs.writeFileSync(
  path.join(MAPS_DIR, `${MAP_REF}.json`),
  `${JSON.stringify({ mapLayout, mapTheme: theme, gridStats: gridStats(W, H, forbidden.length) }, null, 2)}\n`,
  'utf8',
);

const doc = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8').replace(/^\uFEFF/, ''));
const lv = doc.levels.find((l) => l.levelId === LEVEL_ID);
if (!lv) {
  console.error(`missing level ${LEVEL_ID}`);
  process.exit(1);
}

const avoid = [];
const digitOutposts = pickNPlayable(play, 2, avoid, W, H);
avoid.push(...digitOutposts);
const blastPos = pickNPlayable(play, 2, avoid, W, H);
const prevBlasts = Array.isArray(lv.blastPoints) ? lv.blastPoints : [];
lv.blastPoints = blastPos.map((pos, i) => ({
  pos,
  countdownSec: prevBlasts[i]?.countdownSec ?? (i === 0 ? 30 : 25),
  defuseBonusSec: prevBlasts[i]?.defuseBonusSec ?? 10,
}));
lv.digitOutposts = digitOutposts;
lv.commands = {
  maxHand: lv.commands?.maxHand ?? 3,
  poolType: 'WEIGHTED',
  weights: WEIGHTS_1_TO_5,
};
// playable 不變則維持原 timeLimit；若形狀腳本改了格數才重算 ch10 公式
if (n !== (lv.timeLimit + 15) && n !== 183) {
  lv.timeLimit = n - 15;
}

fs.writeFileSync(LEVELS_PATH, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');

console.log(
  `${MAP_REF} L${LEVEL_ID} ${W}×${H} playable=${n} ge6=${ge6} hist=${JSON.stringify(hist)}`,
);
console.log(`weights 1~5, outposts=${JSON.stringify(digitOutposts)}, blasts=${JSON.stringify(blastPos)}`);
console.log(`timeLimit=${lv.timeLimit}`);
