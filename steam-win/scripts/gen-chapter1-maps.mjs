/**
 * 第一章 maps/1～10.json：訓練營——僅 SQUARE 全幅矩形，無 forbiddenCells。
 * 格數 25→80 嚴格遞增、不超過 80；關卡選擇主題見 mapTheme。
 *
 * 與 levels.json 第一章 timeLimit 對齊方式（企劃手動或另行腳本寫回）：
 * - 基準秒數 ≈ round((格數 / 2) * 1.6)（平均每 2 格 1.6 秒）
 * - 第 1 關額外 +20 秒，線性降到第 10 關 +0：round(20 * (10 - levelId) / 9)
 *
 * 執行（cwd = steam-win）：node scripts/gen-chapter1-maps.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, '../renderer/src/levelData/maps');

/** 格數 25～80 遞增；簡單長方形／正方形 */
const LEVELS = [
    { id: 1, W: 5, H: 5, cells: 25, theme: '新兵訓練' },
  { id: 2, W: 5, H: 6, cells: 30, theme: '長條' },
  { id: 3, W: 5, H: 7, cells: 35, theme: '橫展區' },
  { id: 4, W: 5, H: 8, cells: 40, theme: '穩定節奏' },
  { id: 5, W: 5, H: 9, cells: 45, theme: '長廊掃描道' },
  { id: 6, W: 5, H: 10, cells: 50, theme: '寬道' },
  { id: 7, W: 7, H: 8, cells: 56, theme: '主練場' },
  { id: 8, W: 7, H: 9, cells: 63, theme: '加深演練' },
  { id: 9, W: 8, H: 9, cells: 72, theme: '終段加長區' },
  { id: 10, W: 8, H: 10, cells: 80, theme: '章操' },
];

function suggestedTimeLimit(levelId, cells) {
  const base = Math.round((cells / 2) * 1.6);
  const bonus = Math.round((20 * (10 - levelId)) / 9);
  return base + bonus;
}

for (const row of LEVELS) {
  const { id, W, H, cells, theme } = row;
  if (W * H !== cells) throw new Error(`L${id}: W*H !== cells`);
  const mapLayout = { type: 'SQUARE', width: W, height: H };
  const outPath = path.join(MAPS_DIR, `${id}.json`);
  fs.writeFileSync(outPath, `${JSON.stringify({ mapLayout, mapTheme: theme }, null, 2)}\n`, 'utf8');
  const t = suggestedTimeLimit(id, cells);
  console.log(`L${id} ${W}×${H} cells=${cells} timeLimit≈${t}s — ${theme}`);
}
