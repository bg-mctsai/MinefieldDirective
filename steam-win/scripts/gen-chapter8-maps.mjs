/**
 * 第八章 maps/71～80：第 7 章剪影「水平鏡像」+ 手調主題（可玩格 70～100），
 * SQUARE／TRIANGLE／HEXAGON 與 L61～L70 一一對應；炸點自動挑在 '#' 上並 8 鄰併入。
 * 同步 levels.json：gridSystem、weights、blastPoints.pos
 *
 * 執行（cwd = steam-win）：node scripts/gen-chapter8-maps.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { forbiddenFromPlayable, ensureCellsInPlayable, key } from './lib/campaignSilhouettes.mjs';
import { CH7_SHAPES } from './lib/ch7BitmapShapes.mjs';
import {
  mirrorRowsH,
  rowsBitmapToPlayable,
  pickBlastsFromHashRows,
  assertPlayableInBand,
} from './lib/campaignBitmapUtils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, '../renderer/src/levelData/maps');
const LEVELS_PATH = path.resolve(__dirname, '../renderer/src/levelData/levels.json');

/** 71～80 對應 L61～L70 鏡像幾何；主題改寫為引爆危機 */
const CH8_THEMES = [
  '餘韻盤',
  '引爆單核',
  '雙雷狹峰線',
  '壓折',
  '工炸區',
  '鑰孔三炸',
  '縱峽夾擊掃',
  '熱十',
  '強波堤',
  '章末鑽邊',
];

const WEIGHTS = {
  SQUARE_A: { 1: 10, 2: 14, 3: 18, 4: 18, 5: 14, 6: 10, 7: 8, 8: 4 },
  SQUARE_B: { 1: 8, 2: 12, 3: 18, 4: 18, 5: 16, 6: 12, 7: 8, 8: 4 },
  SQUARE_C: { 1: 8, 2: 12, 3: 16, 4: 18, 5: 16, 6: 12, 7: 10, 8: 6 },
  SQUARE_D: { 1: 6, 2: 10, 3: 16, 4: 18, 5: 18, 6: 14, 7: 10, 8: 6 },
  TRIANGLE: { 1: 28, 2: 34, 3: 38 },
  HEXAGON: { 1: 18, 2: 22, 3: 20, 4: 18, 5: 12, 6: 8 },
};

function weightsForLevel(id, type) {
  if (type === 'TRIANGLE') return WEIGHTS.TRIANGLE;
  if (type === 'HEXAGON') return WEIGHTS.HEXAGON;
  if (id <= 75) return WEIGHTS.SQUARE_A;
  if (id <= 78) return WEIGHTS.SQUARE_B;
  if (id === 79) return WEIGHTS.SQUARE_C;
  return WEIGHTS.SQUARE_D;
}

function stringifyWeights(w) {
  const o = {};
  for (const [k, v] of Object.entries(w)) o[String(k)] = v;
  return o;
}

const levelsDoc = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8').replace(/^\uFEFF/, ''));

for (let i = 0; i < 10; i++) {
  const id = 71 + i;
  const srcId = 61 + i;
  const src = CH7_SHAPES[srcId];
  const rows = mirrorRowsH(src.rows);
  const type = src.grid;
  const theme = CH8_THEMES[i];

  let { W, H, playable } = rowsBitmapToPlayable(rows);
  if (W !== src.W || H !== src.H) {
    console.error(`L${id}: W,H mismatch src ${src.W}×${src.H} vs bitmap ${W}×${H}`);
    process.exit(1);
  }

  const lv = levelsDoc.levels.find((l) => l.levelId === id);
  const blastCount = lv?.blastPoints?.length ?? 0;
  const blasts = pickBlastsFromHashRows(rows, blastCount);

  playable = ensureCellsInPlayable(W, H, playable, blasts);
  for (const [bx, by] of blasts) {
    if (!playable.has(key(bx, by))) {
      console.error(`L${id}: blast (${bx},${by}) not playable`);
      process.exit(1);
    }
  }

  assertPlayableInBand(id, playable.size);

  const forbidden = forbiddenFromPlayable(W, H, playable);
  const mapLayout =
    type === 'SQUARE'
      ? { type: 'SQUARE', width: W, height: H, forbiddenCells: forbidden }
      : { type, placeholder: { width: W, height: H }, forbiddenCells: forbidden };

  fs.writeFileSync(
    path.join(MAPS_DIR, `${id}.json`),
    `${JSON.stringify({ mapLayout, mapTheme: theme }, null, 2)}\n`,
    'utf8',
  );

  if (lv) {
    lv.gridSystem = type;
    lv.commands = lv.commands ?? {};
    lv.commands.weights = stringifyWeights(weightsForLevel(id, type));
    const bps = lv.blastPoints ?? [];
    if (bps.length !== blasts.length) {
      console.error(`L${id}: blastPoints count ${bps.length} !== picked ${blasts.length}`);
      process.exit(1);
    }
    for (let j = 0; j < blasts.length; j++) {
      bps[j].pos = [...blasts[j]];
    }
  }

  console.log(`L${id} ${type} ${W}×${H} mirror(L${srcId}) playable=${playable.size} blasts=${blasts.length} ${theme}`);
}

fs.writeFileSync(LEVELS_PATH, `${JSON.stringify(levelsDoc, null, 2)}\n`, 'utf8');
console.log('\ngridSystem / blast pos / weights synced → levels.json');
