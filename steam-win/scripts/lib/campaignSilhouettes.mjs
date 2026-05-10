/**
 * 戰役剪影幾何：與 gen-chapter4-maps 同構的 8 種占位剪影 + CH4 尺寸階梯。
 */

/** 與 renderer ch4MapLayout CH4_HEX_PLACEHOLDER_LAYOUTS 一致 */
export const CH4_HEX_PLACEHOLDER_LAYOUTS = [
  { width: 10, height: 5 },
  { width: 9, height: 7 },
  { width: 10, height: 7 },
  { width: 11, height: 7 },
  { width: 10, height: 8 },
  { width: 10, height: 9 },
  { width: 11, height: 9 },
  { width: 10, height: 10 },
  { width: 10, height: 10 },
  { width: 10, height: 10 },
];

export const key = (x, y) => `${x},${y}`;

export function forbiddenFromPlayable(W, H, playableSet) {
  const f = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!playableSet.has(key(x, y))) f.push([x, y]);
    }
  }
  return f;
}

export function thickenPolyline(W, H, segments) {
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

/** 0～7 對應第四章 L33～L40 剪影（依寬高縮放） */
export function silhouettePlayable(silIndex, W, H) {
  switch (silIndex % 8) {
    case 0:
      return thickenPolyline(W, H, [
        [[1, 2], [Math.min(8, W - 2), 2]],
        [[Math.min(8, W - 2), 2], [2, Math.min(5, H - 3)]],
        [[2, Math.min(5, H - 3)], [Math.min(9, W - 1), Math.min(6, H - 2)]],
      ]);
    case 1: {
      const p = new Set();
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const top = y <= 1;
          const bot = y >= H - 2;
          const mid = y >= 2 && y <= H - 3;
          if (top || bot) {
            if (x >= 1 && x <= W - 2) p.add(key(x, y));
          } else if (mid) {
            const mx = Math.floor(W / 2);
            if (x >= mx - 1 && x <= mx) p.add(key(x, y));
          }
        }
      }
      return p;
    }
    case 2: {
      const p = new Set();
      const cx = Math.floor(W / 2);
      const cy = Math.min(3, Math.floor(H / 3));
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (y <= Math.min(4, H - 2)) {
            const d = Math.abs(x - cx) + Math.abs(y - cy);
            if (d <= 4) p.add(key(x, y));
          } else if (x >= cx - 1 && x <= cx + 1) p.add(key(x, y));
        }
      }
      return p;
    }
    case 3: {
      const p = new Set();
      const mx = Math.floor((W - 1) / 2);
      const my = Math.floor((H - 1) / 2);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if ((x >= mx - 1 && x <= mx + 1) || (y >= my - 1 && y <= my + 1)) p.add(key(x, y));
        }
      }
      return p;
    }
    case 4: {
      const p = new Set();
      const mx = Math.floor(W / 2);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (Math.abs(x - mx) <= 1) p.add(key(x, y));
        }
      }
      return p;
    }
    case 5: {
      const p = new Set();
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (y <= 1 || y >= H - 2) p.add(key(x, y));
        }
      }
      return p;
    }
    case 6: {
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
    }
    default: {
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
    }
  }
}

/**
 * 第十章專用：大卡盤仍保留剪影辨識度。
 * - sil 1～6：與 `silhouettePlayable` 相同。
 * - sil 0：折線端點隨 W、H 拉長（原版小盤會卡在 ~72 格）。
 * - sil 7：Chebyshev 方環，自動挑 rInner～rOuter 使格數易落在 100～200（原版薄環大卡盤不足 100）。
 */
export function silhouettePlayableChapter10(silIndex, W, H) {
  const i = silIndex % 8;
  if (i >= 1 && i <= 6) return silhouettePlayable(silIndex, W, H);
  if (i === 0) {
    if (W < 5 || H < 5) return silhouettePlayable(0, W, H);
    return thickenPolyline(W, H, [
      [[1, 2], [Math.max(1, W - 2), 2]],
      [[Math.max(1, W - 2), 2], [2, Math.max(2, Math.floor(H * 0.38))]],
      [[2, Math.max(2, Math.floor(H * 0.38))], [Math.max(2, W - 2), Math.max(3, Math.floor(H * 0.62))]],
    ]);
  }
  const cx = Math.floor(W / 2);
  const cy = Math.floor(H / 2);
  const maxD = Math.max(cx, cy, W - 1 - cx, H - 1 - cy);
  for (let rOuter = maxD; rOuter >= 3; rOuter--) {
    for (let rInner = rOuter - 1; rInner >= 1; rInner--) {
      const p = new Set();
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const d = Math.max(Math.abs(x - cx), Math.abs(y - cy));
          if (d >= rInner && d <= rOuter) p.add(key(x, y));
        }
      }
      if (p.size >= 100 && p.size <= 200) return p;
    }
  }
  return silhouettePlayable(7, W, H);
}

export function fullBoard(W, H) {
  const p = new Set();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.add(key(x, y));
  return p;
}

/** 8 鄰擴張：確保座標點集皆在 playable 內 */
export function ensureCellsInPlayable(W, H, playableSet, cells) {
  const s = new Set(playableSet);
  for (const [ox, oy] of cells) {
    if (ox < 0 || ox >= W || oy < 0 || oy >= H) continue;
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
