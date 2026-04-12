/**
 * 第 5～7 章 maps/41～70.json：HEXAGON + placeholder + forbiddenCells + mapTheme。
 * 尺寸階梯同 ch4MapLayout CH4_TRIANGLE_LAYOUTS；第 6、7 章 layout 相位與第 5 章錯開。
 * 執行（cwd = steam-win）：node scripts/gen-chapter5-7-hex-maps.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CH4_TRIANGLE_LAYOUTS,
  forbiddenFromPlayable,
  fullBoard,
  silhouettePlayable,
} from './lib/campaignSilhouettes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, '../renderer/src/levelData/maps');

const THEMES5 = [
  '蜂巢初鳴台',
  '熟成',
  '雷溝線',
  '工字窄腰',
  '觀測前哨脊',
  '匯流',
  '掃頻巷',
  '干擾翼堤',
  '雙翼干擾堤',
  '共振',
];

const THEMES6 = [
  '蜂巢面',
  '相位滿一',
  '相位移二號',
  '溝閃',
  '樑谷區',
  '鑰孔狹隘',
  '十字分水隘',
  '縱掃',
  '雙橫堤',
  '鑽石切面',
];

const THEMES7 = [
  '方環終曲場',
  '干甲',
  '干擾乙',
  '閃電折返',
  '工承窄腰區',
  '鑰滿',
  '熱十字',
  '縱峽深槽',
  '雙橫相位帶',
  '邊帶',
];

function layoutIndexAndSil(id) {
  if (id <= 50) {
    const li = id - 41;
    if (id <= 42) return { li, full: true, sil: 0 };
    return { li, full: false, sil: id - 43 };
  }
  if (id <= 60) {
    const li = (id - 51 + 3) % 10;
    if (id <= 52) return { li, full: true, sil: 0 };
    return { li, full: false, sil: id - 53 };
  }
  const li = (id - 61 + 6) % 10;
  if (id <= 62) return { li, full: true, sil: 0 };
  return { li, full: false, sil: id - 63 };
}

function themeFor(id) {
  if (id <= 50) return THEMES5[id - 41];
  if (id <= 60) return THEMES6[id - 51];
  return THEMES7[id - 61];
}

for (let id = 41; id <= 70; id++) {
  const { li, full, sil } = layoutIndexAndSil(id);
  const { width: W, height: H } = CH4_TRIANGLE_LAYOUTS[li];
  const playable = full ? fullBoard(W, H) : silhouettePlayable(sil, W, H);
  const forbidden = forbiddenFromPlayable(W, H, playable);
  const n = playable.size;
  const cov = 0.8;
  const k = 1.08;
  const time = Math.max(id === 41 ? 72 : 0, Math.round(n * cov * k), 55);
  const mapLayout = {
    type: 'HEXAGON',
    placeholder: { width: W, height: H },
    forbiddenCells: forbidden,
  };
  const outPath = path.join(MAPS_DIR, `${id}.json`);
  fs.writeFileSync(outPath, `${JSON.stringify({ mapLayout, mapTheme: themeFor(id) }, null, 2)}\n`, 'utf8');
  console.log(`L${id} HEX ${W}×${H} playable=${n} forbidden=${forbidden.length} time~${time} ${themeFor(id)}`);
}
