/**
 * 第九章 maps/81～90.json：依關卡 SQUARE／TRIANGLE／HEXAGON + mapTheme + 剪影。
 * 執行（cwd = steam-win）：node scripts/gen-chapter9-maps.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { forbiddenFromPlayable, silhouettePlayable, fullBoard } from './lib/campaignSilhouettes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, '../renderer/src/levelData/maps');

/** id → type, W, H, 剪影相位（與第四章 8 種循環） */
const CH9 = [
  { id: 81, type: 'SQUARE', W: 14, H: 14, sil: 0, theme: '八章終戰盤' },
  { id: 82, type: 'TRIANGLE', W: 12, H: 10, sil: 1, theme: '外環' },
  { id: 83, type: 'HEXAGON', W: 10, H: 10, sil: 2, theme: '鄰工區' },
  { id: 84, type: 'SQUARE', W: 17, H: 17, sil: 3, theme: '蜂巢鄰鑰' },
  { id: 85, type: 'TRIANGLE', W: 13, H: 11, sil: 4, theme: '大十熱芯盤' },
  { id: 86, type: 'HEXAGON', W: 11, H: 11, sil: 5, theme: '縱峽' },
  { id: 87, type: 'SQUARE', W: 17, H: 17, sil: 6, theme: '六雙堤' },
  { id: 88, type: 'TRIANGLE', W: 14, H: 12, sil: 7, theme: '鄰焰深鑽' },
  { id: 89, type: 'HEXAGON', W: 12, H: 12, sil: 0, theme: '三角方環巢' },
  { id: 90, type: 'SQUARE', W: 15, H: 20, sil: 1, theme: '六閃' },
];

for (const row of CH9) {
  const { id, type, W, H, sil, theme } = row;
  let playable = silhouettePlayable(sil + (id % 2), W, H);
  if (playable.size < 28 && type !== 'SQUARE') {
    playable = silhouettePlayable(sil, W, H);
    if (playable.size < 22) playable = fullBoard(W, H);
  }
  const forbidden = forbiddenFromPlayable(W, H, playable);
  const n = playable.size;
  const cov = 0.85;
  const k = 1.04;
  const time = Math.max(Math.round(n * cov * k), 75);
  let mapLayout;
  if (type === 'SQUARE') {
    mapLayout = { type: 'SQUARE', width: W, height: H, forbiddenCells: forbidden };
  } else {
    mapLayout = { type, placeholder: { width: W, height: H }, forbiddenCells: forbidden };
  }
  const outPath = path.join(MAPS_DIR, `${id}.json`);
  fs.writeFileSync(outPath, `${JSON.stringify({ mapLayout, mapTheme: theme }, null, 2)}\n`, 'utf8');
  console.log(`L${id} ${type} ${W}×${H} playable=${n} time~${time} ${theme}`);
}
