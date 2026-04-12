/**
 * 第三章 maps/21～30.json：剪影地形 + mapTheme；forbidden 絕不覆蓋 digitOutposts（來自 levels.json）。
 * 執行：node scripts/gen-chapter3-maps.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, '../renderer/src/levelData/maps');

const key = (x, y) => `${x},${y}`;

const LEVELS = [
  {
    id: 21,
    W: 10,
    H: 10,
    outposts: [
      [2, 1],
      [6, 6],
    ],
    theme: '雙堤前哨谷',
    /** 曼哈頓折線「閃電」縮小版 */
    playablePred: (x, y) => {
      const s = new Set();
      const addSeg = (x0, y0, x1, y1) => {
        let x = x0;
        let y = y0;
        for (;;) {
          for (const ox of [-1, 0, 1]) {
            for (const oy of [-1, 0, 1]) {
              const nx = x + ox;
              const ny = y + oy;
              if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10) s.add(key(nx, ny));
            }
          }
          if (x === x1 && y === y1) break;
          if (x !== x1) x += Math.sign(x1 - x);
          else if (y !== y1) y += Math.sign(y1 - y);
        }
      };
      addSeg(1, 2, 8, 2);
      addSeg(8, 2, 2, 6);
      addSeg(2, 6, 7, 9);
      return s.has(key(x, y));
    },
  },
  {
    id: 22,
    W: 10,
    H: 10,
    outposts: [
      [1, 5],
      [4, 5],
    ],
    theme: '幹線',
    playablePred: (x, y) => {
      const band = y >= 3 && y <= 7;
      const wing = (y <= 2 || y >= 8) && (x <= 2 || x >= 7);
      return band || wing;
    },
  },
  {
    id: 23,
    W: 10,
    H: 10,
    outposts: [
      [0, 0],
      [4, 2],
      [8, 2],
    ],
    theme: '折線谷',
    playablePred: (x, y) => {
      const d = Math.abs(x - 4) + Math.abs(y - 4);
      return d <= 8;
    },
  },
  {
    id: 24,
    W: 11,
    H: 11,
    outposts: [
      [2, 2],
      [4, 4],
      [6, 2],
      [9, 9],
    ],
    theme: '四角斷層',
    playablePred: (x, y) => {
      const corners = new Set(['0,0', '10,10', '0,10', '10,0']);
      return !corners.has(key(x, y));
    },
  },
  {
    id: 25,
    W: 11,
    H: 11,
    outposts: [
      [0, 1],
      [5, 5],
      [7, 7],
    ],
    theme: 'H型塹壕道',
    playablePred: (x, y) => {
      const left = x >= 0 && x <= 2 && y >= 1 && y <= 9;
      const right = x >= 7 && x <= 10 && y >= 1 && y <= 9;
      const mid = x >= 2 && x <= 8 && (y === 4 || y === 5);
      return left || right || mid;
    },
  },
  {
    id: 26,
    W: 11,
    H: 11,
    outposts: [
      [5, 5],
      [8, 8],
    ],
    theme: '雙峰',
    playablePred: (x, y) => {
      const cx = 3;
      const cy = 3;
      const d = Math.abs(x - cx) + Math.abs(y - cy);
      const d2 = Math.abs(x - 9) + Math.abs(y - 9);
      return d <= 4 || d2 <= 4 || (x >= 4 && x <= 7 && y >= 4 && y <= 7);
    },
  },
  {
    id: 27,
    W: 11,
    H: 11,
    outposts: [
      [1, 0],
      [4, 0],
      [9, 9],
    ],
    theme: '三叉谷',
    playablePred: (x, y) => {
      const top = x >= 0 && x <= 7 && y >= 0 && y <= 3;
      const br = x >= 4 && x <= 10 && y >= 6 && y <= 10;
      const mid = x >= 2 && x <= 8 && y >= 3 && y <= 7;
      return top || br || mid;
    },
  },
  {
    id: 28,
    W: 12,
    H: 12,
    outposts: [
      [0, 0],
      [4, 3],
      [8, 8],
      [1, 8],
    ],
    theme: '乾谷五穴',
    playablePred: (x, y) => {
      const holes = new Set(['6,6', '6,5', '6,7', '5,6', '7,6']);
      return !holes.has(key(x, y));
    },
  },
  {
    id: 29,
    W: 12,
    H: 12,
    outposts: [
      [1, 1],
      [5, 5],
      [9, 0],
    ],
    theme: '折閃曼幹線',
    playablePred: (x, y) => {
      const W = 12;
      const H = 12;
      const s = new Set();
      const addSeg = (x0, y0, x1, y1) => {
        let x = x0;
        let y = y0;
        for (;;) {
          for (const ox of [-1, 0, 1]) {
            for (const oy of [-1, 0, 1]) {
              const nx = x + ox;
              const ny = y + oy;
              if (nx >= 0 && nx < W && ny >= 0 && ny < H) s.add(key(nx, ny));
            }
          }
          if (x === x1 && y === y1) break;
          if (x !== x1) x += Math.sign(x1 - x);
          else if (y !== y1) y += Math.sign(y1 - y);
        }
      };
      addSeg(1, 2, 9, 2);
      addSeg(9, 2, 3, 7);
      addSeg(3, 7, 10, 10);
      addSeg(10, 10, 2, 10);
      return s.has(key(x, y));
    },
  },
  {
    id: 30,
    W: 12,
    H: 12,
    outposts: [
      [0, 0],
      [3, 3],
      [7, 7],
      [1, 8],
      [8, 2],
    ],
    theme: '終溝',
    playablePred: (x, y) => {
      const cx = 5;
      const cy = 5;
      const d = Math.max(Math.abs(x - cx), Math.abs(y - cy));
      return d >= 2 && d <= 5;
    },
  },
];

function forbiddenFromPlayable(W, H, playableSet) {
  const f = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!playableSet.has(key(x, y))) f.push([x, y]);
    }
  }
  return f;
}

function ensureOutpostsInPlayable(W, H, playableSet, outposts) {
  const s = new Set(playableSet);
  for (const [ox, oy] of outposts) {
    if (!s.has(key(ox, oy))) {
      s.add(key(ox, oy));
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = ox + dx;
          const ny = oy + dy;
          if (nx >= 0 && nx < W && ny >= 0 && ny < H) s.add(key(nx, ny));
        }
      }
    }
  }
  return s;
}

for (const L of LEVELS) {
  const { id, W, H, outposts, theme, playablePred } = L;
  let playable = new Set();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (playablePred(x, y)) playable.add(key(x, y));
    }
  }
  playable = ensureOutpostsInPlayable(W, H, playable, outposts);
  for (const [ox, oy] of outposts) {
    if (!playable.has(key(ox, oy))) {
      console.error(`L${id}: outpost (${ox},${oy}) still not playable`);
      process.exit(1);
    }
  }
  const forbidden = forbiddenFromPlayable(W, H, playable);
  const n = playable.size;
  const cov = 0.75;
  const k = 1.15;
  /** 與 levels.json 一致：底線 68s 起每關 +8，且不低於格數驅動估計 */
  const time = Math.max(60 + (id - 21) * 8, Math.round(n * cov * k), 58);
  const outPath = path.join(MAPS_DIR, `${id}.json`);
  fs.writeFileSync(
    outPath,
    `${JSON.stringify({ mapLayout: { type: 'SQUARE', width: W, height: H, forbiddenCells: forbidden }, mapTheme: theme }, null, 2)}\n`,
    'utf8',
  );
  console.log(`L${id} ${W}x${H} playable=${n} forbidden=${forbidden.length} time~${time} ${theme}`);
}
