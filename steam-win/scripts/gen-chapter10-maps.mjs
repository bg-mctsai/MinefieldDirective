/**
 * 第十章 maps/91～100.json：據點／炸點／必雷座標須可部署；L100 僅加 mapTheme、保留幾何。
 * 執行（cwd = steam-win）：node scripts/gen-chapter10-maps.mjs
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

const { levels } = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8'));

function constraintCells(levelId) {
  const lv = levels.find((l) => l.levelId === levelId);
  if (!lv) return [];
  const cells = [];
  if (Array.isArray(lv.digitOutposts)) {
    for (const p of lv.digitOutposts) cells.push(p);
  }
  if (Array.isArray(lv.blastPoints)) {
    for (const b of lv.blastPoints) cells.push(b.pos);
  }
  if (Array.isArray(lv.forcedMineCells)) {
    for (const p of lv.forcedMineCells) cells.push(p);
  }
  return cells;
}

const CH10 = [
  { id: 91, type: 'SQUARE', W: 12, H: 12, sil: 0, theme: '終焉對角' },
  { id: 92, type: 'TRIANGLE', W: 13, H: 11, sil: 1, theme: '三角雙工峽' },
  { id: 93, type: 'HEXAGON', W: 11, H: 11, sil: 2, theme: '鑰芯' },
  { id: 94, type: 'SQUARE', W: 13, H: 12, sil: 3, theme: '廢雷場' },
  { id: 95, type: 'SQUARE', W: 14, H: 12, sil: 4, theme: '干擾槽掃' },
  { id: 96, type: 'SQUARE', W: 14, H: 12, sil: 5, theme: '鄰焰三橫堤' },
  { id: 97, type: 'SQUARE', W: 15, H: 12, sil: 6, theme: '邊炸' },
  { id: 98, type: 'SQUARE', W: 15, H: 13, sil: 7, theme: '鑽石邊' },
  { id: 99, type: 'SQUARE', W: 16, H: 14, sil: 0, theme: '終章盤炸' },
];

for (const row of CH10) {
  const { id, type, W, H, sil, theme } = row;
  const need = constraintCells(id);
  let playable = silhouettePlayable(sil + (id % 2), W, H);
  playable = ensureCellsInPlayable(W, H, playable, need);
  for (const [cx, cy] of need) {
    if (cx < 0 || cx >= W || cy < 0 || cy >= H) {
      console.error(`L${id}: constraint (${cx},${cy}) out of bounds`);
      process.exit(1);
    }
    if (!playable.has(key(cx, cy))) {
      console.error(`L${id}: constraint (${cx},${cy}) not playable`);
      process.exit(1);
    }
  }
  const forbidden = forbiddenFromPlayable(W, H, playable);
  const n = playable.size;
  const cov = levels.find((l) => l.levelId === id)?.coverageGoal ?? 0.88;
  const k = 1.02;
  const time = Math.max(Math.round(n * cov * k), 80);
  let mapLayout;
  if (type === 'SQUARE') {
    mapLayout = { type: 'SQUARE', width: W, height: H, forbiddenCells: forbidden };
  } else {
    mapLayout = { type, placeholder: { width: W, height: H }, forbiddenCells: forbidden };
  }
  const outPath = path.join(MAPS_DIR, `${id}.json`);
  fs.writeFileSync(outPath, `${JSON.stringify({ mapLayout, mapTheme: theme }, null, 2)}\n`, 'utf8');
  console.log(`L${id} ${type} ${W}×${H} playable=${n} constraints=${need.length} time~${time} ${theme}`);
}

const p100 = path.join(MAPS_DIR, '100.json');
const j100 = JSON.parse(fs.readFileSync(p100, 'utf8'));
j100.mapTheme = '神之眼監視';
fs.writeFileSync(p100, `${JSON.stringify(j100, null, 2)}\n`, 'utf8');
console.log('L100 mapTheme set (geometry unchanged)');
