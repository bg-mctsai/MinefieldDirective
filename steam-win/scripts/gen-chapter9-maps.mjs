/**
 * 第九章 maps/9_1～9_8：第 6 章剪影水平鏡像，全章 SQUARE；
 * 可玩格 70～100；主題為鄰焰共振。
 *
 * 執行（cwd = steam-win）：node scripts/gen-chapter9-maps.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { forbiddenFromPlayable } from './lib/campaignSilhouettes.mjs';
import { CH6_SHAPES } from './lib/ch6BitmapShapes.mjs';
import { mirrorRowsH, rowsBitmapToPlayable, assertPlayableInBand } from './lib/campaignBitmapUtils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, '../renderer/src/levelData/maps');

/** mapRef, ch6 srcId, theme — 鏡像後與第 6 章原圖左右對稱 */
const CH9_PLAN = [
  { mapRef: '9_1', srcId: 53, theme: '鄰焰前哨·鯊鰭鏡像' },
  { mapRef: '9_2', srcId: 52, theme: '三角收束·海星鏡像' },
  { mapRef: '9_3', srcId: 51, theme: '六角共鳴·水母鏡像' },
  { mapRef: '9_4', srcId: 56, theme: '深潛方陣·鏡像' },
  { mapRef: '9_5', srcId: 54, theme: '三叉熱線·鏡像' },
  { mapRef: '9_6', srcId: 55, theme: '蟹鉗巢·鏡像' },
  { mapRef: '9_7', srcId: 58, theme: '渦環堤·鏡像' },
  { mapRef: '9_8', srcId: 59, theme: '珊瑚扇·鏡像' },
];

function gridStats(W, H, forbiddenCount) {
  const total = W * H;
  return { totalCells: total, forbiddenCellCount: forbiddenCount, playableCells: total - forbiddenCount };
}

for (const plan of CH9_PLAN) {
  const { mapRef, srcId, theme } = plan;
  const src = CH6_SHAPES[srcId];
  const rows = mirrorRowsH(src.rows);

  const { W, H, playable } = rowsBitmapToPlayable(rows);
  if (W !== src.W || H !== src.H) {
    console.error(`${mapRef}: W,H mismatch src ${src.W}×${src.H}`);
    process.exit(1);
  }
  assertPlayableInBand(mapRef, playable.size);

  const forbidden = forbiddenFromPlayable(W, H, playable);
  const mapLayout = { type: 'SQUARE', width: W, height: H, forbiddenCells: forbidden };
  const doc = {
    mapLayout,
    mapTheme: theme,
    gridStats: gridStats(W, H, forbidden.length),
  };

  fs.writeFileSync(path.join(MAPS_DIR, `${mapRef}.json`), `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
  console.log(`${mapRef} SQUARE ${W}×${H} playable=${playable.size} ${theme}`);
}
