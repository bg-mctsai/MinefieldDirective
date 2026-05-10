import { useMemo } from 'react';
import { buildTacticalRouteSmoothD } from './missionChapterTacticalRoute';
import {
  TACTICAL_BG,
  buildParallelSmoothD,
  extraTacticalSegments,
  segmentMidArrows,
  type Pt,
} from './missionChapterTacticalBackdropDecor';
import { missionBackdropGeographyLabels } from './missionChapterBackdropGeography';
import { missionTerrainSrcForLevel } from './missionTerrainByChapter';

export type MissionChapterTacticalBackdropPalette = {
  neon: string;
  neonSoft: string;
  warn: string;
  grid: string;
};

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
 * 戰術地圖背景：點陣地形滿版父層（父層寬高＝cover 後的整張圖像素）；
 * SVG 疊暗色／網格／雷達／路徑（preserveAspectRatio none，與關卡節點百分比座標對齊）。
 */
export function MissionChapterTacticalBackdrop({
  chapter,
  routePoints,
  palette: _palette,
  visualSeed,
  className = '',
  onTerrainNaturalSize,
}: {
  chapter: number;
  routePoints: Pt[];
  palette: MissionChapterTacticalBackdropPalette;
  visualSeed: number;
  className?: string;
  /** 底圖載入後回報像素尺寸，供外層計算可平移範圍（整張圖可逛完且視窗永遠被地圖填滿） */
  onTerrainNaturalSize?: (naturalWidth: number, naturalHeight: number) => void;
}) {
  void _palette;
  const sid = `${chapter}-${visualSeed}`;
  const gridId = `tacticalGrid-${sid}`;
  const gridCoarseId = `tacticalGridCoarse-${sid}`;
  const satFilterId = `satTerrain-${sid}`;
  const satTintId = `satTint-${sid}`;
  const sweepGradId = `tacticalSweep-${sid}`;
  const mapSheenId = `mapSheen-${sid}`;
  const mapVignetteId = `mapVignette-${sid}`;
  const scanPatternId = `tacticalScan-${sid}`;

  const faintDash = '0.45 0.85';
  const noiseSeed = Math.abs(visualSeed % 17) + 1;

  const routeD = useMemo(() => buildTacticalRouteSmoothD(routePoints, 0.3), [routePoints]);
  const decorA = useMemo(
    () => (routePoints.length >= 2 ? buildParallelSmoothD(routePoints, 2.4, false, 0.26) : ''),
    [routePoints],
  );
  const decorB = useMemo(
    () => (routePoints.length >= 2 ? buildParallelSmoothD(routePoints, -2.1, true, 0.22) : ''),
    [routePoints],
  );
  const decorC = useMemo(
    () => (routePoints.length >= 2 ? buildParallelSmoothD(routePoints, 3.6, true, 0.2) : ''),
    [routePoints],
  );
  const routeTwinPaths = useMemo(() => {
    if (routePoints.length < 2) return { mainA: '', mainB: '' };
    return {
      mainA: buildParallelSmoothD(routePoints, 0.55, false, 0.3),
      mainB: buildParallelSmoothD(routePoints, 0.55, true, 0.3),
    };
  }, [routePoints]);

  const arrows = useMemo(() => segmentMidArrows(routePoints), [routePoints]);
  const extras = useMemo(() => extraTacticalSegments(visualSeed), [visualSeed]);
  const geoLabels = useMemo(() => missionBackdropGeographyLabels(chapter), [chapter]);

  /** 雷達中心偏左上，讓扇形掃過主要戰區（與等高線中心錯開） */
  const radarCx = 40;
  const radarCy = 52;
  /** 附圖中大圓幾乎覆蓋整張地圖 */
  const radarR = 62;
  const terrainSrc = missionTerrainSrcForLevel(visualSeed, chapter);

  return (
    <div className={`pointer-events-none absolute inset-0 h-full w-full select-none ${className}`}>
      <div className="absolute inset-0 bg-[#010302]" aria-hidden />
      <img
        key={terrainSrc}
        src={terrainSrc}
        alt=""
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover object-center [image-rendering:high-quality] [filter:brightness(1.05)_contrast(1.06)_saturate(0.86)]"
        onLoad={(e) => {
          const { naturalWidth: nw, naturalHeight: nh } = e.currentTarget;
          if (nw > 0 && nh > 0) onTerrainNaturalSize?.(nw, nh);
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
      <defs>
        {/** 中性冷灰罩：取代偏綠的 sat tint，保留壓光不染色 */}
        <linearGradient id={satTintId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#060708" stopOpacity="0.72" />
          <stop offset="50%" stopColor="#030405" stopOpacity="0.52" />
          <stop offset="100%" stopColor="#08090a" stopOpacity="0.68" />
        </linearGradient>
        <filter id={satFilterId} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.022 0.032"
            numOctaves="2"
            seed={noiseSeed}
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0.12 0.11 0.1 0 0.018
                    0.11 0.12 0.1 0 0.018
                    0.1 0.11 0.12 0 0.018
                    0 0 0 0.34 0"
            result="colored"
          />
        </filter>
        <linearGradient id={mapSheenId} x1="0.08" y1="0" x2="0.92" y2="1">
          <stop offset="0%" stopColor="#0c0e10" stopOpacity="0" />
          <stop offset="42%" stopColor="#6b7c74" stopOpacity="0.04" />
          <stop offset="58%" stopColor="#1a1f1c" stopOpacity="0.028" />
          <stop offset="100%" stopColor="#020806" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={mapVignetteId} cx="50%" cy="46%" r="78%">
          <stop offset="0%" stopColor="#010302" stopOpacity="0" />
          <stop offset="58%" stopColor="#010302" stopOpacity="0" />
          <stop offset="82%" stopColor="#010302" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.48" />
        </radialGradient>
        <pattern id={scanPatternId} width="100" height="0.55" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="100" y2="0" stroke="#000000" strokeOpacity="0.22" strokeWidth="0.045" />
        </pattern>
        <pattern id={gridId} width="4" height="4" patternUnits="userSpaceOnUse">
          <path
            d="M 4 0 L 0 0 0 4"
            fill="none"
            stroke="#64748b"
            strokeWidth="0.06"
            opacity="0.08"
          />
        </pattern>
        <pattern id={gridCoarseId} width="14" height="14" patternUnits="userSpaceOnUse">
          <path
            d="M 14 0 L 0 0 0 14"
            fill="none"
            stroke="#64748b"
            strokeWidth="0.05"
            opacity="0.07"
          />
        </pattern>
        <radialGradient id={`mapAmbient-${sid}`} cx="50%" cy="52%" r="72%">
          <stop offset="0%" stopColor="#94a3a8" stopOpacity="0.035" />
          <stop offset="88%" stopColor={TACTICAL_BG.black} stopOpacity="0" />
        </radialGradient>
        {/* 雷達掃描扇形：用圓錐漸層，沿雷達中心旋轉 */}
        <radialGradient id={sweepGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#39ff7a" stopOpacity="0.26" />
          <stop offset="65%" stopColor="#39ff7a" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#39ff7a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="100" height="100" fill={TACTICAL_BG.black} opacity="0.2" />
      <rect x="0" y="0" width="100" height="100" fill={`url(#${satTintId})`} opacity="0.32" />
      {/** feTurbulence 地形顆粒：略降強度，避免戰術圖＋關卡圖示疊出「髒感」 */}
      <rect x="0" y="0" width="100" height="100" filter={`url(#${satFilterId})`} opacity="0.035" />
      <rect x="0" y="0" width="100" height="100" fill={`url(#${mapSheenId})`} />
      <rect x="0" y="0" width="100" height="100" fill={`url(#mapAmbient-${sid})`} />
      <rect x="0" y="0" width="100" height="100" fill={`url(#${gridCoarseId})`} opacity="0.12" />
      <rect x="0" y="0" width="100" height="100" fill={`url(#${gridId})`} opacity="0.06" />
      {/** 極淡掃描線：指揮台 CRT，不搶戰術線條 */}
      <rect x="0" y="0" width="100" height="100" fill={`url(#${scanPatternId})`} opacity="0.16" />

      <g>
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
              {routeTwinPaths.mainA ? (
                <path
                  d={routeTwinPaths.mainA}
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
              {routeTwinPaths.mainB ? (
                <path
                  d={routeTwinPaths.mainB}
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
          </g>
        ) : null}
      </g>

      {/** 暗角：收束視覺焦點，略壓四邊 */}
      <rect x="0" y="0" width="100" height="100" fill={`url(#${mapVignetteId})`} opacity="0.4" />
      </svg>

      {geoLabels.length > 0 ? (
        <div className="absolute inset-0 z-[2]" aria-hidden>
          {geoLabels.map((L) => {
            const align = L.align ?? 'middle';
            const tx =
              align === 'start'
                ? 'translate(0.35rem, -50%)'
                : align === 'end'
                  ? 'translate(calc(-100% - 0.35rem), -50%)'
                  : 'translate(-50%, -50%)';
            return (
              <div
                key={`${L.x}-${L.y}-${L.text}`}
                className="absolute whitespace-nowrap text-[clamp(9px,1.05vw,12px)] font-semibold leading-tight tracking-[0.06em] text-slate-300/88 [text-shadow:0_1px_2px_rgba(0,0,0,0.92),0_0_14px_rgba(15,23,42,0.55)]"
                style={{
                  left: `${L.x}%`,
                  top: `${L.y}%`,
                  transform: tx,
                }}
              >
                {L.text}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
