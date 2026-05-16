import { memo, useId, useMemo, useState, type CSSProperties } from 'react';
import { Lock } from 'lucide-react';
import type { Medal } from './game/medalThresholds';
import missionHexBase from './assets/mission-hex-badges/hex-base.png';
import missionHexBronze from './assets/mission-hex-badges/hex-bronze.png';
import missionHexGold from './assets/mission-hex-badges/hex-gold.png';
import missionHexSilver from './assets/mission-hex-badges/hex-silver.png';

type HexTone = { stroke: string; labelClass: string };
type HexPaintTier = 'gold' | 'silver' | 'bronze' | 'unearned' | 'objective';

const TIER_RASTER: Record<HexPaintTier, string> = {
  gold: missionHexGold,
  silver: missionHexSilver,
  bronze: missionHexBronze,
  unearned: missionHexBase,
  objective: missionHexBase,
};

const TIER_TEXT_GLOW: Record<HexPaintTier, string> = {
  gold: 'rgba(250, 204, 21, 0.42)',
  silver: 'rgba(125, 211, 252, 0.4)',
  bronze: 'rgba(251, 146, 60, 0.38)',
  unearned: 'rgba(34, 197, 94, 0.25)',
  objective: 'rgba(255, 159, 28, 0.45)',
};

type Theme = {
  rimA: string;
  rimB: string;
  coreA: string;
  coreB: string;
  edge: string;
  line: string;
  dim?: boolean;
};

function themeForPaint(tier: HexPaintTier): Theme {
  if (tier === 'gold') {
    return { rimA: '#fde047', rimB: '#a16207', coreA: '#1a1006', coreB: '#0a0804', edge: '#facc15', line: '#fffbeb' };
  }
  if (tier === 'silver') {
    return { rimA: '#7dd3fc', rimB: '#0369a1', coreA: '#0a1520', coreB: '#020617', edge: '#38bdf8', line: '#e0f2fe' };
  }
  if (tier === 'bronze') {
    return { rimA: '#fb923c', rimB: '#9a3412', coreA: '#1a0f0a', coreB: '#0a0604', edge: '#ea580c', line: '#ffedd5' };
  }
  if (tier === 'objective') {
    return { rimA: '#fb923c', rimB: '#c2410c', coreA: '#1a0d05', coreB: '#0a0402', edge: '#ff9f1c', line: '#ffedd5' };
  }
  return {
    rimA: '#334155',
    rimB: '#0f172a',
    coreA: '#040907',
    coreB: '#020a07',
    edge: '#2dd4a3',
    line: '#5eead4',
    dim: true,
  };
}

const HEX_D = 'M 0,-11 L 9.53,-5.5 L 9.53,5.5 L 0,11 L -9.53,5.5 L -9.53,-5.5 Z';
const HEX_INNER = 'M 0,-6.8 L 5.9,-3.4 L 5.9,3.4 L 0,6.8 L -5.9,3.4 L -5.9,-3.4 Z';

/** 戰術圖上徽章／光暈／選中框共用邊界（命中區已收斂為徽章＋標籤外一層薄 padding） */
const BADGE_FRAME_CLASS =
  'h-[5.65rem] w-[7.85rem] sm:h-[6.1rem] sm:w-[8.45rem]';

function WingedTierBadge({ tier, uid }: { tier: HexPaintTier; uid: string }) {
  const t = themeForPaint(tier);
  const gRim = `mwh-rim-${uid}`;
  const gCore = `mwh-core-${uid}`;
  const gSpark = `mwh-spark-${uid}`;

  return (
    <svg viewBox="0 0 100 64" className="h-full w-full max-h-full max-w-full select-none" fill="none" aria-hidden>
      <defs>
        <linearGradient id={gRim} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={t.rimA} />
          <stop offset="100%" stopColor={t.rimB} />
        </linearGradient>
        <linearGradient id={gCore} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor={t.coreA} />
          <stop offset="100%" stopColor={t.coreB} />
        </linearGradient>
        <radialGradient id={gSpark} cx="32%" cy="25%" r="60%">
          <stop offset="0%" stopColor={t.line} stopOpacity="0.5" />
          <stop offset="100%" stopColor={t.coreB} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform="translate(50 32)">
        <path
          d="M-22,-1L-50,-3L-54,0.5L-50,4L-22,2.5L-20,-1Z"
          fill={`url(#${gRim})`}
          fillOpacity="0.92"
        />
        <g transform="scale(-1,1)">
          <path
            d="M-22,-1L-50,-3L-54,0.5L-50,4L-22,2.5L-20,-1Z"
            fill={`url(#${gRim})`}
            fillOpacity="0.92"
          />
        </g>
        <path
          d={HEX_D}
          fill={`url(#${gRim})`}
          stroke={t.edge}
          strokeWidth="0.9"
          strokeLinejoin="miter"
        />
        <path
          d={HEX_D}
          fill={`url(#${gCore})`}
          stroke={t.edge}
          strokeWidth="0.35"
          strokeOpacity="0.45"
          transform="scale(0.75)"
        />
        <path
          d={HEX_INNER}
          fill={`url(#${gSpark})`}
          transform="scale(0.7)"
          opacity={0.8}
        />
        {t.dim ? (
          <g
            stroke={t.line}
            strokeWidth="0.4"
            strokeOpacity="0.55"
            fill="none"
            vectorEffect="non-scaling-stroke"
          >
            <circle r="4.2" strokeDasharray="0.4 0.5" transform="scale(0.9)" />
            <line x1="-1" y1="-8" x2="1" y2="-3" />
            <line x1="6" y1="3" x2="10" y2="-1" />
          </g>
        ) : null}
        <path
          d="M0,-2.4L0.5,-0.2L1.4,0.2L0,1.1L-1.4,0.2L-0.5,-0.2Z"
          fill={t.line}
          fillOpacity="0.65"
        />
      </g>
    </svg>
  );
}

function resolveHexPaintTier(options: {
  locked: boolean;
  inProgress: boolean;
  cleared: boolean;
  bestMedal?: Medal | null;
}): HexPaintTier {
  const { locked, inProgress, cleared, bestMedal } = options;
  if (locked) return 'unearned';
  if (inProgress) return 'objective';
  if (cleared) {
    if (bestMedal === 'gold') return 'gold';
    if (bestMedal === 'silver') return 'silver';
    if (bestMedal === 'bronze') return 'bronze';
    return 'unearned';
  }
  return 'unearned';
}

function missionHexDropShadow(options: {
  tier: HexPaintTier;
  hover: boolean;
  locked: boolean;
  inProgress: boolean;
  isBoss: boolean;
}): string {
  const { tier, hover, locked, inProgress, isBoss } = options;
  if (locked) return '';
  if (inProgress || isBoss) {
    return hover
      ? 'drop-shadow-[0_0_5px_rgba(255,159,28,0.9)] drop-shadow-[0_0_12px_rgba(255,159,28,0.45)]'
      : 'drop-shadow-[0_0_3px_rgba(255,159,28,0.75)] drop-shadow-[0_0_10px_rgba(255,159,28,0.32)]';
  }
  if (tier === 'gold') {
    return hover
      ? 'drop-shadow-[0_0_8px_rgba(250,204,21,0.85)] drop-shadow-[0_0_18px_rgba(202,138,4,0.45)]'
      : 'drop-shadow-[0_0_5px_rgba(250,204,21,0.65)] drop-shadow-[0_0_12px_rgba(202,138,4,0.3)]';
  }
  if (tier === 'silver') {
    return hover
      ? 'drop-shadow-[0_0_7px_rgba(56,189,248,0.85)] drop-shadow-[0_0_16px_rgba(8,145,178,0.4)]'
      : 'drop-shadow-[0_0_4px_rgba(56,189,248,0.6)] drop-shadow-[0_0_12px_rgba(8,145,178,0.25)]';
  }
  if (tier === 'bronze') {
    return hover
      ? 'drop-shadow-[0_0_7px_rgba(249,115,22,0.8)] drop-shadow-[0_0_15px_rgba(194,65,12,0.4)]'
      : 'drop-shadow-[0_0_4px_rgba(249,115,22,0.6)] drop-shadow-[0_0_11px_rgba(194,65,12,0.3)]';
  }
  if (tier === 'objective') {
    return hover
      ? 'drop-shadow-[0_0_7px_rgba(255,159,28,0.9)] drop-shadow-[0_0_16px_rgba(234,88,12,0.4)]'
      : 'drop-shadow-[0_0_4px_rgba(255,159,28,0.7)] drop-shadow-[0_0_12px_rgba(234,88,12,0.3)]';
  }
  return hover
    ? 'drop-shadow-[0_0_6px_rgba(16,185,129,0.5)] drop-shadow-[0_0_14px_rgba(4,20,10,0.45)]'
    : 'drop-shadow-[0_0_3px_rgba(20,100,60,0.4)] drop-shadow-[0_0_10px_rgba(0,0,0,0.3)]';
}

function resolveTone(options: {
  locked: boolean;
  cleared: boolean;
  inProgress: boolean;
  isBoss: boolean;
}): HexTone {
  const { locked, cleared, inProgress, isBoss } = options;
  if (locked) return { stroke: '#475569', labelClass: 'text-slate-500/85' };
  if (inProgress) return { stroke: '#FF9F1C', labelClass: 'text-amber-300' };
  if (isBoss) return { stroke: '#FF9F1C', labelClass: 'text-[#FF9F1C]' };
  if (cleared) return { stroke: '#39ff7a', labelClass: 'text-[#59e391]' };
  return { stroke: '#34d399', labelClass: 'text-[#59e391]' };
}

function stateLabelOf(options: {
  locked: boolean;
  cleared: boolean;
  inProgress: boolean;
  isBoss: boolean;
}): string {
  const { locked, cleared, inProgress, isBoss } = options;
  if (locked) return 'LOCKED';
  if (inProgress) return '目前進度';
  if (cleared) return '';
  if (isBoss) return 'BOSS';
  return '';
}

/** 主線下一關：四角 HUD 角標（非矩形選框，與一般選中區隔） */
function ObjectiveHudReticle() {
  const corner =
    'pointer-events-none absolute mission-hex-objective-reticle border-[#FFAE42] opacity-[0.92] shadow-[0_0_10px_rgba(255,159,28,0.45)]';
  return (
    <span className="pointer-events-none absolute inset-[5px] z-[4]" aria-hidden>
      <span className={`${corner} left-0 top-0 h-3 w-3 border-l-[2.5px] border-t-[2.5px] rounded-tl-[1px]`} />
      <span className={`${corner} right-0 top-0 h-3 w-3 border-r-[2.5px] border-t-[2.5px] rounded-tr-[1px]`} />
      <span className={`${corner} bottom-0 left-0 h-3 w-3 border-b-[2.5px] border-l-[2.5px] rounded-bl-[1px]`} />
      <span className={`${corner} bottom-0 right-0 h-3 w-3 border-b-[2.5px] border-r-[2.5px] rounded-br-[1px]`} />
    </span>
  );
}

function radialHaloForTier(
  inProgress: boolean,
  isBoss: boolean,
  tier: HexPaintTier,
): string {
  if (inProgress || isBoss) {
    return 'radial-gradient(circle, rgba(255,159,28,0.5) 0%, rgba(255,159,28,0.15) 45%, transparent 72%)';
  }
  if (tier === 'gold') {
    return 'radial-gradient(circle, rgba(250,204,21,0.35) 0%, rgba(180,100,0,0.1) 45%, transparent 72%)';
  }
  if (tier === 'silver') {
    return 'radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(8,100,120,0.1) 45%, transparent 72%)';
  }
  if (tier === 'bronze') {
    return 'radial-gradient(circle, rgba(249,115,22,0.32) 0%, rgba(150,50,0,0.1) 45%, transparent 72%)';
  }
  if (tier === 'objective') {
    return 'radial-gradient(circle, rgba(255,159,28,0.45) 0%, rgba(180,50,0,0.12) 45%, transparent 72%)';
  }
  return 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(4,40,20,0.08) 50%, transparent 72%)';
}

export const MissionChapterHexNode = memo(function MissionChapterHexNode({
  stage,
  xPct,
  yPct,
  selected,
  cleared,
  inProgress,
  locked,
  isBoss,
  onSelect,
  onDoubleClick,
  confirmFlash,
  bestMedal,
}: {
  /** 章內關次 1～8（作戰地圖節點顯示用） */
  stage: number;
  xPct: number;
  yPct: number;
  selected: boolean;
  cleared: boolean;
  inProgress: boolean;
  locked: boolean;
  isBoss: boolean;
  onSelect: () => void;
  onDoubleClick?: () => void;
  confirmFlash?: boolean;
  bestMedal?: Medal | null;
  clipKey?: string;
}) {
  const [hover, setHover] = useState(false);
  const uid = useId().replace(/:/g, '');
  const tone = resolveTone({ locked, cleared, inProgress, isBoss });
  const paint = resolveHexPaintTier({ locked, inProgress, cleared, bestMedal });
  const textGlow = TIER_TEXT_GLOW[paint];
  const stateLabel = stateLabelOf({ locked, cleared, inProgress, isBoss });
  const rasterSrc = TIER_RASTER[paint];

  const outerGlow = missionHexDropShadow({
    tier: paint,
    hover,
    locked,
    inProgress,
    isBoss,
  });
  const showCurrentPulse = inProgress && !locked;

  const tierRasterStyle = useMemo((): CSSProperties | undefined => {
    if (rasterSrc == null || locked) return undefined;
    return { mixBlendMode: 'normal' as const };
  }, [rasterSrc, locked]);

  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${xPct}%`, top: `${yPct}%` }}
    >
      <button
        type="button"
        data-mission-hex="1"
        onClick={onSelect}
        onDoubleClick={onDoubleClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`mission-hex-tactical-btn pointer-events-auto group relative mx-auto inline-flex max-w-[min(100%,10.5rem)] flex-col items-center justify-center rounded-lg border-0 bg-transparent px-2 py-2 shadow-none outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 sm:max-w-[min(100%,11.25rem)] ${
          locked ? 'cursor-not-allowed opacity-60' : 'hover:scale-[1.04]'
        } transition-transform active:scale-[0.98]`}
        aria-pressed={selected}
        aria-label={`章內第 ${stage} 關${isBoss ? '（章末）' : ''}${locked ? '（鎖定）' : ''}`}
      >
      {confirmFlash && !locked ? (
        <span
          className="mission-hex-confirm-flash pointer-events-none absolute inset-[-4px] rounded-lg"
          aria-hidden
        />
      ) : null}
      <div className="relative flex min-h-0 min-w-0 flex-col items-center justify-center">
        {!locked ? (
          <span
            className={`pointer-events-none absolute rounded-xl blur-md transition-opacity duration-300 ${hover ? 'opacity-100' : 'opacity-50'} ${
              showCurrentPulse ? '-inset-1' : '-inset-2'
            }`}
            style={{ background: radialHaloForTier(inProgress, isBoss, paint) }}
            aria-hidden
          />
        ) : null}

        <div className="relative z-[1] mx-auto flex flex-col items-center">
          <div
            className={`relative flex items-center justify-center overflow-visible rounded-md ${BADGE_FRAME_CLASS}`}
          >
            {showCurrentPulse ? <ObjectiveHudReticle /> : null}
            {selected && !showCurrentPulse ? (
              <span
                className="pointer-events-none absolute inset-0 z-0 rounded-md ring-[1.5px] ring-cyan-400/85 ring-offset-0"
                aria-hidden
              />
            ) : null}
            {rasterSrc != null ? (
              <img
                src={rasterSrc}
                width={400}
                height={256}
                alt=""
                draggable={false}
                className={`relative z-[1] block h-full w-full max-h-full max-w-full object-contain object-center select-none [image-rendering:auto] ${outerGlow}`}
                style={tierRasterStyle}
              />
            ) : (
              <div className={outerGlow + ' relative z-[1] h-full w-full'}>
                <WingedTierBadge tier={paint} uid={uid} />
              </div>
            )}
            <span className="pointer-events-none absolute inset-0 z-[3] flex flex-col items-center justify-center gap-0.5">
              {locked ? <Lock className="text-slate-500" size={13} strokeWidth={2.25} aria-hidden /> : null}
              <span
                className={`font-mono text-[19px] font-extrabold leading-none tracking-tight sm:text-[21px] ${locked ? 'text-slate-500' : 'text-white'}`}
                style={{
                  textShadow: locked ? 'none' : `0 0 1px rgba(0,0,0,0.95), 0 0 10px ${textGlow}`,
                }}
              >
                {stage}
              </span>
            </span>
          </div>
          {stateLabel ? (
            <span
              className={`pointer-events-none mt-1 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.14em] drop-shadow-[0_0_8px_rgba(0,0,0,0.95)] sm:text-[11px] ${tone.labelClass}`}
            >
              {stateLabel}
            </span>
          ) : null}
        </div>
      </div>
    </button>
    </div>
  );
});
