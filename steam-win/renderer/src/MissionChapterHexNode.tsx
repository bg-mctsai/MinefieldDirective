import { memo, useState } from 'react';
import { Lock } from 'lucide-react';
import type { Medal } from './game/medalThresholds';

/** 扁頂六角（flat-top 上下）— 一般關卡 */
const HEX_PATH = 'M 0,-10 L 8.66,-5 L 8.66,5 L 0,10 L -8.66,5 L -8.66,-5 Z';
/** 尖頂六角（pointy-top 左右扁）— 章末識別造型 */
const HEX_PATH_POINTY = 'M 10,0 L 5,-8.66 L -5,-8.66 L -10,0 L -5,8.66 L 5,8.66 Z';

/** 當前挑戰關橘色六角外框：比主六角放大更多，明顯包住內層 */
const HEX_PATH_SCALE_FACTOR_PULSE = 1.32;

type HexTone = {
  /** 主外框（HEX） */
  stroke: string;
  /** 狀態字 tailwind class */
  labelClass: string;
};

function resolveTone(options: {
  locked: boolean;
  cleared: boolean;
  inProgress: boolean;
  isBoss: boolean;
}): HexTone {
  const { locked, cleared, inProgress, isBoss } = options;
  if (locked) return { stroke: '#475569', labelClass: 'text-slate-500/85' };
  if (inProgress || isBoss) return { stroke: '#FF9F1C', labelClass: 'text-[#FF9F1C]' };
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
  if (inProgress) return 'CURRENT OBJECTIVE';
  if (cleared) return 'COMPLETED';
  if (isBoss) return 'BOSS';
  return '';
}

/** 以極座標產生 N 等分旋轉的 path 片段陣列（用於冠齒／齒紋） */
function polarCrownTeeth(count: number, outerR: number, innerR: number, halfWidth = 0.35): string {
  const parts: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    const cx = Math.cos(a);
    const cy = Math.sin(a);
    const tx = -Math.sin(a);
    const ty = Math.cos(a);
    const o1x = cx * outerR + tx * halfWidth;
    const o1y = cy * outerR + ty * halfWidth;
    const o2x = cx * outerR - tx * halfWidth;
    const o2y = cy * outerR - ty * halfWidth;
    const i1x = cx * innerR + tx * halfWidth * 2.2;
    const i1y = cy * innerR + ty * halfWidth * 2.2;
    const i2x = cx * innerR - tx * halfWidth * 2.2;
    const i2y = cy * innerR - ty * halfWidth * 2.2;
    parts.push(
      `M ${i1x.toFixed(2)} ${i1y.toFixed(2)} L ${o1x.toFixed(2)} ${o1y.toFixed(2)} L ${o2x.toFixed(2)} ${o2y.toFixed(2)} L ${i2x.toFixed(2)} ${i2y.toFixed(2)} Z`,
    );
  }
  return parts.join(' ');
}

/** 章末皇冠徽章：多層六角 rosette + 冠齒 + 環印 + 中央印信（SVG viewBox -14..14） */
function BossCrownEmblem() {
  const crownTeeth = polarCrownTeeth(12, 13.2, 11.2, 0.32);
  const innerTeeth = polarCrownTeeth(6, 7.4, 6.2, 0.28);

  return (
    <g>
      {/* 最外層：12 冠齒（六邊尖角對應的齒紋） */}
      <path
        d={crownTeeth}
        fill="#FF9F1C"
        opacity={0.88}
        stroke="#FF9F1C"
        strokeWidth={0.12}
        strokeLinejoin="round"
      />
      {/* 外框雙層輪廓 —— 12 角 rosette（扁頂 + 尖頂兩六角疊合） */}
      <path
        d={HEX_PATH}
        fill="none"
        stroke="#FF9F1C"
        strokeWidth={0.95}
        opacity={0.9}
        strokeLinejoin="miter"
        vectorEffect="non-scaling-stroke"
        transform="scale(1.04) rotate(30)"
      />
      <path
        d={HEX_PATH}
        fill="none"
        stroke="#FF9F1C"
        strokeWidth={0.55}
        opacity={0.45}
        strokeLinejoin="miter"
        vectorEffect="non-scaling-stroke"
        transform="scale(1.22)"
      />
      <path
        d={HEX_PATH}
        fill="none"
        stroke="#FF9F1C"
        strokeWidth={0.35}
        opacity={0.25}
        strokeLinejoin="miter"
        vectorEffect="non-scaling-stroke"
        transform="scale(1.34)"
      />
      {/* 中層印環：一圈細虛線，營造徽章感 */}
      <circle
        cx={0}
        cy={0}
        r={8.4}
        fill="none"
        stroke="#FF9F1C"
        strokeWidth={0.22}
        strokeDasharray="0.8 0.8"
        opacity={0.65}
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={0}
        cy={0}
        r={7.4}
        fill="none"
        stroke="#FF9F1C"
        strokeWidth={0.16}
        opacity={0.35}
        vectorEffect="non-scaling-stroke"
      />
      {/* 內層 6 齒紋（呼應皇冠） */}
      <path
        d={innerTeeth}
        fill="#FF9F1C"
        opacity={0.6}
        stroke="none"
      />
      {/* 中央印信：小六角輪廓（數字就落在這個印信中） */}
      <path
        d={HEX_PATH}
        fill="none"
        stroke="#FF9F1C"
        strokeWidth={0.5}
        opacity={0.75}
        strokeLinejoin="miter"
        vectorEffect="non-scaling-stroke"
        transform="scale(0.5)"
      />
      {/* 左右外側雙層 hazard 指標 */}
      <g fill="#FF9F1C" opacity={0.95} stroke="#FF9F1C" strokeWidth={0.2} strokeLinejoin="round">
        <path d="M -12.6,-1 L -12.6,1 L -11,0 Z" />
        <path d="M 12.6,-1 L 12.6,1 L 11,0 Z" />
      </g>
    </g>
  );
}

/** 四角 targeting bracket（附圖那種小括號點）— 繪於 SVG 內部座標 -14..14 */
function TargetingBrackets({ color, opacity = 0.95 }: { color: string; opacity?: number }) {
  const arm = 2.4;
  const off = 11.2;
  const sw = 0.9;
  const lines: Array<[number, number, number, number]> = [
    [-off, -off + arm, -off, -off],
    [-off, -off, -off + arm, -off],
    [off, -off + arm, off, -off],
    [off, -off, off - arm, -off],
    [-off, off - arm, -off, off],
    [-off, off, -off + arm, off],
    [off, off - arm, off, off],
    [off, off, off - arm, off],
  ];
  return (
    <g stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={opacity} fill="none">
      {lines.map((l, i) => (
        <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  );
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
}) {
  const [hover, setHover] = useState(false);
  const tone = resolveTone({ locked, cleared, inProgress, isBoss });
  const stateLabel = stateLabelOf({ locked, cleared, inProgress, isBoss });

  /** 章末用尖頂六角（與其他關的扁頂六角一眼區分，又不會銳利過頭像星星） */
  const shapePath = isBoss ? HEX_PATH_POINTY : HEX_PATH;

  /** 選中框改用同形六角描邊（SVG 內），不再用 tailwind 的圓 ring */
  const ring = '';

  const outerGlow = locked
    ? ''
    : inProgress || isBoss
      ? hover
        ? 'drop-shadow-[0_0_6px_rgba(255,159,28,0.95)] drop-shadow-[0_0_18px_rgba(255,159,28,0.55)]'
        : 'drop-shadow-[0_0_4px_rgba(255,159,28,0.8)] drop-shadow-[0_0_14px_rgba(255,159,28,0.42)]'
      : hover
        ? 'drop-shadow-[0_0_6px_rgba(57,255,122,0.9)] drop-shadow-[0_0_16px_rgba(57,255,122,0.45)]'
        : 'drop-shadow-[0_0_3px_rgba(57,255,122,0.55)] drop-shadow-[0_0_10px_rgba(57,255,122,0.22)]';

  /** 當前挑戰：外層同形呼吸描邊（不是圓圈） */
  const showShapePulse = inProgress && !locked;

  return (
    <button
      type="button"
      data-mission-hex="1"
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ left: `${xPct}%`, top: `${yPct}%` }}
      className={`mission-hex-tactical-btn group absolute z-20 h-[4.2rem] w-[4.2rem] -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39ff14]/70 sm:h-[4.8rem] sm:w-[4.8rem] ${ring} transition-transform active:scale-[0.98] ${locked ? 'cursor-not-allowed opacity-60' : 'hover:scale-[1.06]'}`}
      aria-pressed={selected}
      aria-label={`關卡 ${stage}${isBoss ? '（章末）' : ''}${locked ? '（鎖定）' : ''}`}
    >
      {confirmFlash && !locked ? (
        <span
          className="mission-hex-confirm-flash pointer-events-none absolute inset-[-8px] rounded-full"
          aria-hidden
        />
      ) : null}
      <div className="relative h-full w-full">
        {!locked ? (
          <span
            className={`pointer-events-none absolute inset-[-10px] rounded-full blur-md transition-opacity duration-300 ${hover ? 'opacity-100' : 'opacity-55'}`}
            style={{
              background: inProgress || isBoss
                ? 'radial-gradient(circle, rgba(255,159,28,0.55) 0%, rgba(255,159,28,0.18) 45%, transparent 72%)'
                : cleared
                  ? 'radial-gradient(circle, rgba(57,255,122,0.4) 0%, rgba(52,211,153,0.15) 45%, transparent 72%)'
                  : 'radial-gradient(circle, rgba(57,255,122,0.3) 0%, rgba(52,211,153,0.12) 45%, transparent 72%)',
            }}
            aria-hidden
          />
        ) : null}
        <svg
          viewBox="-14 -14 28 28"
          className={`relative z-[1] h-full w-full transition-[filter] duration-300 ${outerGlow}`}
          aria-hidden
        >
          {/* 內層最深底：確保數字高對比 */}
          <path d={shapePath} fill="#04070a" stroke="none" />
          {/* 外層粗邊 */}
          <path
            d={shapePath}
            fill="none"
            stroke={tone.stroke}
            strokeWidth={selected ? 1.9 : 1.55}
            strokeLinejoin="miter"
            vectorEffect="non-scaling-stroke"
          />
          {/* 當前挑戰：外層放大版橘色六角框（明顯包住內層，不是圓圈） */}
          {showShapePulse ? (
            <path
              d={shapePath}
              fill="none"
              stroke="#FF9F1C"
              strokeWidth={1.35}
              strokeLinejoin="miter"
              vectorEffect="non-scaling-stroke"
              transform={`scale(${HEX_PATH_SCALE_FACTOR_PULSE})`}
              className="mission-hex-shape-pulse"
            />
          ) : null}
          {/* 選中：套用「強化版」雙外框 + hazard 指標（類章末規格，讓玩家看到強烈的選取回饋） */}
          {selected ? (
            <>
              <path
                d={shapePath}
                fill="none"
                stroke="#FF9F1C"
                strokeWidth={0.9}
                opacity={0.85}
                strokeLinejoin="miter"
                vectorEffect="non-scaling-stroke"
                transform="scale(1.18)"
              />
              <path
                d={shapePath}
                fill="none"
                stroke="#FF9F1C"
                strokeWidth={0.5}
                opacity={0.4}
                strokeLinejoin="miter"
                vectorEffect="non-scaling-stroke"
                transform="scale(1.3)"
              />
              <g
                fill="#FF9F1C"
                opacity={0.9}
                stroke="#FF9F1C"
                strokeWidth={0.22}
                strokeLinejoin="round"
              >
                {/* 扁頂 vs 尖頂，hazard 指標位置略不同（扁頂放上下邊中央、尖頂放左右頂點內側） */}
                {isBoss ? (
                  <>
                    <path d="M -8.4,-1.6 L -8.4,1.6 L -6.4,0 Z" />
                    <path d="M 8.4,-1.6 L 8.4,1.6 L 6.4,0 Z" />
                  </>
                ) : (
                  <>
                    <path d="M -1.6,-8.4 L 1.6,-8.4 L 0,-6.4 Z" />
                    <path d="M -1.6,8.4 L 1.6,8.4 L 0,6.4 Z" />
                  </>
                )}
              </g>
            </>
          ) : null}
          {/* 章末（Boss）：皇冠感複雜徽章 — 12 角 rosette + 冠齒 + 內部環印 + 中央小六角印信 */}
          {isBoss && !locked ? <BossCrownEmblem /> : null}
          {/* 四角 targeting bracket：當前挑戰/選中/hover 時顯示（章末固定顯） */}
          {!locked && (inProgress || selected || hover || isBoss) ? (
            <TargetingBrackets
              color={tone.stroke}
              opacity={inProgress || isBoss ? 1 : 0.75}
            />
          ) : null}
        </svg>
        <span className="pointer-events-none absolute inset-0 z-[2] flex flex-col items-center justify-center gap-0.5">
          {locked ? (
            <Lock className="text-slate-500" size={14} strokeWidth={2.25} aria-hidden />
          ) : null}
          <span
            className={`font-mono text-[16px] font-extrabold leading-none tracking-tight sm:text-[18px] ${locked ? 'text-slate-500' : 'text-white'}`}
            style={{ textShadow: locked ? 'none' : '0 0 1px rgba(0,0,0,0.95)' }}
          >
            {String(stage).padStart(2, '0')}
          </span>
        </span>
        {!locked && bestMedal ? (
          <span
            className="pointer-events-none absolute right-[1px] top-[1px] z-[3]"
            title={`最佳勳章：${bestMedalToLabel(bestMedal)}`}
            aria-label={`最佳勳章：${bestMedalToLabel(bestMedal)}`}
          >
            <MedalShieldBadge medal={bestMedal} />
          </span>
        ) : null}
        {stateLabel ? (
          <span
            className={`pointer-events-none absolute left-1/2 top-[calc(100%+4px)] -translate-x-1/2 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.14em] drop-shadow-[0_0_8px_rgba(0,0,0,0.95)] sm:text-[11px] ${tone.labelClass}`}
          >
            {stateLabel}
          </span>
        ) : null}
      </div>
    </button>
  );
});

function bestMedalToLabel(medal: Medal): string {
  if (medal === 'gold') return '金級勳章';
  if (medal === 'silver') return '銀級勳章';
  return '銅級勳章';
}

function MedalShieldBadge({ medal }: { medal: Medal }) {
  const tone =
    medal === 'gold'
      ? {
          frame: '#fcd34d',
          fillA: '#fef3c7',
          fillB: '#f59e0b',
          mark: '#fef9c3',
          glow: 'drop-shadow-[0_0_6px_rgba(252,211,77,0.7)]',
        }
      : medal === 'silver'
        ? {
            frame: '#cbd5e1',
            fillA: '#f8fafc',
            fillB: '#94a3b8',
            mark: '#ffffff',
            glow: 'drop-shadow-[0_0_6px_rgba(226,232,240,0.65)]',
          }
        : {
            frame: '#f59e0b',
            fillA: '#fde68a',
            fillB: '#b45309',
            mark: '#fef3c7',
            glow: 'drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]',
          };
  return (
    <svg
      viewBox="0 0 20 22"
      className={`h-[16px] w-[15px] ${tone.glow}`}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={`badgeFill-${medal}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone.fillA} />
          <stop offset="100%" stopColor={tone.fillB} />
        </linearGradient>
      </defs>
      <path
        d="M10 1.2 L17.5 4.2 L17.5 11.2 C17.5 15.3 14.8 18.5 10 20.6 C5.2 18.5 2.5 15.3 2.5 11.2 L2.5 4.2 Z"
        fill={`url(#badgeFill-${medal})`}
        stroke={tone.frame}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M10 3.2 L15.5 5.4 L15.5 10.7 C15.5 13.8 13.5 16.2 10 17.8 C6.5 16.2 4.5 13.8 4.5 10.7 L4.5 5.4 Z"
        fill="none"
        stroke={tone.mark}
        strokeOpacity="0.55"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path d="M10 6.2 L11.1 8.5 L13.6 8.9 L11.8 10.7 L12.2 13.2 L10 12 L7.8 13.2 L8.2 10.7 L6.4 8.9 L8.9 8.5 Z" fill={tone.mark} fillOpacity="0.9" />
    </svg>
  );
}
