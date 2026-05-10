/**
 * 第十章 maps/91～100.json：剪影造型 + 可玩格數 100～200、據點／炸點／獎勵雷須可部署。
 * 執行（cwd = steam-win）：node scripts/gen-chapter10-maps.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  forbiddenFromPlayable,
  silhouettePlayableChapter10,
  ensureCellsInPlayable,
  key,
} from './lib/campaignSilhouettes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, '../renderer/src/levelData/maps');
const LEVELS_PATH = path.resolve(__dirname, '../renderer/src/levelData/levels.json');

const { levels } = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8').replace(/^\uFEFF/, ''));

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
  if (Array.isArray(lv.mineBonusTargetCells)) {
    for (const p of lv.mineBonusTargetCells) cells.push(p);
  }
  return cells;
}

function normSil(silBase) {
  return ((silBase % 8) + 8) % 8;
}

/**
 * 在邊界內搜尋 W×H，使剪影 + 據點／炸點 8 鄰擴張後可玩格數落在 [minPlay, maxPlay]。
 * 取面積 W*H 最小者，同面積取可玩格較少者（較緊湊）。
 */
function findBoardForSilhouette(silBase, need, minPlay = 100, maxPlay = 200) {
  const sil = normSil(silBase);
  let best = null;
  for (let W = 10; W <= 48; W++) {
    for (let H = 10; H <= 48; H++) {
      let playable = silhouettePlayableChapter10(sil, W, H);
      playable = ensureCellsInPlayable(W, H, playable, need);
      let ok = true;
      for (const [cx, cy] of need) {
        if (cx < 0 || cx >= W || cy < 0 || cy >= H || !playable.has(key(cx, cy))) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      const n = playable.size;
      if (n < minPlay || n > maxPlay) continue;
      const area = W * H;
      if (
        !best ||
        area < best.area ||
        (area === best.area && n < best.n) ||
        (area === best.area && n === best.n && W < best.W)
      ) {
        best = { W, H, playable, n, area, sil };
      }
    }
  }
  return best;
}

const CH10 = [
  { id: 91, type: 'SQUARE', sil: 0, theme: '終焉對角' },
  { id: 92, type: 'HEXAGON', sil: 1, theme: '三角雙工峽' },
  { id: 93, type: 'HEXAGON', sil: 2, theme: '鑰芯' },
  { id: 94, type: 'SQUARE', sil: 3, theme: '廢雷場' },
  { id: 95, type: 'SQUARE', sil: 4, theme: '干擾槽掃' },
  { id: 96, type: 'SQUARE', sil: 5, theme: '鄰焰三橫堤' },
  { id: 97, type: 'SQUARE', sil: 6, theme: '邊炸' },
  { id: 98, type: 'SQUARE', sil: 7, theme: '鑽石邊' },
  { id: 99, type: 'SQUARE', sil: 0, theme: '終章盤炸' },
  { id: 100, type: 'SQUARE', sil: 7, theme: '神之眼監視' },
];

for (const row of CH10) {
  const { id, type, sil: silBase, theme } = row;
  const need = constraintCells(id);
  const found = findBoardForSilhouette(silBase, need);
  if (!found) {
    console.error(`L${id}: no W×H with playable 100–200 for sil ${normSil(silBase)}`);
    process.exit(1);
  }
  const { W, H, playable, n, sil } = found;
  const forbidden = forbiddenFromPlayable(W, H, playable);
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
  console.log(`L${id} ${type} ${W}×${H} playable=${n} sil=${sil} constraints=${need.length} time~${time} ${theme}`);
}
