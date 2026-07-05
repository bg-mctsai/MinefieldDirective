/**
 * 第 10 章難度提升：
 * 1. 炸點 ≥2（後段 ≥3～4）
 * 2. 可玩格 150→230 遞增 + 獨立 bitmap 剪影（ch10ShapeBuilder）
 * 3. 每關至少 3 種困難機制
 *
 * node scripts/patch-ch10-difficulty-bump.mjs
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

const CH10_MEDAL = { bronze: 0.65, silver: 0.8, gold: 0.95 };
const CMD_SQ = {
  maxHand: 3,
  poolType: 'WEIGHTED',
  weights: { 1: 10, 2: 14, 3: 18, 4: 18, 5: 14, 6: 10, 7: 8, 8: 4 },
};
const CMD_HEX = {
  maxHand: 3,
  poolType: 'WEIGHTED',
  weights: { 1: 18, 2: 22, 3: 20, 4: 18, 5: 12, 6: 8 },
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

function pickPlayable(play, avoidKeys, preferCenter = true, phW, phH) {
  const avoid = new Set(avoidKeys.map((c) => key(c[0], c[1])));
  const cx = phW / 2;
  const cy = phH / 2;
  const candidates = [...play]
    .filter((k) => !avoid.has(k))
    .map((k) => {
      const [x, y] = k.split(',').map(Number);
      const dist = preferCenter ? (x - cx) ** 2 + (y - cy) ** 2 : Math.random();
      return { pos: [x, y], dist };
    })
    .sort((a, b) => a.dist - b.dist);
  if (!candidates.length) throw new Error('no playable cell');
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

function blastSpecs(count) {
  const base = [30, 25, 20, 15];
  return base.slice(0, count).map((countdownSec) => ({
    countdownSec,
    defuseBonusSec: countdownSec >= 25 ? 10 : 9,
  }));
}

function makeBlasts(play, count, avoid, phW, phH) {
  const specs = blastSpecs(count);
  const out = [];
  const used = [...avoid];
  for (const s of specs) {
    const pos = pickPlayable(play, used, false, phW, phH);
    out.push({ pos, ...s });
    used.push(pos);
  }
  return out;
}

const CH10_MECH = [
  {
    levelId: 73,
    blastN: 2,
    coverageGoal: 0.89,
    jammingMs: 250,
    dynamicMine: true,
    outpostN: 0,
    neighborBonus: false,
    mineBonusN: 0,
  },
  {
    levelId: 74,
    blastN: 2,
    coverageGoal: 0.89,
    jammingMs: 245,
    dynamicMine: false,
    outpostN: 0,
    neighborBonus: true,
    mineBonusN: 1,
  },
  {
    levelId: 75,
    blastN: 2,
    coverageGoal: 0.89,
    jammingMs: 240,
    dynamicMine: true,
    outpostN: 2,
    neighborBonus: false,
    mineBonusN: 1,
  },
  {
    levelId: 76,
    blastN: 2,
    coverageGoal: 0.9,
    jammingMs: 235,
    dynamicMine: true,
    outpostN: 2,
    neighborBonus: false,
    mineBonusN: 0,
  },
  {
    levelId: 77,
    blastN: 3,
    coverageGoal: 0.9,
    jammingMs: 230,
    dynamicMine: true,
    outpostN: 2,
    neighborBonus: false,
    mineBonusN: 1,
  },
  {
    levelId: 78,
    blastN: 3,
    coverageGoal: 0.9,
    jammingMs: 228,
    dynamicMine: true,
    outpostN: 3,
    neighborBonus: true,
    mineBonusN: 0,
  },
  {
    levelId: 79,
    blastN: 4,
    coverageGoal: 0.91,
    jammingMs: 225,
    dynamicMine: true,
    outpostN: 2,
    neighborBonus: true,
    mineBonusN: 1,
  },
  {
    levelId: 80,
    blastN: 4,
    coverageGoal: 0.91,
    jammingMs: 220,
    dynamicMine: true,
    outpostN: 3,
    neighborBonus: true,
    mineBonusN: 2,
  },
];

const doc = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8').replace(/^\uFEFF/, ''));
const byId = new Map(doc.levels.map((lv) => [lv.levelId, lv]));
const mechById = new Map(CH10_MECH.map((m) => [m.levelId, m]));

for (const [mapRef, shape] of Object.entries(CH10_SHAPES)) {
  const mech = mechById.get(
    { '10_1': 73, '10_2': 74, '10_3': 75, '10_4': 76, '10_5': 77, '10_6': 78, '10_7': 79, '10_8': 80 }[
      mapRef
    ],
  );
  if (!mech) {
    console.error(`no mechanics for ${mapRef}`);
    process.exit(1);
  }

  const { W, H, rows, type, theme, playable: n } = shape;
  const play = playableSetFromRows(rows);
  const forbidden = forbiddenFromPlayable(W, H, play);

  let mapLayout;
  if (type === 'SQUARE') {
    mapLayout = { type: 'SQUARE', width: W, height: H, forbiddenCells: forbidden };
  } else {
    mapLayout = { type: 'HEXAGON', placeholder: { width: W, height: H }, forbiddenCells: forbidden };
  }

  fs.writeFileSync(
    path.join(MAPS_DIR, `${mapRef}.json`),
    `${JSON.stringify({ mapLayout, mapTheme: theme, gridStats: gridStats(W, H, forbidden.length) }, null, 2)}\n`,
    'utf8',
  );

  const avoid = [];
  const digitOutposts =
    mech.outpostN > 0 ? pickNPlayable(play, mech.outpostN, avoid, W, H) : undefined;
  if (digitOutposts) avoid.push(...digitOutposts);

  const mineBonusTargetCells =
    mech.mineBonusN > 0 ? pickNPlayable(play, mech.mineBonusN, avoid, W, H) : undefined;
  if (mineBonusTargetCells) avoid.push(...mineBonusTargetCells);

  const blastPoints = makeBlasts(play, mech.blastN, avoid, W, H);

  const lv = byId.get(mech.levelId);
  lv.coverageGoal = mech.coverageGoal;
  lv.medalThresholds = CH10_MEDAL;
  lv.timeLimit = n - 25;
  lv.commands = type === 'HEXAGON' ? CMD_HEX : CMD_SQ;
  lv.commandSlotReceiveJamming = true;
  lv.commandSlotJammingStepMs = mech.jammingMs;

  if (mech.dynamicMine) lv.dynamicMinePerMove = true;
  else delete lv.dynamicMinePerMove;

  if (mech.neighborBonus) lv.neighborPlacedDigitBonus = true;
  else delete lv.neighborPlacedDigitBonus;

  if (digitOutposts) lv.digitOutposts = digitOutposts;
  else delete lv.digitOutposts;

  if (mineBonusTargetCells) {
    lv.mineBonusTargetCells = mineBonusTargetCells;
    lv.mineBonusSeconds = mech.levelId >= 79 ? 5 : 6;
  } else {
    delete lv.mineBonusTargetCells;
    delete lv.mineBonusSeconds;
  }

  lv.blastPoints = blastPoints;

  const mechCount = [
    lv.commandSlotReceiveJamming,
    lv.dynamicMinePerMove,
    lv.neighborPlacedDigitBonus,
    Array.isArray(lv.digitOutposts) && lv.digitOutposts.length > 0,
    Array.isArray(lv.mineBonusTargetCells) && lv.mineBonusTargetCells.length > 0,
    Array.isArray(lv.blastPoints) && lv.blastPoints.length >= 2,
  ].filter(Boolean).length;

  console.log(
    `${mapRef} L${mech.levelId} ${type} ${W}×${H} playable=${n} time=${lv.timeLimit} ` +
      `blasts=${mech.blastN} mechs=${mechCount} ${theme}`,
  );

  if (mechCount < 3) {
    console.error(`${mapRef}: only ${mechCount} mechanics`);
    process.exit(1);
  }
}

fs.writeFileSync(LEVELS_PATH, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
console.log('Wrote levels.json + maps/10_*.json (bitmap shapes)');
