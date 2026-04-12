/**
 * 第四章 maps/31～40.json：TRIANGLE + placeholder + forbiddenCells + mapTheme。
 * 尺寸階梯與 `ch4MapLayout.ts` 的 CH4_TRIANGLE_LAYOUTS 一致。
 * 執行：node scripts/gen-chapter4-maps.mjs（cwd = steam-win）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, '../renderer/src/levelData/maps');

const CH4_TRIANGLE_LAYOUTS = [
  { width: 8, height: 9 },
  { width: 9, height: 9 },
  { width: 10, height: 8 },
  { width: 8, height: 10 },
  { width: 9, height: 10 },
  { width: 10, height: 9 },
  { width: 7, height: 10 },
  { width: 10, height: 5 },
  { width: 9, height: 8 },
  { width: 10, height: 10 },
];

const key = (x, y) => `${x},${y}`;

function forbiddenFromPlayable(W, H, playableSet) {
  const f = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!playableSet.has(key(x, y))) f.push([x, y]);
    }
  }
  return f;
}

/** 曼哈頓粗折線（僅水平／垂直步進） */
function thickenPolyline(W, H, segments) {
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
  for (const [a, b] of segments) addSeg(a[0], a[1], b[0], b[1]);
  return s;
}

const LEVELS = [
  {
    id: 31,
    theme: '鑲嵌場',
    playable: ({ W, H }) => {
      const p = new Set();
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.add(key(x, y));
      return p;
    },
  },
  {
    id: 32,
    theme: '熟手擴面',
    playable: ({ W, H }) => {
      const p = new Set();
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.add(key(x, y));
      return p;
    },
  },
  {
    id: 33,
    theme: '閃電溝雷達',
    playable: ({ W, H }) =>
      thickenPolyline(W, H, [
        [[1, 2], [8, 2]],
        [[8, 2], [2, 5]],
        [[2, 5], [9, 6]],
      ]),
  },
  {
    id: 34,
    theme: '工谷',
    playable: ({ W, H }) => {
      const p = new Set();
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const top = y <= 1;
          const bot = y >= H - 2;
          const mid = y >= 2 && y <= H - 3;
          if (top || bot) {
            if (x >= 1 && x <= W - 2) p.add(key(x, y));
          } else if (mid) {
            if (x >= 3 && x <= 4) p.add(key(x, y));
          }
        }
      }
      return p;
    },
  },
  {
    id: 35,
    theme: '鑰匙孔',
    playable: ({ W, H }) => {
      const p = new Set();
      const cx = Math.floor(W / 2);
      const cy = 3;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (y <= 4) {
            const d = Math.abs(x - cx) + Math.abs(y - cy);
            if (d <= 4) p.add(key(x, y));
          } else if (x >= cx - 1 && x <= cx + 1) p.add(key(x, y));
        }
      }
      return p;
    },
  },
  {
    id: 36,
    theme: '粗十分水',
    playable: ({ W, H }) => {
      const p = new Set();
      const mx = Math.floor((W - 1) / 2);
      const my = Math.floor((H - 1) / 2);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if ((x >= mx - 1 && x <= mx + 1) || (y >= my - 1 && y <= my + 1)) p.add(key(x, y));
        }
      }
      return p;
    },
  },
  {
    id: 37,
    theme: '窄峽縱谷區',
    playable: ({ W, H }) => {
      const p = new Set();
      const mx = Math.floor(W / 2);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (Math.abs(x - mx) <= 1) p.add(key(x, y));
        }
      }
      return p;
    },
  },
  {
    id: 38,
    theme: '雙堤',
    playable: ({ W, H }) => {
      const p = new Set();
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (y <= 1 || y >= H - 2) p.add(key(x, y));
        }
      }
      return p;
    },
  },
  {
    id: 39,
    theme: '鑽石面',
    playable: ({ W, H }) => {
      const p = new Set();
      const cx = (W - 1) / 2;
      const cy = (H - 1) / 2;
      const r = Math.min(W, H) / 2 + 0.5;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (Math.abs(x - cx) + Math.abs(y - cy) <= r) p.add(key(x, y));
        }
      }
      return p;
    },
  },
  {
    id: 40,
    theme: '章末方環',
    playable: ({ W, H }) => {
      const p = new Set();
      const cx = Math.floor(W / 2);
      const cy = Math.floor(H / 2);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const d = Math.max(Math.abs(x - cx), Math.abs(y - cy));
          if (d >= 2 && d <= 4) p.add(key(x, y));
        }
      }
      return p;
    },
  },
];

for (let i = 0; i < LEVELS.length; i++) {
  const L = LEVELS[i];
  const id = L.id;
  const { width: W, height: H } = CH4_TRIANGLE_LAYOUTS[i];
  const playable = L.playable({ W, H });
  const forbidden = forbiddenFromPlayable(W, H, playable);
  const n = playable.size;
  const cov = 0.75;
  const k = 1.12;
  const time = Math.max(58 + (id - 31) * 8, Math.round(n * cov * k), 55);
  const mapLayout = {
    type: 'TRIANGLE',
    placeholder: { width: W, height: H },
    forbiddenCells: forbidden,
  };
  const outPath = path.join(MAPS_DIR, `${id}.json`);
  fs.writeFileSync(outPath, `${JSON.stringify({ mapLayout, mapTheme: L.theme }, null, 2)}\n`, 'utf8');
  console.log(`L${id} TRIANGLE ${W}×${H} playable=${n} forbidden=${forbidden.length} time~${time} ${L.theme}`);
}
