import { buildTacticalRouteSmoothD } from './missionChapterTacticalRoute';

export type Pt = { x: number; y: number };

/** 背景專用：僅黑與螢光綠階（不依章節色票） */
export const TACTICAL_BG = {
  black: '#010302',
  blackLift: '#050a08',
  grid: '#0f2918',
  gridHi: '#164a28',
  neon: '#39ff14',
  neonMid: '#4ade80',
  neonSoft: '#22c55e',
  neonDim: '#15803d',
  trace: '#86efac',
} as const;

function perpUnit(prev: Pt, next: Pt): { nx: number; ny: number } {
  const vx = next.x - prev.x;
  const vy = next.y - prev.y;
  const len = Math.hypot(vx, vy) || 1;
  return { nx: -vy / len, ny: vx / len };
}

/** 沿路徑法線偏移，產生與主路平行、不經節點中心的裝飾折線點列 */
export function offsetRoutePoints(points: Pt[], dist: number, flip: boolean): Pt[] {
  const f = flip ? -1 : 1;
  return points.map((p, i) => {
    const prev = points[i - 1] ?? p;
    const next = points[i + 1] ?? p;
    const { nx, ny } = perpUnit(prev, next);
    return { x: p.x + nx * dist * f, y: p.y + ny * dist * f };
  });
}

export type SegmentArrow = { x: number; y: number; deg: number };

export function segmentMidArrows(points: Pt[]): SegmentArrow[] {
  const out: SegmentArrow[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const pushAt = (t: number) => {
      out.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        deg,
      });
    };
    pushAt(0.5);
    if (len > 20) {
      pushAt(0.28);
      pushAt(0.72);
    }
  }
  return out;
}

/** 額外短戰術線（不綁關卡節點），豐富背景層次 */
export function extraTacticalSegments(seed: number): Array<{ x1: number; y1: number; x2: number; y2: number; dash?: string }> {
  const s = Math.abs(seed % 997) / 997;
  const base = [
    { x1: 4, y1: 22, x2: 28, y2: 18, dash: '0.6 1.2' },
    { x1: 88, y1: 38, x2: 96, y2: 52 },
    { x1: 92, y1: 72, x2: 74, y2: 78, dash: '0.5 1' },
    { x1: 8, y1: 48, x2: 22, y2: 44, dash: '0.4 0.9' },
    { x1: 62, y1: 8, x2: 70, y2: 22 },
  ];
  return base.map((seg, i) => ({
    ...seg,
    x1: seg.x1 + ((s + i * 0.07) % 1) * 2 - 1,
    y1: seg.y1 + ((s * 1.3 + i) % 1) * 2 - 1,
  }));
}

export function buildParallelSmoothD(points: Pt[], dist: number, flip: boolean, tension: number): string {
  const off = offsetRoutePoints(points, dist, flip);
  return buildTacticalRouteSmoothD(off, tension);
}
