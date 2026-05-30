/**
 * 第 4～10 章地形重構：蜂巢合併、斷線封鎖方格、後章六角縮減。
 * 執行（cwd = steam-win）：node scripts/patch-ch4-10-terrain-restructure.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CH6_SHAPES } from './lib/ch6BitmapShapes.mjs';
import { CH7_SHAPES } from './lib/ch7BitmapShapes.mjs';
import { forbiddenFromPlayable, key } from './lib/campaignSilhouettes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, '../renderer/src/levelData/maps');
const LEVELS_PATH = path.resolve(__dirname, '../renderer/src/levelData/levels.json');
const ARCHIVE_DIR = path.join(MAPS_DIR, '_archive');

const HEX_WEIGHTS = { '1': 18, '2': 22, '3': 20, '4': 18, '5': 12, '6': 8 };
const SQUARE_WEIGHTS = { '1': 8, '2': 14, '3': 22, '4': 22, '5': 14, '6': 10, '7': 7, '8': 3 };

const CH5_SQUARE_THEMES = ['斷線北緣', '封鎖廊道', '紅筆節點', '取捨十字路口', '撤離底線'];
const CH5_SQUARE_SRC = ['3_1', '3_2', '3_3', '3_4', '3_5'];

/** 六角改方格：用同章方格關當幾何模板 */
const HEX_TO_SQUARE_REF = {
  '6_1': '6_3',
  '6_4': '6_6',
  '7_2': '7_1',
  '7_5': '7_4',
  '8_2': '8_1',
  '8_5': '8_4',
  '9_2': '9_1',
  '9_5': '9_4',
};

/** 以 CH6/7 剪影生成方格（無同章模板時） */
const SQUARE_SHAPE_OVERRIDE = {
  '6_1': { shapeId: 53, theme: '深海水母' },
  '6_4': { shapeId: 56, theme: '三叉戟' },
  '7_2': { shapeId: 61, theme: '雷達碟' },
  '7_5': { shapeId: 64, theme: '干擾錐' },
};

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
}

function gridStats(W, H, forbiddenCount) {
  const total = W * H;
  return { totalCells: total, forbiddenCellCount: forbiddenCount, playableCells: total - forbiddenCount };
}

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

function shapeToMapDoc(shape) {
  const { W, H, playable } = rowsToPlayable(shape.rows);
  const forbidden = forbiddenFromPlayable(W, H, playable);
  const mapLayout =
    shape.grid === 'SQUARE'
      ? { type: 'SQUARE', width: W, height: H, forbiddenCells: forbidden }
      : { type: 'HEXAGON', placeholder: { width: W, height: H }, forbiddenCells: forbidden };
  return {
    mapLayout,
    mapTheme: shape.theme,
    gridStats: gridStats(W, H, forbidden.length),
  };
}

function copyMapFields(srcRef, destRef, themeOverride) {
  const src = readJson(path.join(MAPS_DIR, `${srcRef}.json`));
  const doc = {
    mapLayout: JSON.parse(JSON.stringify(src.mapLayout)),
    mapTheme: themeOverride ?? src.mapTheme,
    gridStats: src.gridStats ? { ...src.gridStats } : undefined,
  };
  if (!doc.gridStats) {
    const ml = doc.mapLayout;
    const W = ml.type === 'SQUARE' ? ml.width : ml.placeholder.width;
    const H = ml.type === 'SQUARE' ? ml.height : ml.placeholder.height;
    const fc = ml.forbiddenCells?.length ?? 0;
    doc.gridStats = gridStats(W, H, fc);
  }
  writeJson(path.join(MAPS_DIR, `${destRef}.json`), doc);
  return doc.gridStats.playableCells;
}

function mergeLevelFields(target, source, opts) {
  const keep = ['levelId', 'chapter', 'mapRef'];
  for (const k of Object.keys(target)) {
    if (!keep.includes(k)) delete target[k];
  }
  for (const [k, v] of Object.entries(source)) {
    if (keep.includes(k)) continue;
    if (k === 'rewards' && v?.todo) continue;
    target[k] = JSON.parse(JSON.stringify(v));
  }
  if (opts.title) target.title = opts.title;
  if (opts.coverageGoal != null) target.coverageGoal = opts.coverageGoal;
  if (opts.timeLimit != null) target.timeLimit = opts.timeLimit;
  if (opts.initialSeed) target.initialSeed = opts.initialSeed;
  if (opts.rewards !== undefined) target.rewards = opts.rewards;
  else if (!target.rewards) target.rewards = {};
}

function hexCommands() {
  return { maxHand: 3, poolType: 'WEIGHTED', weights: { ...HEX_WEIGHTS } };
}

function squareCommands(poolType = 'WEIGHTED') {
  return { maxHand: 3, poolType, weights: { ...SQUARE_WEIGHTS } };
}

function playableFromMapRef(mapRef) {
  const doc = readJson(path.join(MAPS_DIR, `${mapRef}.json`));
  return doc.gridStats?.playableCells ?? 0;
}

// --- archive old 5_1, 5_2 hex before overwrite ---
if (!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
for (const ref of ['5_1', '5_2']) {
  const src = path.join(MAPS_DIR, `${ref}.json`);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(ARCHIVE_DIR, `${ref}.hex-legacy.json`));
  }
}

// --- Ch4: 5_3..5_8 -> 4_3..4_8 ---
for (let k = 3; k <= 8; k++) {
  copyMapFields(`5_${k}`, `4_${k}`);
  console.log(`map 5_${k} -> 4_${k}`);
}

const levelsDoc = readJson(LEVELS_PATH);
const byMapRef = (ref) => levelsDoc.levels.find((l) => l.mapRef === ref);
const byLevelId = (id) => levelsDoc.levels.find((l) => l.levelId === id);

// Ch4 titles + merge levels 27-32 from 35-40
for (let k = 1; k <= 8; k++) {
  const lv = byMapRef(`4_${k}`);
  lv.title = `蜂巢戰線 · 4_${k}`;
  if (lv.rewards?.todo) lv.rewards = {};
}
for (let k = 3; k <= 8; k++) {
  const target = byLevelId(24 + k);
  const source = byLevelId(32 + k);
  mergeLevelFields(target, source, {
    title: `蜂巢戰線 · 4_${k}`,
    initialSeed: `minefield-campaign-v1-L${24 + k}-ch4-merged`,
  });
  const playable = playableFromMapRef(`4_${k}`);
  target.timeLimit = playable - 5;
  target.coverageGoal = 0.8;
  target.commands = hexCommands();
}

// --- Ch5: square 5_1..5_5 from ch3 ---
for (let i = 0; i < 5; i++) {
  const dest = `5_${i + 1}`;
  const src = CH5_SQUARE_SRC[i];
  const playable = copyMapFields(src, dest, CH5_SQUARE_THEMES[i]);
  const lv = byMapRef(dest);
  mergeLevelFields(lv, lv, {});
  lv.title = `斷線封鎖 · ${dest}`;
  lv.coverageGoal = 0.75 + i * 0.01;
  lv.timeLimit = playable;
  lv.commands = squareCommands();
  lv.initialSeed = `minefield-campaign-v1-L${32 + i + 1}-ch5-square`;
  if (i >= 2) {
    lv.digitOutposts =
      i === 2 ? [[5, 5]] : i === 3 ? [[4, 4], [7, 7]] : [[0, 1], [5, 5], [7, 7]];
  } else {
    delete lv.digitOutposts;
  }
  lv.rewards = {};
  console.log(`${dest} SQUARE from ${src} playable=${playable}`);
}

// Ch5 hex 5_6..5_8 (maps unchanged)
for (let k = 6; k <= 8; k++) {
  const lv = byMapRef(`5_${k}`);
  lv.title = `斷線封鎖 · 5_${k}`;
  lv.coverageGoal = 0.8;
  const playable = playableFromMapRef(`5_${k}`);
  lv.timeLimit = playable - 5;
  lv.commands = hexCommands();
  lv.rewards = {};
  lv.initialSeed = `minefield-campaign-v1-L${32 + k}-ch5-hex`;
}

// --- Ch6-9 hex -> square ---
const allShapes = { ...CH6_SHAPES, ...CH7_SHAPES };

for (const [destRef, srcRef] of Object.entries(HEX_TO_SQUARE_REF)) {
  const old = readJson(path.join(MAPS_DIR, `${destRef}.json`));
  const theme = old.mapTheme;
  let playable;
  const override = SQUARE_SHAPE_OVERRIDE[destRef];
  if (override && allShapes[override.shapeId]) {
    const doc = shapeToMapDoc({ ...allShapes[override.shapeId], theme: override.theme ?? theme });
    writeJson(path.join(MAPS_DIR, `${destRef}.json`), doc);
    playable = doc.gridStats.playableCells;
  } else {
    playable = copyMapFields(srcRef, destRef, theme);
  }
  const lv = byMapRef(destRef);
  const ch = Number(destRef.split('_')[0]);
  const jamming = lv.commandSlotReceiveJamming;
  if (ch === 7 && jamming) {
    lv.commands = { maxHand: 3, poolType: 'RANDOM', weights: { ...SQUARE_WEIGHTS } };
  } else {
    lv.commands = squareCommands();
  }
  lv.timeLimit = playable - 15;
  if (destRef === '7_5' && Array.isArray(lv.digitOutposts) && lv.digitOutposts.length > 0) {
    lv.digitOutposts = [[5, 7]];
  }
  if (destRef === '8_2' && Array.isArray(lv.blastPoints) && lv.blastPoints.length > 0) {
    lv.blastPoints = [
      { pos: [5, 6], countdownSec: 30, defuseBonusSec: 12 },
      { pos: [4, 4], countdownSec: 30, defuseBonusSec: 12 },
    ];
  }
  if (lv.rewards?.todo) lv.rewards = lv.rewards.todo ? {} : lv.rewards;
  console.log(`${destRef} -> SQUARE playable=${playable} timeLimit=${lv.timeLimit}`);
}

// Update _企劃欄位說明
const doc = levelsDoc._企劃欄位說明;
doc['timeLimit.chapter4'] =
  '第 4 章蜂巢戰線（chapter=4）：4_1～4_2 建議 timeLimit = playableCells（1:1）；4_3～4_8 建議 playableCells − 5。全章 HEXAGON，commands 僅 \"1\"～\"6\"。';
doc['timeLimit.chapter5'] =
  '第 5 章斷線封鎖（chapter=5）：5_1～5_5 方格建議 timeLimit = playableCells；5_6～5_8 六角建議 playableCells − 5。';
doc['digitOutposts.chapter4'] =
  '第 4 章：4_1～4_2 省略 digitOutposts；4_3～4_4 各 3 據點；4_5～4_8 各 4 據點（自原第 5 章遷入）。座標須落在可部署格。';
doc['commands.chapter6'] =
  '第 6～10 章：依 mapLayout.type——HEXAGON 僅 \"1\"～\"6\"（每章約 2～3 關）；SQUARE 為 \"1\"～\"8\"。六角建議 18/22/20/18/12/8；四方建議 8/14/22/22/14/10/7/3。';
delete doc['timeLimit.chapter5_old'];

writeJson(LEVELS_PATH, levelsDoc);
console.log('\nlevels.json updated');
