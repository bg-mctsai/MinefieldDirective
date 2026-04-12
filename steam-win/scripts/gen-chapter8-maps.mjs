/**
 * 第八章 maps/71～80.json：SQUARE + 剪影；從 levels.json 讀 blastPoints，8 鄰擴張併入可部署。
 * 執行（cwd = steam-win）：node scripts/gen-chapter8-maps.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  forbiddenFromPlayable,
  silhouettePlayable,
  ensureCellsInPlayable,
  key,
} from './lib/campaignSilhouettes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, '../renderer/src/levelData/maps');
const LEVELS_PATH = path.resolve(__dirname, '../renderer/src/levelData/levels.json');

const CH8_DIM = {
  71: [9, 9],
  72: [10, 9],
  73: [10, 10],
  74: [11, 10],
  75: [11, 11],
  76: [12, 10],
  77: [12, 11],
  78: [12, 11],
  79: [13, 11],
  80: [14, 12],
};

const THEMES = [
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

const { levels } = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8'));

function blastCells(levelId) {
  const lv = levels.find((l) => l.levelId === levelId);
  const pts = lv?.blastPoints ?? [];
  return pts.map((b) => b.pos);
}

for (let id = 71; id <= 80; id++) {
  const [W, H] = CH8_DIM[id];
  const blasts = blastCells(id);
  let playable = silhouettePlayable(id - 71, W, H);
  playable = ensureCellsInPlayable(W, H, playable, blasts);
  for (const [bx, by] of blasts) {
    if (!playable.has(key(bx, by))) {
      console.error(`L${id}: blast (${bx},${by}) not playable after expand`);
      process.exit(1);
    }
  }
  const forbidden = forbiddenFromPlayable(W, H, playable);
  const n = playable.size;
  const cov = 0.85;
  const k = 1.05;
  const time = Math.max(Math.round(n * cov * k), 70);
  const mapLayout = { type: 'SQUARE', width: W, height: H, forbiddenCells: forbidden };
  const outPath = path.join(MAPS_DIR, `${id}.json`);
  fs.writeFileSync(outPath, `${JSON.stringify({ mapLayout, mapTheme: THEMES[id - 71] }, null, 2)}\n`, 'utf8');
  console.log(`L${id} SQUARE ${W}×${H} playable=${n} blasts=${blasts.length} time~${time} ${THEMES[id - 71]}`);
}
