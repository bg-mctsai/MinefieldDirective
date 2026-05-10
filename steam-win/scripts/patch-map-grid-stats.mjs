/**
 * 一次性／維護用：為 levelData/maps/*.json 寫入 gridStats，並可選更新指定 mapRef 的 mapTheme。
 * 執行：node scripts/patch-map-grid-stats.mjs（cwd = steam-win）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mapsDir = path.resolve(__dirname, '../renderer/src/levelData/maps');

function cellsKey(x, y) {
  return `${x},${y}`;
}

function dedupe(c) {
  const seen = new Set();
  const out = [];
  for (const { x, y } of c) {
    const k = cellsKey(x, y);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ x, y });
  }
  return out;
}

function diamondCells(radius) {
  const size = radius * 2 + 1;
  const cells = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (Math.abs(x - radius) + Math.abs(y - radius) <= radius) cells.push({ x, y });
    }
  }
  return cells;
}

function mixedSectorCells(sector) {
  const [w, h] = sector.size;
  const ox = sector.offset.x;
  const oy = sector.offset.y;
  const out = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      out.push({ x: ox + x, y: oy + y });
    }
  }
  return out;
}

function crossCells(width, height) {
  const cells = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const midX = (width - 1) / 2;
      const midY = (height - 1) / 2;
      const arm = 1;
      if ((x >= midX - arm && x <= midX + arm) || (y >= midY - arm && y <= midY + arm)) {
        cells.push({ x, y });
      }
    }
  }
  return cells;
}

function defaultCrossCells11() {
  const width = 11;
  const height = 11;
  const cells = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if ((x >= 4 && x <= 6) || (y >= 4 && y <= 6)) cells.push({ x, y });
    }
  }
  return cells;
}

function gridStatsFromLayout(layout) {
  switch (layout.type) {
    case 'SQUARE': {
      const w = layout.width;
      const h = layout.height;
      const total = w * h;
      const f = (layout.forbiddenCells ?? []).length;
      return { totalCells: total, forbiddenCellCount: f, playableCells: total - f };
    }
    case 'HEXAGON': {
      const w = layout.placeholder.width;
      const h = layout.placeholder.height;
      const total = w * h;
      const f = (layout.forbiddenCells ?? []).length;
      return { totalCells: total, forbiddenCellCount: f, playableCells: total - f };
    }
    case 'DIAMOND': {
      const p = diamondCells(layout.radius);
      return { totalCells: p.length, forbiddenCellCount: 0, playableCells: p.length };
    }
    case 'MIXED': {
      const all = [];
      for (const s of layout.sectors) {
        all.push(...mixedSectorCells(s));
      }
      const p = dedupe(all);
      return { totalCells: p.length, forbiddenCellCount: 0, playableCells: p.length };
    }
    case 'CROSS': {
      const w = layout.width;
      const h = layout.height;
      const total = w * h;
      const play =
        w === 11 && h === 11 ? defaultCrossCells11().length : crossCells(w, h).length;
      return { totalCells: total, forbiddenCellCount: total - play, playableCells: play };
    }
    default:
      return null;
  }
}

/** 第二章：城內場景短名（mapTheme） */
const chapter2UrbanTheme = {
  '2_1': '防火窄巷',
  '2_2': '圓環路口',
  '2_3': '高架陰影',
  '2_4': '車站柱廊',
  '2_5': '商場天井',
  '2_6': '工地圍籬',
  '2_7': '十字街口',
  '2_8': '環島廣場',
};

const files = fs.readdirSync(mapsDir).filter((f) => f.endsWith('.json')).sort();
let n = 0;
for (const f of files) {
  const fp = path.join(mapsDir, f);
  const j = JSON.parse(fs.readFileSync(fp, 'utf8'));
  if (!j.mapLayout) continue;
  const g = gridStatsFromLayout(j.mapLayout);
  if (g) j.gridStats = g;
  const base = f.replace(/\.json$/, '');
  if (chapter2UrbanTheme[base]) {
    j.mapTheme = chapter2UrbanTheme[base];
  }
  fs.writeFileSync(fp, `${JSON.stringify(j, null, 2)}\n`);
  n++;
}
console.log(`patch-map-grid-stats: updated ${n} files under maps/`);
