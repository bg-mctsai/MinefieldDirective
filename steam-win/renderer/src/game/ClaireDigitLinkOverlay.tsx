import { BOARD_GAP_PX, GAME_BOARD_FRAME_PAD_PX } from './constants';
import { hexCenterScreenPx } from './hexBoardLayout';
import {
  CLAIRE_DIGIT_LINK_FIREPOWER_PER_EDGE,
  type ClaireDigitLinkEdge,
} from './mineCombatVisual';
import type { OverlayBoardLayout } from './overlayBoardCellCenter';

function squareCardinalLinkSegment(
  edge: ClaireDigitLinkEdge,
  cellSize: number,
  squareGridMin: { x: number; y: number },
): { x1: number; y1: number; x2: number; y2: number } {
  const pad = GAME_BOARD_FRAME_PAD_PX;
  const step = cellSize + BOARD_GAP_PX;
  const ox = squareGridMin.x;
  const oy = squareGridMin.y;
  const left = (x: number) => pad + (x - ox) * step;
  const top = (y: number) => pad + (y - oy) * step;

  const { ax, ay, bx, by } = edge;
  if (ay === by) {
    const y = top(ay) + cellSize / 2;
    if (ax < bx) {
      return { x1: left(ax) + cellSize, y1: y, x2: left(bx), y2: y };
    }
    return { x1: left(bx) + cellSize, y1: y, x2: left(ax), y2: y };
  }
  const x = left(ax) + cellSize / 2;
  if (ay < by) {
    return { x1: x, y1: top(ay) + cellSize, x2: x, y2: top(by) };
  }
  return { x1: x, y1: top(by) + cellSize, x2: x, y2: top(ay) };
}

function hexLinkSegment(
  edge: ClaireDigitLinkEdge,
  r: number,
  hexMin: { x: number; y: number },
): { x1: number; y1: number; x2: number; y2: number } {
  const pad = GAME_BOARD_FRAME_PAD_PX;
  const c1 = hexCenterScreenPx(edge.ax, edge.ay, r, hexMin.x, hexMin.y);
  const c2 = hexCenterScreenPx(edge.bx, edge.by, r, hexMin.x, hexMin.y);
  const x1 = pad + c1.cx;
  const y1 = pad + c1.cy;
  const x2 = pad + c2.cx;
  const y2 = pad + c2.cy;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const inset = r * 0.5;
  return {
    x1: x1 + (dx / len) * inset,
    y1: y1 + (dy / len) * inset,
    x2: x2 - (dx / len) * inset,
    y2: y2 - (dy / len) * inset,
  };
}

/** 克萊兒：盤面生命鏈結連線與 +2 標記（方格走格縫、六角走格心）。 */
export function ClaireDigitLinkOverlay({
  edges,
  layout,
  cellSize,
  overlayWidthPx,
  overlayHeightPx,
  hexMin,
  squareGridMin,
}: {
  edges: ReadonlyArray<ClaireDigitLinkEdge>;
  layout: OverlayBoardLayout;
  cellSize: number;
  overlayWidthPx: number;
  overlayHeightPx: number;
  hexMin?: { x: number; y: number };
  squareGridMin?: { x: number; y: number };
}) {
  if (edges.length === 0) return null;

  const badgeFont = Math.max(9, Math.round(cellSize * 0.26));
  const strokeW = Math.max(3, cellSize * 0.09);

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 z-[18]"
      width={overlayWidthPx}
      height={overlayHeightPx}
      style={{ overflow: 'visible' }}
    >
      {edges.map((edge) => {
        const seg =
          layout === 'hex' && hexMin
            ? hexLinkSegment(edge, cellSize, hexMin)
            : squareGridMin
              ? squareCardinalLinkSegment(edge, cellSize, squareGridMin)
              : null;
        if (!seg) return null;
        const mx = (seg.x1 + seg.x2) / 2;
        const my = (seg.y1 + seg.y2) / 2;
        const edgeKey = `${edge.ax},${edge.ay}|${edge.bx},${edge.by}`;
        return (
          <g key={edgeKey}>
            <line
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke="rgba(34,211,238,0.35)"
              strokeWidth={strokeW + 3}
              strokeLinecap="round"
            />
            <line
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke="rgba(103,232,249,0.98)"
              strokeWidth={strokeW}
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.95))' }}
            />
            <circle cx={mx} cy={my} r={badgeFont * 0.72} fill="rgba(2,6,23,0.92)" />
            <text
              x={mx}
              y={my}
              textAnchor="middle"
              dominantBaseline="central"
              fill="rgb(165,243,252)"
              fontWeight={900}
              fontSize={badgeFont}
              style={{
                paintOrder: 'stroke fill',
                stroke: 'rgba(2,6,23,0.92)',
                strokeWidth: Math.max(2, badgeFont * 0.22),
              }}
            >
              +{CLAIRE_DIGIT_LINK_FIREPOWER_PER_EDGE}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
