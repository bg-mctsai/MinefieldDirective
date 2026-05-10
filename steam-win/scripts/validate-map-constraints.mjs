/**
 * 讀取 levels.json 與 maps/{mapRef}.json，檢查（若 levels 仍寫 gridSystem）與 mapLayout.type 推導一致，
 * 且 digitOutposts／blastPoints／forcedMineCells 不在 forbidden、且在邊界內。
 * 可選：--write-times 依 playable×coverageGoal 寫回 timeLimit（章內遞增）。
 *
 * node scripts/validate-map-constraints.mjs
 * node scripts/validate-map-constraints.mjs --write-times
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LEVELS_PATH = path.join(ROOT, 'renderer/src/levelData/levels.json');
const MAPS_DIR = path.join(ROOT, 'renderer/src/levelData/maps');

const key = (x, y) => `${x},${y}`;

/** 與 hydrateLevelMaps.inferGridSystemFromMapLayout 一致 */
function inferGridSystemFromLayoutType(mt) {
  if (mt === 'HEXAGON') return 'HEXAGON';
  // 舊地圖殘值：三角盤已廢止，視同蜂巢
  if (mt === 'TRIANGLE') return 'HEXAGON';
  if (mt === 'MIXED') return 'MIXED';
  return 'SQUARE';
}

function loadMapJson(mapRef) {
  const p = path.join(MAPS_DIR, `${mapRef}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function forbiddenSet(mapLayout) {
  const s = new Set();
  const fc = mapLayout.forbiddenCells ?? [];
  for (const c of fc) {
    if (Array.isArray(c) && c.length >= 2) s.add(key(c[0], c[1]));
  }
  return s;
}

function bounds(mapLayout) {
  if (mapLayout.type === 'SQUARE') {
    return { W: mapLayout.width, H: mapLayout.height };
  }
  if (mapLayout.type === 'HEXAGON' || mapLayout.type === 'TRIANGLE') {
    const ph = mapLayout.placeholder;
    return { W: ph.width, H: ph.height };
  }
  return null;
}

function playableCount(mapLayout) {
  const b = bounds(mapLayout);
  if (!b) return 0;
  const f = (mapLayout.forbiddenCells ?? []).length;
  return b.W * b.H - f;
}

function kForChapter(ch) {
  if (ch <= 7) return 1.08;
  if (ch === 8) return 1.05;
  if (ch === 9) return 1.04;
  return 1.02;
}

const doc = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8').replace(/^\uFEFF/, ''));
const { levels } = doc;

let errors = 0;

for (const lv of levels) {
  const mapRef = lv.mapRef ?? String(lv.levelId);
  const mapJson = loadMapJson(mapRef);
  const mapLayout = mapJson?.mapLayout ?? null;
  if (!mapLayout) {
    if (lv.levelId >= 41 && lv.levelId <= 100) {
      console.error(`L${lv.levelId}: missing map ${mapRef}.json`);
      errors++;
    }
    continue;
  }

  const mt = mapLayout.type;
  const inferred = inferGridSystemFromLayoutType(mt);
  if (lv.gridSystem != null && lv.gridSystem !== inferred) {
    console.error(
      `L${lv.levelId}: levels.gridSystem ${lv.gridSystem} 與 mapLayout.type ${mt} 推導值 ${inferred} 不符（請刪除 gridSystem 或修正地圖）`,
    );
    errors++;
  }

  const b = bounds(mapLayout);
  if (!b) continue;
  const { W, H } = b;
  const forb = forbiddenSet(mapLayout);

  const checkCell = (label, x, y) => {
    if (x < 0 || x >= W || y < 0 || y >= H) {
      console.error(`L${lv.levelId}: ${label} (${x},${y}) out of bounds ${W}×${H}`);
      errors++;
      return;
    }
    if (forb.has(key(x, y))) {
      console.error(`L${lv.levelId}: ${label} (${x},${y}) on forbidden`);
      errors++;
    }
  };

  if (Array.isArray(lv.digitOutposts)) {
    for (const p of lv.digitOutposts) checkCell('digitOutpost', p[0], p[1]);
  }
  if (Array.isArray(lv.blastPoints)) {
    for (const bp of lv.blastPoints) {
      const [x, y] = bp.pos;
      checkCell('blastPoint', x, y);
    }
  }
  if (Array.isArray(lv.forcedMineCells)) {
    for (const p of lv.forcedMineCells) checkCell('forcedMine', p[0], p[1]);
  }
}

if (errors > 0) {
  console.error(`\nvalidate-map-constraints: ${errors} error(s)`);
  process.exit(1);
}

console.log('validate-map-constraints: OK');

if (process.argv.includes('--write-times')) {
  const byChapter = new Map();
  for (const lv of levels) {
    if (lv.levelId < 41 || lv.levelId > 100) continue;
    if (lv.levelId === 100) continue;
    const mapRef = lv.mapRef ?? String(lv.levelId);
    const mapJson = loadMapJson(mapRef);
    const mapLayout = mapJson?.mapLayout;
    if (!mapLayout) continue;
    const play = playableCount(mapLayout);
    const k = kForChapter(lv.chapter);
    const raw = Math.max(50, Math.round(play * (lv.coverageGoal ?? 0.8) * k));
    if (!byChapter.has(lv.chapter)) byChapter.set(lv.chapter, []);
    byChapter.get(lv.chapter).push({ levelId: lv.levelId, raw, lv });
  }
  const timeById = new Map();
  for (const [, arr] of byChapter) {
    arr.sort((a, b) => a.levelId - b.levelId);
    let prev = 0;
    for (const row of arr) {
      const t = Math.max(prev + 1, row.raw);
      timeById.set(row.levelId, t);
      prev = t;
    }
  }
  for (const lv of levels) {
    if (timeById.has(lv.levelId)) lv.timeLimit = timeById.get(lv.levelId);
  }
  fs.writeFileSync(LEVELS_PATH, `${JSON.stringify(doc, null, 2)}\n`);
  console.log('validate-map-constraints: timeLimit written for levels 41–100');
}
