/**
 * 第九章 maps/9_1～9_8：專用方格剪影（全戰役唯一，非第 6 章鏡像）；
 * 可玩格 70～100；主題為鄰焰共振。
 *
 * 執行（cwd = steam-win）：node scripts/gen-chapter9-maps.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { forbiddenFromPlayable } from './lib/campaignSilhouettes.mjs';
import { CH9_SHAPES } from './lib/ch9BitmapShapes.mjs';
import { rowsBitmapToPlayable, assertPlayableInBand } from './lib/campaignBitmapUtils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, '../renderer/src/levelData/maps');

function gridStats(W, H, forbiddenCount) {
  const total = W * H;
  return { totalCells: total, forbiddenCellCount: forbiddenCount, playableCells: total - forbiddenCount };
}

function forbiddenSignature(forbidden) {
  return JSON.stringify(forbidden.sort((a, b) => a[0] - b[0] || a[1] - b[1]));
}

/** 既有戰役地圖禁格指紋（略過本次覆寫的 9_*） */
function loadExistingForbiddenSigs(skipRefs) {
  const sigs = new Map();
  for (const f of fs.readdirSync(MAPS_DIR)) {
    if (!f.endsWith('.json') || f.startsWith('_')) continue;
    const ref = f.replace('.json', '');
    if (skipRefs.has(ref)) continue;
    const doc = JSON.parse(fs.readFileSync(path.join(MAPS_DIR, f), 'utf8'));
    const fc = doc.mapLayout?.forbiddenCells;
    if (!fc) continue;
    const sig = forbiddenSignature(fc);
    if (!sigs.has(sig)) sigs.set(sig, []);
    sigs.get(sig).push(ref);
  }
  return sigs;
}

const skipRefs = new Set(Object.keys(CH9_SHAPES));
const existingSigs = loadExistingForbiddenSigs(skipRefs);

for (const [mapRef, shape] of Object.entries(CH9_SHAPES)) {
  const { W, H, rows, theme } = shape;
  if (!theme) {
    console.error(`${mapRef}: missing theme`);
    process.exit(1);
  }

  const { playable } = rowsBitmapToPlayable(rows);
  assertPlayableInBand(mapRef, playable.size);

  const forbidden = forbiddenFromPlayable(W, H, playable);
  const sig = forbiddenSignature(forbidden);
  const clash = existingSigs.get(sig);
  if (clash) {
    console.error(`${mapRef}: geometry duplicates ${clash.join(', ')}`);
    process.exit(1);
  }
  existingSigs.set(sig, [mapRef]);

  const mapLayout = { type: 'SQUARE', width: W, height: H, forbiddenCells: forbidden };
  const doc = {
    mapLayout,
    mapTheme: theme,
    gridStats: gridStats(W, H, forbidden.length),
  };

  fs.writeFileSync(path.join(MAPS_DIR, `${mapRef}.json`), `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
  console.log(`${mapRef} SQUARE ${W}×${H} playable=${playable.size} ${theme}`);
}
