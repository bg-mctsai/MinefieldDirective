import { buildTacticalRouteSmoothD } from './missionChapterTacticalRoute';
import {
  TACTICAL_BG,
  buildParallelSmoothD,
  extraTacticalSegments,
  segmentMidArrows,
  type Pt,
} from './missionChapterTacticalBackdropDecor';

export type MissionChapterTacticalBackdropPalette = {
  neon: string;
  neonSoft: string;
  warn: string;
  grid: string;
};

const HUD_LINES: Array<{ x: number; y: number; lines: string[]; anchor: 'start' | 'end' }> = [
  {
    x: 2.2,
    y: 5.5,
    anchor: 'start',
    lines: ['GRID REF 38.441N / 122.019E', 'IFF PENDING / HOSTILE', 'ELINT SIG LOW'],
  },
  {
    x: 97.8,
    y: 6,
    anchor: 'end',
    lines: ['UPLINK VHF 142.000 MHz', 'SCAN PRF 820 Hz', 'MODE 4 CRYPTO OK'],
  },
  {
    x: 2.2,
    y: 97,
    anchor: 'start',
    lines: ['TACNET NODE 07', 'BDA NO SPOT REPORT', 'EMCON ALPHA'],
  },
  {
    x: 97.5,
    y: 96,
    anchor: 'end',
    lines: ['ALT CORR +12m MSL', 'DTG ZULU SYNC', 'EW PASSIVE ONLY'],
  },
];

function binaryMatrixLines(seed: number, count: number): string[] {
  const lines: string[] = [];
  for (let r = 0; r < count; r += 1) {
    let row = '';
    for (let c = 0; c < 48; c += 1) {
      row += ((seed + r * 97 + c * 41) >>> 0) % 2 === 0 ? '0' : '1';
    }
    lines.push(row);
  }
  return lines;
}

function TinyArrow({ x, y, deg }: { x: number; y: number; deg: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${deg})`} opacity={0.42}>
      <path
        d="M -0.42,-0.26 L 0.52,0 L -0.42,0.26 Z"
        fill={TACTICAL_BG.neonMid}
        stroke={TACTICAL_BG.neon}
        strokeWidth={0.04}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

/**
 * 戰術地圖背景：僅深黑＋螢光綠階、極細戰術線與箭頭、極淡 0/1 紋；線條於節點處挖空不遮六角。
 */
export function MissionChapterTacticalBackdrop({
  chapter,
  routePoints,
  palette: _palette,
  visualSeed,
  className = '',
}: {
  chapter: number;
  routePoints: Pt[];
  palette: MissionChapterTacticalBackdropPalette;
  visualSeed: number;
  className?: string;
}) {
  void _palette;
  const sid = `${chapter}-${visualSeed}`;
  const gridId = `tacticalGrid-${sid}`;
  const gridCoarseId = `tacticalGridCoarse-${sid}`;
  const satFilterId = `satTerrain-${sid}`;
  const satTintId = `satTint-${sid}`;
  const nodeMaskId = `nodeLineMask-${sid}`;

  const routeD = buildTacticalRouteSmoothD(routePoints, 0.3);
  const decorA =
    routePoints.length >= 2 ? buildParallelSmoothD(routePoints, 2.4, false, 0.26) : '';
  const decorB =
    routePoints.length >= 2 ? buildParallelSmoothD(routePoints, -2.1, true, 0.22) : '';
  const decorC =
    routePoints.length >= 2 ? buildParallelSmoothD(routePoints, 3.6, true, 0.2) : '';

  const routeDash = visualSeed % 3 === 0 ? '1.2 1.9' : visualSeed % 3 === 1 ? '1.0 1.6' : '1.35 2.0';
  const faintDash = '0.45 0.85';
  const noiseSeed = Math.abs(visualSeed % 17) + 1;

  const arrows = segmentMidArrows(routePoints);
  const extras = extraTacticalSegments(visualSeed);
  const matrixBlocks = [
    { x: 32, y: 12, seed: visualSeed + 3 },
    { x: 68, y: 88, seed: visualSeed + 11 },
    { x: 14, y: 56, seed: visualSeed + 19 },
  ];

  const NODE_MASK_R = 4.35;

  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full select-none ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <mask id={nodeMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect x="0" y="0" width="100" height="100" fill="white" />
          {routePoints.map((p, i) => (
            <circle key={`m-${i}`} cx={p.x} cy={p.y} r={NODE_MASK_R} fill="black" />
          ))}
        </mask>
        <linearGradient id={satTintId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#071208" stopOpacity="0.75" />
          <stop offset="50%" stopColor="#020403" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#0a140c" stopOpacity="0.7" />
        </linearGradient>
        <filter id={satFilterId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.022 0.032"
            numOctaves="3"
            seed={noiseSeed}
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0.14 0.12 0.04 0 0.02
                    0.12 0.2 0.06 0 0.03
                    0.06 0.1 0.05 0 0.02
                    0 0 0 0.42 0"
            result="colored"
          />
        </filter>
        <pattern id={gridId} width="4" height="4" patternUnits="userSpaceOnUse">
          <path
            d="M 4 0 L 0 0 0 4"
            fill="none"
            stroke={TACTICAL_BG.grid}
            strokeWidth="0.07"
            opacity="0.55"
          />
        </pattern>
        <pattern id={gridCoarseId} width="14" height="14" patternUnits="userSpaceOnUse">
          <path
            d="M 14 0 L 0 0 0 14"
            fill="none"
            stroke={TACTICAL_BG.gridHi}
            strokeWidth="0.05"
            opacity="0.22"
          />
        </pattern>
        <radialGradient id={`mapAmbient-${sid}`} cx="50%" cy="52%" r="72%">
          <stop offset="0%" stopColor={TACTICAL_BG.neonSoft} stopOpacity="0.08" />
          <stop offset="88%" stopColor={TACTICAL_BG.black} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="100" height="100" fill={TACTICAL_BG.black} />
      <rect x="0" y="0" width="100" height="100" fill={`url(#${satTintId})`} opacity="0.72" />
      <rect x="0" y="0" width="100" height="100" filter={`url(#${satFilterId})`} opacity="0.14" />
      <rect x="0" y="0" width="100" height="100" fill={`url(#mapAmbient-${sid})`} />
      <rect x="0" y="0" width="100" height="100" fill={`url(#${gridCoarseId})`} opacity="0.85" />
      <rect x="0" y="0" width="100" height="100" fill={`url(#${gridId})`} opacity="0.45" />

      {/* 極淡 0/1 數據紋（不進 mask，避免與節點搶讀） */}
      <g
        fill={TACTICAL_BG.neon}
        opacity={0.1}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        fontSize="1.65"
        fontWeight="600"
        letterSpacing="0.12em"
        pointerEvents="none"
      >
        {matrixBlocks.map((blk, bi) =>
          binaryMatrixLines(blk.seed, 5).map((row, ri) => (
            <text key={`${bi}-${ri}`} x={blk.x} y={blk.y + ri * 2.1}>
              {row}
            </text>
          )),
        )}
      </g>

      <g mask={`url(#${nodeMaskId})`}>
        <g opacity="0.12" stroke={TACTICAL_BG.neonSoft} strokeWidth="0.05" strokeLinecap="round">
          <line x1="0" y1="41" x2="100" y2="41" strokeDasharray="0.7 2.2" />
          <line x1="6" y1="68" x2="94" y2="66" strokeDasharray="1 2.8" opacity="0.85" />
          <line x1="12" y1="18" x2="88" y2="20" strokeDasharray="0.5 1.6" opacity="0.75" />
        </g>

        <circle
          className="mission-tactical-radar-pulse"
          cx={50}
          cy={50}
          r={2.2}
          fill="none"
          stroke={TACTICAL_BG.neonDim}
          strokeWidth={0.1}
          vectorEffect="non-scaling-stroke"
          opacity={0.4}
        />
        <circle
          className="mission-tactical-radar-pulse mission-tactical-radar-pulse--echo"
          cx={50}
          cy={50}
          r={2.2}
          fill="none"
          stroke={TACTICAL_BG.neonSoft}
          strokeWidth={0.08}
          vectorEffect="non-scaling-stroke"
          opacity={0.28}
        />

        <g
          fill={TACTICAL_BG.neonMid}
          opacity="0.2"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          fontSize="2.2"
          fontWeight="700"
          letterSpacing="0.06em"
        >
          {HUD_LINES.map((block, bi) =>
            block.lines.map((line, li) => (
              <text
                key={`${bi}-${li}`}
                x={block.x}
                y={block.y + li * 2.45}
                textAnchor={block.anchor}
              >
                {line}
              </text>
            )),
          )}
        </g>

        {/* 極細戰術路徑線（平行主廊、部分虛線） */}
        <g strokeLinecap="round" strokeLinejoin="round" fill="none">
          {decorA ? (
            <path
              d={decorA}
              stroke={TACTICAL_BG.neonDim}
              strokeWidth={0.055}
              strokeDasharray={faintDash}
              opacity={0.38}
              className="mission-tactical-faint-dash"
            />
          ) : null}
          {decorB ? (
            <path
              d={decorB}
              stroke={TACTICAL_BG.neonSoft}
              strokeWidth={0.045}
              opacity={0.32}
            />
          ) : null}
          {decorC ? (
            <path
              d={decorC}
              stroke={TACTICAL_BG.neonDim}
              strokeWidth={0.04}
              strokeDasharray="0.35 0.7"
              opacity={0.28}
              className="mission-tactical-faint-dash"
            />
          ) : null}
          {extras.map((seg, i) => (
            <line
              key={`ex-${i}`}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke={TACTICAL_BG.neonDim}
              strokeWidth={0.04}
              {...(seg.dash ? { strokeDasharray: seg.dash } : {})}
              opacity={0.26}
            />
          ))}
        </g>

        {arrows.map((a, i) => (
          <TinyArrow key={`a-${i}`} x={a.x} y={a.y} deg={a.deg} />
        ))}

        {routeD ? (
          <g>
            <path
              d={routeD}
              fill="none"
              stroke={TACTICAL_BG.blackLift}
              strokeWidth={0.48}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
            <path
              d={routeD}
              fill="none"
              stroke={TACTICAL_BG.trace}
              strokeWidth={0.14}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={routeDash}
              className="mission-route-flow-dash"
              opacity="0.78"
            />
          </g>
        ) : null}
      </g>
    </svg>
  );
}
