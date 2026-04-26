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
    lines: [
      "LOC 38°26.4'N / 122°01.1'E",
      'GRID REF 38.441N / 122.019E',
      'IFF PENDING / HOSTILE',
      'ELINT SIG LOW',
    ],
  },
  {
    x: 97.8,
    y: 6,
    anchor: 'end',
    lines: [
      "LOC 22°38'N / 120°18'E",
      'UPLINK VHF 142.000 MHz',
      'SCAN PRF 820 Hz',
      'MODE 4 CRYPTO OK',
    ],
  },
  {
    x: 2.2,
    y: 96,
    anchor: 'start',
    lines: [
      "LOC 25°05'N / 121°31'E",
      'TACNET NODE 07',
      'BDA NO SPOT REPORT',
      'EMCON ALPHA',
    ],
  },
  {
    x: 97.5,
    y: 95,
    anchor: 'end',
    lines: [
      "LOC 24°48'N / 120°58'E",
      'ALT CORR +12m MSL',
      'DTG ZULU SYNC',
      'EW PASSIVE ONLY',
    ],
  },
];

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
 * 以 seed 生成「有機等高線」路徑（近似地形圖）：一組同心但略微不規則的閉合曲線。
 * viewBox 空間為 0..100。等高線中心落在地圖右上／偏右，與雷達中心錯開，更有戰略圖味道。
 */
/**
 * 等高線群組：用兩個中心、各自一組不規則同心閉合曲線，模仿真正地形圖的雙山脊感。
 * 每一圈額外加入切線擾動，讓線條彎曲不會像單純橢圓。
 */
function topoContourPaths(seed: number, chapter: number): Array<{ d: string; group: number; rank: number }> {
  const chapterBias = Math.max(1, chapter) * 0.73;
  const centers = [
    { x: 24 + ((seed * 13 + chapter * 7) % 10) - 5, y: 60 + ((seed * 5 + chapter * 3) % 12) - 6 },
    { x: 72 + ((seed * 11 + chapter * 5) % 12) - 6, y: 38 + ((seed * 9 + chapter * 2) % 11) - 5 },
    { x: 50 + ((seed * 17 + chapter * 11) % 13) - 6, y: 20 + ((seed * 3 + chapter * 9) % 10) - 5 },
    { x: 18 + ((seed * 19 + chapter * 13) % 10) - 5, y: 22 + ((seed * 23 + chapter * 7) % 10) - 5 },
    { x: 82 + ((seed * 7 + chapter * 17) % 10) - 5, y: 78 + ((seed * 13 + chapter * 19) % 10) - 5 },
    { x: 62 + ((seed * 29 + chapter * 23) % 12) - 6, y: 66 + ((seed * 31 + chapter * 29) % 10) - 5 },
    { x: 38 + ((seed * 37 + chapter * 31) % 12) - 6, y: 44 + ((seed * 41 + chapter * 37) % 12) - 6 },
  ];
  const ringsPerGroup = 14;
  const segs = 96;
  const out: Array<{ d: string; group: number; rank: number }> = [];
  for (let g = 0; g < centers.length; g += 1) {
    const cen = centers[g]!;
    const rotBias = seed * 0.37 + g * 1.17 + chapterBias;
    for (let i = 0; i < ringsPerGroup; i += 1) {
      const baseR = 2 + i * 2.65;
      const driftX =
        Math.sin(rotBias * 0.6 + i * 0.85) * 0.55 + Math.cos((i + 1) * 0.42 + chapterBias) * 0.35;
      const driftY =
        Math.cos(rotBias * 0.5 - i * 0.7) * 0.6 + Math.sin((i + 2) * 0.46 + chapterBias * 0.8) * 0.32;
      let d = '';
      for (let s = 0; s <= segs; s += 1) {
        const t = (s / segs) * Math.PI * 2;
        const wob =
          Math.sin(t * 3 + rotBias + i * 0.9) * 1.35 +
          Math.sin(t * 5 + rotBias * 1.2 - i * 0.55) * 0.9 +
          Math.sin(t * 2 + rotBias * 0.4 + i * 1.4) * 2.05 +
          Math.sin(t * 7 + rotBias * 0.7 + i * 0.25) * 0.55 +
          Math.cos(t * 11 - rotBias * 0.2 + i * 0.18) * 0.32;
        const r = Math.max(1, baseR + wob);
        const squash = 0.66 + (g % 4) * 0.08;
        const skew = Math.sin(t * 2 + rotBias * 0.3) * (0.08 + (i % 3) * 0.02);
        const x = cen.x + driftX + Math.cos(t) * r + Math.sin(t) * r * skew;
        const y = cen.y + driftY + Math.sin(t) * r * squash;
        d += s === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
      out.push({ d, group: g, rank: i });
    }
  }
  return out;
}

/**
 * 戰術地圖背景：深黑底 + 等高線地形 + 大雷達掃描扇形；線條於節點處挖空不遮六角。
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
  const sweepGradId = `tacticalSweep-${sid}`;

  const routeD = buildTacticalRouteSmoothD(routePoints, 0.3);
  const decorA = routePoints.length >= 2 ? buildParallelSmoothD(routePoints, 2.4, false, 0.26) : '';
  const decorB = routePoints.length >= 2 ? buildParallelSmoothD(routePoints, -2.1, true, 0.22) : '';
  const decorC = routePoints.length >= 2 ? buildParallelSmoothD(routePoints, 3.6, true, 0.2) : '';

  const routeDash = visualSeed % 3 === 0 ? '1.2 1.9' : visualSeed % 3 === 1 ? '1.0 1.6' : '1.35 2.0';
  const faintDash = '0.45 0.85';
  const noiseSeed = Math.abs(visualSeed % 17) + 1;

  const arrows = segmentMidArrows(routePoints);
  const extras = extraTacticalSegments(visualSeed);

  const NODE_MASK_R = 5.6;
  /** 雷達中心偏左上，讓扇形掃過主要戰區（與等高線中心錯開） */
  const radarCx = 40;
  const radarCy = 52;
  /** 附圖中大圓幾乎覆蓋整張地圖 */
  const radarR = 62;

  const contours = topoContourPaths(noiseSeed, chapter);

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
          <stop offset="0%" stopColor="#071208" stopOpacity="0.78" />
          <stop offset="50%" stopColor="#020403" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0a140c" stopOpacity="0.75" />
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
            stroke="#3FB56D"
            strokeWidth="0.06"
            opacity="0.1"
          />
        </pattern>
        <pattern id={gridCoarseId} width="14" height="14" patternUnits="userSpaceOnUse">
          <path
            d="M 14 0 L 0 0 0 14"
            fill="none"
            stroke="#3FB56D"
            strokeWidth="0.05"
            opacity="0.1"
          />
        </pattern>
        <radialGradient id={`mapAmbient-${sid}`} cx="50%" cy="52%" r="72%">
          <stop offset="0%" stopColor={TACTICAL_BG.neonSoft} stopOpacity="0.08" />
          <stop offset="88%" stopColor={TACTICAL_BG.black} stopOpacity="0" />
        </radialGradient>
        {/* 雷達掃描扇形：用圓錐漸層，沿雷達中心旋轉 */}
        <radialGradient id={sweepGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#39ff7a" stopOpacity="0.26" />
          <stop offset="65%" stopColor="#39ff7a" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#39ff7a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="100" height="100" fill={TACTICAL_BG.black} />
      <rect x="0" y="0" width="100" height="100" fill={`url(#${satTintId})`} opacity="0.72" />
      <rect x="0" y="0" width="100" height="100" filter={`url(#${satFilterId})`} opacity="0.12" />
      <rect x="0" y="0" width="100" height="100" fill={`url(#mapAmbient-${sid})`} />
      <rect x="0" y="0" width="100" height="100" fill={`url(#${gridCoarseId})`} opacity="0.45" />
      <rect x="0" y="0" width="100" height="100" fill={`url(#${gridId})`} opacity="0.25" />

      {/* 等高線地形：多中心 × 高密度不規則閉合曲線；主圈每 4 層特別亮 */}
      <g
        mask={`url(#${nodeMaskId})`}
        fill="none"
        stroke="#3FB56D"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {contours.map((c, i) => {
          const isIndex = c.rank % 4 === 0;
          return (
            <path
              key={`topo-${i}`}
              d={c.d}
              strokeWidth={isIndex ? 0.12 : 0.075}
              opacity={isIndex ? 0.32 : 0.16 + (c.rank % 5) * 0.026}
              strokeDasharray={c.rank % 3 === 0 ? '0.42 0.95' : c.rank % 2 === 0 ? undefined : '0.54 1.08'}
            />
          );
        })}
      </g>

      <g mask={`url(#${nodeMaskId})`}>
        {/* 大雷達掃描：固定底盤環 + 旋轉掃描扇形 */}
        <g opacity={0.75}>
          <circle
            cx={radarCx}
            cy={radarCy}
            r={radarR}
            fill="none"
            stroke="#39ff7a"
            strokeOpacity={0.22}
            strokeWidth={0.18}
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={radarCx}
            cy={radarCy}
            r={radarR * 0.68}
            fill="none"
            stroke="#39ff7a"
            strokeOpacity={0.14}
            strokeWidth={0.1}
            strokeDasharray="0.8 1.2"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={radarCx}
            cy={radarCy}
            r={radarR * 0.34}
            fill="none"
            stroke="#39ff7a"
            strokeOpacity={0.12}
            strokeWidth={0.08}
            strokeDasharray="0.5 0.8"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={radarCx - radarR}
            y1={radarCy}
            x2={radarCx + radarR}
            y2={radarCy}
            stroke="#39ff7a"
            strokeOpacity={0.1}
            strokeWidth={0.06}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={radarCx}
            y1={radarCy - radarR}
            x2={radarCx}
            y2={radarCy + radarR}
            stroke="#39ff7a"
            strokeOpacity={0.1}
            strokeWidth={0.06}
            vectorEffect="non-scaling-stroke"
          />
        </g>

        {/* 旋轉掃描扇形（以雷達中心為原點 rotate） */}
        <g
          className="mission-tactical-radar-sweep"
          style={{ transformOrigin: `${radarCx}px ${radarCy}px`, transformBox: 'fill-box' }}
        >
          <path
            d={`M ${radarCx} ${radarCy} L ${radarCx + radarR} ${radarCy} A ${radarR} ${radarR} 0 0 0 ${radarCx + Math.cos(-Math.PI / 3) * radarR} ${radarCy + Math.sin(-Math.PI / 3) * radarR} Z`}
            fill={`url(#${sweepGradId})`}
            opacity={0.9}
          />
          {/* 掃描前緣亮線 */}
          <line
            x1={radarCx}
            y1={radarCy}
            x2={radarCx + radarR}
            y2={radarCy}
            stroke="#39ff7a"
            strokeOpacity={0.5}
            strokeWidth={0.18}
            vectorEffect="non-scaling-stroke"
          />
        </g>

        {/* 中心短漣漪（保留原本節拍） */}
        <circle
          className="mission-tactical-radar-pulse"
          cx={radarCx}
          cy={radarCy}
          r={2.2}
          fill="none"
          stroke={TACTICAL_BG.neonDim}
          strokeWidth={0.1}
          vectorEffect="non-scaling-stroke"
          opacity={0.35}
        />
        <circle
          className="mission-tactical-radar-pulse mission-tactical-radar-pulse--echo"
          cx={radarCx}
          cy={radarCy}
          r={2.2}
          fill="none"
          stroke={TACTICAL_BG.neonSoft}
          strokeWidth={0.08}
          vectorEffect="non-scaling-stroke"
          opacity={0.22}
        />

        <g
          fill="#3FB56D"
          opacity="0.3"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          fontSize="1.95"
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
              strokeWidth={0.05}
              strokeDasharray={faintDash}
              opacity={0.22}
              className="mission-tactical-faint-dash"
            />
          ) : null}
          {decorB ? (
            <path d={decorB} stroke={TACTICAL_BG.neonSoft} strokeWidth={0.04} opacity={0.2} />
          ) : null}
          {decorC ? (
            <path
              d={decorC}
              stroke={TACTICAL_BG.neonDim}
              strokeWidth={0.035}
              strokeDasharray="0.35 0.7"
              opacity={0.18}
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
            {/* 底層：深色帶，製造路徑溝槽 */}
            <path
              d={routeD}
              fill="none"
              stroke="#01140a"
              strokeWidth={1.1}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
            {/* 雙股平行虛線：主軌 + 副軌，皆流動，保留透氣感 */}
            {(() => {
              const mainA = buildParallelSmoothD(routePoints, 0.55, false, 0.3);
              const mainB = buildParallelSmoothD(routePoints, 0.55, true, 0.3);
              return (
                <>
                  {/* 軌跡外暈（淡綠寬帶，讓雙股有共同光暈） */}
                  <path
                    d={routeD}
                    fill="none"
                    stroke="#39ff7a"
                    strokeWidth={0.85}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.14"
                  />
                  {mainA ? (
                    <path
                      d={mainA}
                      fill="none"
                      stroke="#39ff7a"
                      strokeWidth={0.22}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="1.4 1.6"
                      className="mission-route-flow-dash"
                      opacity="0.88"
                    />
                  ) : null}
                  {mainB ? (
                    <path
                      d={mainB}
                      fill="none"
                      stroke="#b7ffd0"
                      strokeWidth={0.18}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="1.0 1.8"
                      className="mission-route-flow-dash mission-route-flow-dash--reverse"
                      opacity="0.72"
                    />
                  ) : null}
                </>
              );
            })()}
          </g>
        ) : null}
      </g>
    </svg>
  );
}
