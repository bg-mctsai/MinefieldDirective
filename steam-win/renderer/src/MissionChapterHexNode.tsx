import { memo, useId, useState } from 'react';
import { Lock } from 'lucide-react';

const HEX_PATH =
  'M 0,-10 L 8.66,-5 L 8.66,5 L 0,10 L -8.66,5 L -8.66,-5 Z';

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
}: {
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
}) {
  const [hover, setHover] = useState(false);
  const neonFilterId = useId().replace(/:/g, '');

  const ring = selected
    ? 'ring-2 ring-[#F59E0B] ring-offset-2 ring-offset-[#0a0d12]'
    : '';

  const fill = locked
    ? 'fill-[#0c1018]/95 stroke-slate-500'
    : cleared
      ? 'fill-emerald-950/92 stroke-[#39ff14]/75'
      : isBoss
        ? 'fill-[#0a120e]/95 stroke-[#39ff14]/65'
        : 'fill-[#0a100d]/95 stroke-[#22c55e]/70';

  const glowClass = hover ? 'mission-hex-glow-strong' : 'mission-hex-glow-base';

  return (
    <button
      type="button"
      data-mission-hex="1"
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ left: `${xPct}%`, top: `${yPct}%` }}
      className={`mission-hex-tactical-btn group absolute z-20 h-[3.25rem] w-[3.25rem] -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39ff14]/70 ${ring} transition-transform active:scale-[0.98] ${locked ? 'cursor-not-allowed opacity-55' : 'hover:scale-[1.06]'}`}
      aria-pressed={selected}
      aria-label={`關卡 ${stage}${locked ? '（鎖定）' : ''}`}
    >
      {inProgress && !locked ? (
        <span
          className="mission-hex-next-challenge pointer-events-none absolute inset-[-5px] rounded-full"
          aria-hidden
        />
      ) : null}
      {confirmFlash && !locked ? (
        <span
          className="mission-hex-confirm-flash pointer-events-none absolute inset-[-8px] rounded-full"
          aria-hidden
        />
      ) : null}
      <div className="relative h-full w-full">
        <span
          className={`mission-hex-neon-bloom pointer-events-none absolute inset-[-12px] rounded-full opacity-60 blur-md transition-all duration-300 ${hover ? 'mission-hex-bloom-pulse scale-110 opacity-100' : ''}`}
          style={{
            background:
              'radial-gradient(circle, rgba(57,255,20,0.42) 0%, rgba(34,211,153,0.18) 42%, transparent 72%)',
          }}
          aria-hidden
        />
        <svg
          viewBox="-14 -14 28 28"
          className={`relative z-[1] h-full w-full transition-[filter] duration-300 ${glowClass}`}
          aria-hidden
        >
          <defs>
            <filter id={neonFilterId} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.9" result="g" />
              <feMerge>
                <feMergeNode in="g" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d={HEX_PATH}
            className={`transition-colors ${fill}`}
            strokeWidth="1.25"
            vectorEffect="non-scaling-stroke"
            filter={`url(#${neonFilterId})`}
          />
          {selected ? (
            <path
              d={HEX_PATH}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="0.85"
              opacity="0.55"
              vectorEffect="non-scaling-stroke"
              transform="scale(1.08)"
            />
          ) : null}
        </svg>
        <span className="pointer-events-none absolute inset-0 z-[2] flex flex-col items-center justify-center gap-0.5">
          {locked ? <Lock className="text-slate-500" size={11} strokeWidth={2.25} aria-hidden /> : null}
          <span
            className={`font-mono text-[10px] font-black leading-none drop-shadow-[0_0_6px_rgba(57,255,20,0.55)] ${locked ? 'text-slate-500' : cleared ? 'text-[#4ade80]' : 'text-[#86efac]'
              }`}
          >
            {String(stage).padStart(2, '0')}
          </span>
        </span>
      </div>
    </button>
  );
});
