/**
 * 第 4 章 maps/4_1～4_8：僅重寫 levelData/maps/4_*.json（HEXAGON + forbiddenCells + mapTheme + gridStats）。
 *
 * 關卡級設定（timeLimit、coverageGoal、commands、digitOutposts、title）請在
 * renderer/src/levelData/levels.json 手動維護——本腳本不覆寫該檔。
 * 改圖後請對齊：timeLimit ≈ playableCells+10、據點僅 4_5～4_8、commands 1～6 等（見 levels.json _企劃欄位說明）。
 *
 * 執行（cwd = steam-win）：node scripts/gen-chapter4-hex-maps.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { forbiddenFromPlayable, key } from './lib/campaignSilhouettes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, '../renderer/src/levelData/maps');

/**
 * 目標可玩：50, 57, 65, 73, 80, 87, 94, 100
 */
const LEVEL_SPECS = [
  { W: 10, H: 5, forbidden: [] },
  {
    W: 9,
    H: 7,
    forbidden: [
      [4, 1],
      [4, 2],
      [4, 3],
      [0, 0],
      [8, 0],
      [0, 6],
    ],
  },
  {
    W: 10,
    H: 7,
    forbidden: [
      [3, 3],
      [4, 3],
      [5, 3],
      [4, 4],
      [4, 5],
    ],
  },
  {
    W: 11,
    H: 7,
    forbidden: [
      [5, 0],
      [5, 1],
      [5, 2],
      [5, 3],
    ],
  },
  { W: 10, H: 8, forbidden: [] },
  {
    W: 10,
    H: 9,
    forbidden: [
      [4, 4],
      [5, 4],
      [6, 4],
    ],
  },
  {
    W: 11,
    H: 9,
    forbidden: [
      [5, 2],
      [5, 3],
      [5, 4],
      [5, 5],
      [5, 6],
    ],
  },
  { W: 10, H: 10, forbidden: [] },
];

const MAP_THEMES = [
  '蜂格初陣',
  '巢面展開',
  '閃蜂溝',
  '工峽蜂巢',
  '匙孔巢區',
  '分水巢脊',
  '窄巢縱谷',
  '雙堤蜂線',
];

const TARGET_PLAYABLE = [50, 57, 65, 73, 80, 87, 94, 100];

function playableSetFromSpec(W, H, forbidden) {
  const forb = new Set(forbidden.map(([x, y]) => key(x, y)));
  const play = new Set();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!forb.has(key(x, y))) play.add(key(x, y));
    }
  }
  return play;
}

for (let mi = 0; mi < 8; mi++) {
  const spec = LEVEL_SPECS[mi];
  const { W, H, forbidden: fcIn } = spec;
  const playableSet = playableSetFromSpec(W, H, fcIn);
  const playableCells = playableSet.size;
  if (playableCells !== TARGET_PLAYABLE[mi]) {
    throw new Error(`4_${mi + 1}: playable ${playableCells} !== target ${TARGET_PLAYABLE[mi]}`);
  }
  const forbiddenCells = forbiddenFromPlayable(W, H, playableSet);
  const totalCells = W * H;

  const mapRef = `4_${mi + 1}`;
  const json = {
    mapLayout: {
      type: 'HEXAGON',
      placeholder: { width: W, height: H },
      forbiddenCells,
    },
    mapTheme: MAP_THEMES[mi],
    gridStats: {
      totalCells,
      forbiddenCellCount: forbiddenCells.length,
      playableCells,
    },
  };
  fs.writeFileSync(path.join(MAPS_DIR, `${mapRef}.json`), `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  console.log(`${mapRef}: playable=${playableCells} （請在 levels.json 對齊 timeLimit 等）`);
}

console.log('\n僅已更新 maps/4_1～4_8.json；levels.json 請手動維護。');
