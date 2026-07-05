/**
 * 第八章 8_4～8_8：playable 90→110 遞增；8_7 改方格；更新 timeLimit。
 * node scripts/patch-ch8-maps-90-110.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const mapsDir = path.join(ROOT, 'renderer/src/levelData/maps');
const levelsPath = path.join(ROOT, 'renderer/src/levelData/levels.json');

const W = 12;
const H = 11;

const blastPoints = {
  '8_4': [
    [2, 1],
    [8, 5],
    [9, 9],
  ],
  '8_5': [
    [7, 2],
    [0, 6],
    [3, 9],
  ],
  '8_6': [
    [3, 1],
    [9, 5],
    [7, 9],
  ],
  '8_7': [
    [8, 1],
    [0, 5],
    [3, 8],
  ],
  '8_8': [
    [4, 2],
    [2, 7],
    [6, 10],
  ],
};

const targets = { '8_4': 90, '8_5': 95, '8_6': 100, '8_7': 105, '8_8': 110 };
const themes = {
  '8_4': '壓折',
  '8_5': '工炸區',
  '8_6': '鑰孔三炸',
  '8_7': '縱峽夾擊掃',
  '8_8': '熱十',
};

const base = JSON.parse(fs.readFileSync(path.join(mapsDir, '8_4.json'), 'utf8'));
const baseForb = new Set(base.mapLayout.forbiddenCells.map(([x, y]) => `${x},${y}`));

function distFromCenter(x, y) {
  return Math.abs(x - (W - 1) / 2) + Math.abs(y - (H - 1) / 2);
}
function distFromEdge(x, y) {
  return Math.min(x, W - 1 - x, y, H - 1 - y);
}

const sorted = [...baseForb]
  .map((k) => {
    const [x, y] = k.split(',').map(Number);
    return { k, edge: distFromEdge(x, y), center: distFromCenter(x, y) };
  })
  .sort((a, b) => b.edge - a.edge || a.center - b.center);

function buildSquareForbidden(mapRef, target) {
  const needForb = W * H - target;
  const bps = new Set(blastPoints[mapRef].map(([x, y]) => `${x},${y}`));
  const forb = new Set(baseForb);
  for (const cell of sorted) {
    if (forb.size <= needForb) break;
    if (bps.has(cell.k)) continue;
    forb.delete(cell.k);
  }
  for (const k of bps) forb.delete(k);
  if (forb.size < needForb) {
    const removed = sorted.filter((c) => !forb.has(c.k) && !bps.has(c.k));
    for (let i = removed.length - 1; forb.size < needForb && i >= 0; i--) {
      forb.add(removed[i].k);
    }
  }
  if (forb.size !== needForb) {
    throw new Error(`${mapRef}: forbidden ${forb.size} !== ${needForb}`);
  }
  return [...forb]
    .map((k) => k.split(',').map(Number))
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

function gridStats(forbiddenCount) {
  const total = W * H;
  return {
    totalCells: total,
    forbiddenCellCount: forbiddenCount,
    playableCells: total - forbiddenCount,
  };
}

function writeSquareMap(mapRef) {
  const target = targets[mapRef];
  const fc = buildSquareForbidden(mapRef, target);
  const json = {
    mapLayout: {
      type: 'SQUARE',
      width: W,
      height: H,
      forbiddenCells: fc,
    },
    mapTheme: themes[mapRef],
    gridStats: gridStats(fc.length),
  };
  fs.writeFileSync(path.join(mapsDir, `${mapRef}.json`), `${JSON.stringify(json, null, 2)}\n`);
  console.log(`wrote ${mapRef}: playable=${json.gridStats.playableCells}`);
}

// 8_6：保留六角 11×11，由鑰孔禁區遞減開放至 100 格
function buildHex8_6Forbidden() {
  const hex = JSON.parse(fs.readFileSync(path.join(mapsDir, '8_6.json'), 'utf8'));
  const hw = hex.mapLayout.placeholder.width;
  const hh = hex.mapLayout.placeholder.height;
  const target = targets['8_6'];
  const needForb = hw * hh - target;
  const bps = new Set(blastPoints['8_6'].map(([x, y]) => `${x},${y}`));
  const forb = new Set(hex.mapLayout.forbiddenCells.map(([x, y]) => `${x},${y}`));
  const hexSorted = [...forb]
    .map((k) => {
      const [x, y] = k.split(',').map(Number);
      const edge = Math.min(x, hw - 1 - x, y, hh - 1 - y);
      const center = Math.abs(x - (hw - 1) / 2) + Math.abs(y - (hh - 1) / 2);
      return { k, edge, center };
    })
    .sort((a, b) => b.edge - a.edge || a.center - b.center);
  for (const cell of hexSorted) {
    if (forb.size <= needForb) break;
    if (bps.has(cell.k)) continue;
    forb.delete(cell.k);
  }
  for (const k of bps) forb.delete(k);
  if (forb.size < needForb) {
    const removed = hexSorted.filter((c) => !forb.has(c.k) && !bps.has(c.k));
    for (let i = removed.length - 1; forb.size < needForb && i >= 0; i--) {
      forb.add(removed[i].k);
    }
  }
  if (forb.size !== needForb) {
    throw new Error(`8_6 hex: forbidden ${forb.size} !== ${needForb}`);
  }
  return [...forb]
    .map((k) => k.split(',').map(Number))
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

function writeHex8_6() {
  const hex = JSON.parse(fs.readFileSync(path.join(mapsDir, '8_6.json'), 'utf8'));
  const fc = buildHex8_6Forbidden();
  const hw = hex.mapLayout.placeholder.width;
  const hh = hex.mapLayout.placeholder.height;
  const json = {
    mapLayout: {
      type: 'HEXAGON',
      placeholder: { width: hw, height: hh },
      forbiddenCells: fc,
    },
    mapTheme: themes['8_6'],
    gridStats: {
      totalCells: hw * hh,
      forbiddenCellCount: fc.length,
      playableCells: hw * hh - fc.length,
    },
  };
  fs.writeFileSync(path.join(mapsDir, '8_6.json'), `${JSON.stringify(json, null, 2)}\n`);
  console.log(`wrote 8_6: playable=${json.gridStats.playableCells} (HEXAGON)`);
}

for (const mapRef of ['8_4', '8_5', '8_7', '8_8']) {
  writeSquareMap(mapRef);
}
writeHex8_6();

const levelsDoc = JSON.parse(fs.readFileSync(levelsPath, 'utf8'));
const weights18 = {
  '1': 10,
  '2': 14,
  '3': 18,
  '4': 18,
  '5': 14,
  '6': 10,
  '7': 8,
  '8': 4,
};

for (const lvl of levelsDoc.levels) {
  if (lvl.chapter !== 8) continue;
  const mapRef = lvl.mapRef;
  if (!targets[mapRef]) continue;
  const map = JSON.parse(fs.readFileSync(path.join(mapsDir, `${mapRef}.json`), 'utf8'));
  const pc = map.gridStats.playableCells;
  lvl.timeLimit = pc - 20;
  if (mapRef === '8_7') {
    lvl.commands = {
      maxHand: 3,
      poolType: 'WEIGHTED',
      weights: { ...weights18 },
    };
  }
  console.log(`L${lvl.levelId} ${mapRef}: timeLimit=${lvl.timeLimit}`);
}

fs.writeFileSync(levelsPath, `${JSON.stringify(levelsDoc, null, 2)}\n`);
console.log('updated levels.json');
