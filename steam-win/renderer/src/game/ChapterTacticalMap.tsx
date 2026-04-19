/**
 * 關卡選擇背景：章節「戰術佈防圖」
 * inline SVG 等高線 + 虛線進攻路徑 + 10 個 stage 固定座標位
 * 已過關 stage 上插一面綠旗；其餘為灰色檢查點圈
 */

/** 10 關固定佈防座標（百分比，0~100），人工調整使其在 viewBox 內排成行軍動線 */
const STAGE_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 12, y: 78 },
  { x: 22, y: 64 },
  { x: 33, y: 72 },
  { x: 42, y: 56 },
  { x: 52, y: 64 },
  { x: 60, y: 46 },
  { x: 70, y: 52 },
  { x: 78, y: 36 },
  { x: 86, y: 44 },
  { x: 92, y: 22 },
];

export function chapterStagePosition(stage: number): { x: number; y: number } | undefined {
  return STAGE_POSITIONS[stage - 1];
}

export function ChapterTacticalMap({
  chapter,
  clearedStageMax,
  totalStages,
  className = '',
}: {
  chapter: number;
  /** 該章已過關的最高 stage（1~10）；0 表示尚未過關 */
  clearedStageMax: number;
  /** 該章實際有的 stage 數（通常 10） */
  totalStages: number;
  className?: string;
}) {
  const accent = '#10B981';
  const warn = '#F59E0B';
  const dim = '#1e293b';
  const path = STAGE_POSITIONS.slice(0, totalStages)
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <radialGradient id={`mapGlow-${chapter}`} cx="55%" cy="50%" r="60%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
          <stop offset="80%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill={`url(#mapGlow-${chapter})`} />

      {/* 等高線（隨 chapter 略偏移） */}
      <g
        fill="none"
        stroke={accent}
        strokeWidth="0.25"
        opacity="0.55"
        transform={`translate(${(chapter % 3) * 2 - 2} ${(chapter % 5) - 2})`}
      >
        <path d="M 5 80 C 25 70, 45 76, 60 66 S 90 50, 98 56" />
        <path d="M 0 70 C 22 60, 40 66, 58 54 S 88 38, 100 44" />
        <path d="M 8 60 C 28 50, 46 56, 60 44 S 88 28, 96 32" />
        <path d="M 14 48 C 32 40, 50 44, 60 32 S 84 18, 92 22" />
        <path d="M 22 36 C 38 30, 52 32, 60 22 S 78 10, 88 12" />
      </g>

      {/* 標尺 */}
      <g stroke={warn} strokeWidth="0.18" opacity="0.45">
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={4 + i * 8} y1={96} x2={4 + i * 8} y2={i % 4 === 0 ? 92 : 94} />
        ))}
        <line x1="4" y1="96" x2="96" y2="96" />
      </g>

      {/* 進攻路徑（虛線） */}
      <path
        d={path}
        fill="none"
        stroke={warn}
        strokeWidth="0.45"
        strokeDasharray="1.5 1.2"
        opacity="0.7"
      />

      {/* stage 標記 */}
      {STAGE_POSITIONS.slice(0, totalStages).map((p, i) => {
        const stage = i + 1;
        const cleared = stage <= clearedStageMax;
        return (
          <g key={stage} transform={`translate(${p.x} ${p.y})`}>
            {cleared ? (
              <g>
                {/* 已過關：綠旗 */}
                <line x1="0" y1="0" x2="0" y2="-4.5" stroke={accent} strokeWidth="0.4" />
                <polygon points="0,-4.5 3.2,-3.6 0,-2.7" fill={accent} />
                <circle cx="0" cy="0" r="0.7" fill={accent} />
                <circle cx="0" cy="0" r="1.6" fill="none" stroke={accent} strokeWidth="0.25" opacity="0.7" />
              </g>
            ) : (
              <g opacity="0.7">
                <circle cx="0" cy="0" r="0.9" fill={dim} stroke={warn} strokeWidth="0.25" />
                <circle cx="0" cy="0" r="2" fill="none" stroke={warn} strokeWidth="0.18" opacity="0.55" />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
