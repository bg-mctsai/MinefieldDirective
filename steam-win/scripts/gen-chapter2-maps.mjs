/**
 * 產生第二章 maps/11~20.json（SQUARE + forbiddenCells 剪影）並列印 timeLimit 建議。
 * 執行：node scripts/gen-chapter2-maps.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, '../renderer/src/levelData/maps');

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

/** 11: 工字 */
function playable11() {
  const W = 11;
  const H = 11;
  const p = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const top = y <= 1;
      const bot = y >= H - 2;
      const mid = y >= 2 && y <= H - 3;
      if (top || bot) {
        if (x >= 2 && x <= W - 3) p.push([x, y]);
      } else if (mid) {
        if (x >= 4 && x <= 6) p.push([x, y]);
      }
    }
  }
  return { W, H, p };
}

/** 12: 鑰匙孔 */
function playable12() {
  const W = 11;
  const H = 11;
  const p = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (y <= 3) {
        const d = Math.abs(x - 5) + Math.abs(y - 1);
        if (d <= 3) p.push([x, y]);
      } else if (y >= 4) {
        if (x >= 4 && x <= 6) p.push([x, y]);
      }
    }
  }
  return { W, H, p };
}

/** 13: 折返閃電溝（11×11、曼哈頓折線 + 4 鄰加厚，可玩約 55～65 格；多轉角、外框留白，避免 8 鄰加厚變整塊方磚） */
function playable13() {
  const W = 11;
  const H = 11;
  const thick = new Set();
  const thicken = (x, y) => {
    for (const [ox, oy] of [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + ox;
      const ny = y + oy;
      if (nx >= 0 && nx < W && ny >= 0 && ny < H) thick.add(key(nx, ny));
    }
  };
  /** 曼哈頓路徑：先橫後直 */
  const addSeg = (x0, y0, x1, y1) => {
    let x = x0;
    let y = y0;
    for (;;) {
      thicken(x, y);
      if (x === x1 && y === y1) break;
      if (x !== x1) x += Math.sign(x1 - x);
      else if (y !== y1) y += Math.sign(y1 - y);
    }
  };
  addSeg(2, 2, 7, 2);
  addSeg(7, 2, 7, 4);
  addSeg(7, 4, 3, 4);
  addSeg(3, 4, 3, 7);
  addSeg(3, 7, 7, 7);
  addSeg(7, 7, 7, 8);
  addSeg(7, 8, 2, 8);
  const p = [...thick].map((k) => k.split(',').map(Number));
  return { W, H, p };
}

/** 14: H 型 */
function playable14() {
  const W = 11;
  const H = 11;
  const p = [];
  for (let y = 1; y <= 9; y++) {
    for (const x of [1, 2, 8, 9]) p.push([x, y]);
  }
  for (let y of [4, 5]) {
    for (let x = 3; x <= 7; x++) p.push([x, y]);
  }
  return { W, H, p };
}

/** 15: 雙層方框（外圈＋內圈，中空為禁佈） */
function playable15() {
  const W = 12;
  const H = 12;
  const p = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const outer = x === 0 || x === W - 1 || y === 0 || y === H - 1;
      const inner =
        x >= 1 &&
        x <= 10 &&
        y >= 1 &&
        y <= 10 &&
        (x === 1 || x === 10 || y === 1 || y === 10);
      if (outer || inner) p.push([x, y]);
    }
  }
  return { W, H, p };
}

/** 16: 坦克 */
function playable16() {
  const W = 11;
  const H = 11;
  const p = [];
  for (let y = 6; y <= 9; y++) {
    for (let x = 2; x <= 8; x++) p.push([x, y]);
  }
  for (let y = 3; y <= 5; y++) {
    for (let x = 3; x <= 7; x++) p.push([x, y]);
  }
  p.push([5, 2], [4, 2], [6, 2]);
  return { W, H, p };
}

/** 17: 四旋翼＋粗十字 */
function playable17() {
  const W = 11;
  const H = 11;
  const s = new Set();
  const add = (x, y) => {
    if (x >= 0 && x < W && y >= 0 && y < H) s.add(key(x, y));
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if ((x >= 4 && x <= 6) || (y >= 4 && y <= 6)) add(x, y);
    }
  }
  const rot = [
    [1, 1],
    [2, 1],
    [1, 2],
    [8, 1],
    [9, 1],
    [9, 2],
    [1, 8],
    [1, 9],
    [2, 9],
    [8, 9],
    [9, 9],
    [9, 8],
  ];
  for (const [x, y] of rot) add(x, y);
  const p = [...s].map((k) => k.split(',').map(Number));
  return { W, H, p };
}

/** 18: 八角星 */
function playable18() {
  const W = 11;
  const H = 11;
  const cx = 5;
  const cy = 5;
  const p = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      if (dx + dy <= 2) p.push([x, y]);
      else if (dx <= 1 && dy <= 5) p.push([x, y]);
      else if (dy <= 1 && dx <= 5) p.push([x, y]);
    }
  }
  return { W, H, p };
}

/** 19: 寬軌三叉（15×15，加寬幹道，可玩約 70～80 格） */
function playable19() {
  const W = 15;
  const H = 15;
  const s = new Set();
  const addRect = (x0, y0, x1, y1) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) s.add(key(x, y));
    }
  };
  const cx = 7;
  const cy = 7;
  addRect(cx - 1, cy - 1, cx + 1, cy + 1);
  addRect(5, 0, 9, 5);
  addRect(0, 5, 4, 8);
  addRect(10, 5, 14, 8);
  const p = [...s].map((k) => k.split(',').map(Number));
  return { W, H, p };
}

/** 20: 三重方環帶（Chebyshev 3≤d≤5，可玩約 80～100 格） */
function playable20() {
  const W = 11;
  const H = 11;
  const cx = 5;
  const cy = 5;
  const p = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = Math.max(Math.abs(x - cx), Math.abs(y - cy));
      if (d >= 3 && d <= 5) p.push([x, y]);
    }
  }
  return { W, H, p };
}

const builders = [
  playable11,
  playable12,
  playable13,
  playable14,
  playable15,
  playable16,
  playable17,
  playable18,
  playable19,
  playable20,
];

/** 與關卡選擇畫面一致（maps/*.json 的 mapTheme） */
const MAP_THEMES = [
  '工字梁',
  '鑰匙孔型',
  '折返閃電溝',
  '雙柱',
  '雙層框',
  '坦克側影',
  '粗十旋翼帶',
  '八角',
  '寬軌三叉口',
  '三重方環帶',
];

const COV = 0.7;
const K = 2.05;

const times = [];
for (let i = 0; i < builders.length; i++) {
  const { W, H, p } = builders[i]();
  const uniq = [...new Set(p.map(([x, y]) => key(x, y)))].map((k) => k.split(',').map(Number));
  const forbidden = forbiddenFromPlayable(W, H, uniq);
  const n = uniq.length;
  const time = Math.max(52, Math.round(n * COV * K));
  times.push({ levelId: 11 + i, n, time });
  const outPath = path.join(MAPS_DIR, `${11 + i}.json`);
  const payload = {
    mapLayout: { type: 'SQUARE', width: W, height: H, forbiddenCells: forbidden },
    mapTheme: MAP_THEMES[i],
  };
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote maps/${11 + i}.json playable=${n} time~${time}`);
}
console.log('\nlevels.json timeLimit patch (copy):');
console.log(JSON.stringify(times, null, 2));
