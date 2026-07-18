/**
 * 第二章 maps/2_1～2_8.json：巷戰都市剪影（SQUARE + forbiddenCells），彼此形狀可辨。
 * 同步 levels.json：
 *   - chapter 2（levelId 9～16）：timeLimit = playable + 2
 *   - chapter 3 後段复用 2_5～2_8（levelId 21～24）：重選 digitOutposts、timeLimit = playable
 *
 * 執行（cwd = steam-win）：node scripts/gen-chapter2-maps.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MAPS_DIR = path.resolve(__dirname, '../renderer/src/levelData/maps');
const LEVELS_PATH = path.join(ROOT, 'renderer/src/levelData/levels.json');

const key = (x, y) => `${x},${y}`;

function forbiddenFromPlayable(W, H, playable) {
  const p = new Set(playable.map(([x, y]) => key(x, y)));
  const forbidden = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!p.has(key(x, y))) forbidden.push([x, y]);
    }
  }
  return forbidden;
}

function uniqCells(cells) {
  return [...new Set(cells.map(([x, y]) => key(x, y)))].map((k) => k.split(',').map(Number));
}

function addRect(s, x0, y0, x1, y1, W, H) {
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
      s.add(key(x, y));
    }
  }
}

/** 2_1 防火窄巷：細長直巷 + 兩處橫岔，無底座框 */
function playable_2_1() {
  const W = 11;
  const H = 15;
  const s = new Set();
  // 主巷寬 3
  addRect(s, 4, 0, 6, H - 1, W, H);
  // 北岔、南岔
  addRect(s, 0, 3, 3, 5, W, H);
  addRect(s, 7, 9, 10, 11, W, H);
  // 頭尾略加寬（消防回頭空間）
  addRect(s, 3, 0, 7, 1, W, H);
  addRect(s, 3, H - 2, 7, H - 1, W, H);
  return { W, H, p: uniqCells([...s].map((k) => k.split(',').map(Number))) };
}

/** 2_2 圓環路口：近似圓環（歐氏）+ 南向幹道，中空明顯 */
function playable_2_2() {
  const W = 13;
  const H = 13;
  const cx = 6;
  const cy = 6;
  const p = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const r = Math.hypot(x - cx, y - cy);
      const ring = r >= 3.2 && r <= 5.8;
      const spoke = Math.abs(x - cx) <= 1 && y >= cy && y <= cy + 5;
      if (ring || spoke) p.push([x, y]);
    }
  }
  return { W, H, p: uniqCells(p) };
}

/** 2_3 高架陰影：主斜帶 + 平行副影 */
function playable_2_3() {
  const W = 13;
  const H = 13;
  const p = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const main = Math.abs(x - y) <= 2;
      const shadow = Math.abs(x - y - 5) <= 1;
      if (main || shadow) p.push([x, y]);
    }
  }
  return { W, H, p: uniqCells(p) };
}

/** 2_4 車站柱廊：三道縱廊 + 頂底月台連通 */
function playable_2_4() {
  const W = 13;
  const H = 12;
  const s = new Set();
  for (const [x0, x1] of [
    [1, 2],
    [5, 7],
    [10, 11],
  ]) {
    addRect(s, x0, 1, x1, 10, W, H);
  }
  // 頂／底月台把三廊串起來
  addRect(s, 1, 0, 11, 1, W, H);
  addRect(s, 1, 10, 11, 11, W, H);
  return { W, H, p: uniqCells([...s].map((k) => k.split(',').map(Number))) };
}

/** 2_5 商場天井：外框走道（厚 2）+ 一道過廊，中空天井禁佈 */
function playable_2_5() {
  const W = 14;
  const H = 14;
  const p = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const frame = x <= 1 || x >= W - 2 || y <= 1 || y >= H - 2;
      const bridge = y >= 6 && y <= 7 && x >= 2 && x <= W - 3;
      if (frame || bridge) p.push([x, y]);
    }
  }
  return { W, H, p: uniqCells(p) };
}

/** 2_6 工地圍籬：階梯鋸齒邊界（梯形工區） */
function playable_2_6() {
  const W = 13;
  const H = 13;
  const p = [];
  for (let y = 0; y < H; y++) {
    // 左緣階梯、右緣反向階梯 → 上窄下寬
    const left = Math.max(0, 4 - Math.floor(y / 2));
    const right = Math.min(W - 1, 8 + Math.floor(y / 2));
    for (let x = left; x <= right; x++) {
      // 內部挖兩道禁佈溝當圍籬縫
      const seam = (y >= 3 && y <= 5 && x >= 5 && x <= 7) || (y >= 8 && y <= 9 && x >= 3 && x <= 4);
      if (!seam) p.push([x, y]);
    }
  }
  return { W, H, p: uniqCells(p) };
}

/** 2_7 十字街口：真十字幹道（臂寬 3），末端略加寬 */
function playable_2_7() {
  const W = 13;
  const H = 13;
  const s = new Set();
  addRect(s, 5, 0, 7, 12, W, H);
  addRect(s, 0, 5, 12, 7, W, H);
  // 四端路口加寬
  addRect(s, 4, 0, 8, 1, W, H);
  addRect(s, 4, 11, 8, 12, W, H);
  addRect(s, 0, 4, 1, 8, W, H);
  addRect(s, 11, 4, 12, 8, W, H);
  return { W, H, p: uniqCells([...s].map((k) => k.split(',').map(Number))) };
}

/** 2_8 環島廣場：外環 + 中心島 + 四放射 */
function playable_2_8() {
  const W = 13;
  const H = 13;
  const cx = 6;
  const cy = 6;
  const p = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = Math.max(Math.abs(x - cx), Math.abs(y - cy));
      const ring = d >= 4 && d <= 5;
      const hub = d <= 1;
      const spoke = (x === cx || y === cy) && d <= 5;
      if (ring || hub || spoke) p.push([x, y]);
    }
  }
  return { W, H, p: uniqCells(p) };
}

const BUILDERS = [
  { ref: '2_1', theme: '防火窄巷', build: playable_2_1 },
  { ref: '2_2', theme: '圓環路口', build: playable_2_2 },
  { ref: '2_3', theme: '高架陰影', build: playable_2_3 },
  { ref: '2_4', theme: '車站柱廊', build: playable_2_4 },
  { ref: '2_5', theme: '商場天井', build: playable_2_5 },
  { ref: '2_6', theme: '工地圍籬', build: playable_2_6 },
  { ref: '2_7', theme: '十字街口', build: playable_2_7 },
  { ref: '2_8', theme: '環島廣場', build: playable_2_8 },
];

/** 據點：maximin 分散在可玩格 */
function pickSpreadOutposts(playableKeys, n) {
  const cells = playableKeys.map((k) => k.split(',').map(Number));
  if (cells.length === 0) throw new Error('no playable cells');
  const cx = cells.reduce((a, [x]) => a + x, 0) / cells.length;
  const cy = cells.reduce((a, [, y]) => a + y, 0) / cells.length;
  // 先取離中心最遠的一點當錨
  let best = cells[0];
  let bestD = -1;
  for (const [x, y] of cells) {
    const d = (x - cx) ** 2 + (y - cy) ** 2;
    if (d > bestD) {
      bestD = d;
      best = [x, y];
    }
  }
  const picked = [best];
  while (picked.length < n) {
    let next = null;
    let nextScore = -1;
    for (const [x, y] of cells) {
      if (picked.some(([px, py]) => px === x && py === y)) continue;
      const minD = Math.min(...picked.map(([px, py]) => (x - px) ** 2 + (y - py) ** 2));
      if (minD > nextScore) {
        nextScore = minD;
        next = [x, y];
      }
    }
    if (!next) break;
    picked.push(next);
  }
  return picked;
}

const playableByRef = new Map();

for (const { ref, theme, build } of BUILDERS) {
  const { W, H, p } = build();
  const uniq = uniqCells(p);
  const forbidden = forbiddenFromPlayable(W, H, uniq);
  const playableCells = uniq.length;
  const totalCells = W * H;
  playableByRef.set(ref, {
    n: playableCells,
    keys: uniq.map(([x, y]) => key(x, y)),
  });
  const payload = {
    mapLayout: { type: 'SQUARE', width: W, height: H, forbiddenCells: forbidden },
    mapTheme: theme,
    gridStats: {
      totalCells,
      forbiddenCellCount: forbidden.length,
      playableCells,
    },
  };
  const outPath = path.join(MAPS_DIR, `${ref}.json`);
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote maps/${ref}.json ${W}×${H} playable=${playableCells} — ${theme}`);
}

// ── sync levels.json ──
const doc = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8').replace(/^\uFEFF/, ''));
const CH3_REUSE = {
  21: { mapRef: '2_5', outpostN: 4 },
  22: { mapRef: '2_6', outpostN: 4 },
  23: { mapRef: '2_7', outpostN: 5 },
  24: { mapRef: '2_8', outpostN: 6 },
};

for (const lv of doc.levels) {
  const ref = lv.mapRef;
  if (!playableByRef.has(ref)) continue;
  const { n, keys } = playableByRef.get(ref);

  if (lv.chapter === 2) {
    lv.timeLimit = n + 2;
    console.log(`L${lv.levelId} ${ref}: timeLimit=${lv.timeLimit} (playable+2)`);
  }

  const reuse = CH3_REUSE[lv.levelId];
  if (reuse && reuse.mapRef === ref) {
    lv.digitOutposts = pickSpreadOutposts(keys, reuse.outpostN);
    lv.timeLimit = n; // ch3：playable 1:1
    console.log(
      `L${lv.levelId} ${ref}: timeLimit=${lv.timeLimit}, outposts=${JSON.stringify(lv.digitOutposts)}`,
    );
  }
}

fs.writeFileSync(LEVELS_PATH, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
console.log('\nlevels.json synced (ch2 timeLimit, ch3 reuse outposts/timeLimit).');
console.log('Next: node scripts/validate-map-constraints.mjs');
