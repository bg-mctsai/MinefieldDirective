/**
 * 第九章 maps/81～90：第 6 章剪影水平鏡像（81～89）+ L70 指揮塔鏡像（90），
 * 可玩格 70～100；主題為鄰焰共振；幾何順序 SQ／TRI／HEX 與原章節設計一致。
 *
 * 執行（cwd = steam-win）：node scripts/gen-chapter9-maps.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { forbiddenFromPlayable } from './lib/campaignSilhouettes.mjs';
import { CH6_SHAPES } from './lib/ch6BitmapShapes.mjs';
import { CH7_SHAPES } from './lib/ch7BitmapShapes.mjs';
import { mirrorRowsH, rowsBitmapToPlayable, assertPlayableInBand } from './lib/campaignBitmapUtils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, '../renderer/src/levelData/maps');

/** { ch6|ch7, srcId, theme } — 鏡像後與第 6／7 章原圖左右對稱，造型不同 */
const CH9_PLAN = [
  { id: 81, src: 'ch6', srcId: 53, theme: '鄰焰前哨·鯊鰭鏡像' },
  { id: 82, src: 'ch6', srcId: 52, theme: '三角收束·海星鏡像' },
  { id: 83, src: 'ch6', srcId: 51, theme: '六角共鳴·水母鏡像' },
  { id: 84, src: 'ch6', srcId: 56, theme: '深潛方陣·鏡像' },
  { id: 85, src: 'ch6', srcId: 54, theme: '三叉熱線·鏡像' },
  { id: 86, src: 'ch6', srcId: 55, theme: '蟹鉗巢·鏡像' },
  { id: 87, src: 'ch6', srcId: 58, theme: '渦環堤·鏡像' },
  { id: 88, src: 'ch6', srcId: 59, theme: '珊瑚扇·鏡像' },
  { id: 89, src: 'ch6', srcId: 57, theme: '龜甲巢·鏡像' },
  { id: 90, src: 'ch7', srcId: 70, theme: '共振塔·指揮鏡像' },
];

function shapeFrom(plan) {
  if (plan.src === 'ch7') return CH7_SHAPES[plan.srcId];
  return CH6_SHAPES[plan.srcId];
}

for (const plan of CH9_PLAN) {
  const { id, theme } = plan;
  const src = shapeFrom(plan);
  const rows = mirrorRowsH(src.rows);
  const type = src.grid;

  const { W, H, playable } = rowsBitmapToPlayable(rows);
  if (W !== src.W || H !== src.H) {
    console.error(`L${id}: W,H mismatch src ${src.W}×${src.H}`);
    process.exit(1);
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
  console.log(`L${id} ${type} ${W}×${H} playable=${playable.size} ${theme}`);
}
