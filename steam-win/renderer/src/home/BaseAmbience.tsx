import { useId } from 'react';

/**
 * 行動基地環境層：戰術網格／六角網、HUD 環、戰術桌等高線 SVG、燈光、通訊雜訊條
 * 全部 pointer-events-none、純 CSS 動畫，避免 raf／listener 影響首頁互動
 */
export function BaseAmbience() {
  const uid = useId().replace(/:/g, '');

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* ── 底層：座標網（粗＋細雙層） */}
      <div
        className="home-tech-grid-layer absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(16, 185, 129, 0.09) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(16, 185, 129, 0.07) 1px, transparent 1px),
            linear-gradient(to right, rgba(34, 211, 238, 0.055) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(34, 211, 238, 0.045) 1px, transparent 1px)
          `,
          backgroundSize: '72px 72px, 72px 72px, 18px 18px, 18px 18px',
          backgroundPosition: '0 0, 0 0, 9px 9px, 9px 9px',
          maskImage:
            'radial-gradient(ellipse 85% 70% at 50% 45%, black 0%, transparent 72%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 85% 70% at 50% 45%, black 0%, transparent 72%)',
        }}
      />

      {/* 左欄區域加強（疊在網格上）：冷光帶 + 垂直通道線 */}
      <div
        className="absolute inset-y-0 left-0 w-[min(100%,28rem)] opacity-[0.88]"
        style={{
          background: `linear-gradient(100deg, rgba(16,185,129,0.1) 0%, rgba(15,23,42,0.08) 40%, transparent 76%)`,
        }}
      />
      <div
        className="absolute inset-y-0 left-0 w-[min(100%,26rem)] opacity-[0.72]"
        style={{
          background: `repeating-linear-gradient(
            90deg,
            transparent 0,
            transparent 23px,
            rgba(34,211,238,0.055) 23px,
            rgba(34,211,238,0.055) 24px
          )`,
          maskImage: 'linear-gradient(90deg, black 0%, transparent 88%)',
          WebkitMaskImage: 'linear-gradient(90deg, black 0%, transparent 88%)',
        }}
      />

      {/* 斜向資料紋（靜態，與網格錯開角度） */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: `repeating-linear-gradient(
            118deg,
            transparent 0,
            transparent 20px,
            rgba(148, 163, 184, 0.055) 20px,
            rgba(148, 163, 184, 0.055) 21px
          )`,
          maskImage: 'radial-gradient(ellipse 100% 80% at 50% 40%, black 15%, transparent 68%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 100% 80% at 50% 40%, black 15%, transparent 68%)',
        }}
      />

      {/* 窄幅掃描帶（父層 overflow 裁切） */}
      <div className="absolute inset-0 overflow-hidden opacity-[0.45]">
        <div
          className="home-tech-band-drift absolute -left-[5%] -right-[5%] -top-[20%] -bottom-[20%]"
          style={{
            background: `linear-gradient(
              to bottom,
              transparent 0%,
              transparent 42%,
              rgba(16, 185, 129, 0.07) 48%,
              rgba(34, 211, 238, 0.06) 52%,
              transparent 58%,
              transparent 100%
            )`,
          }}
        />
      </div>

      {/* 六角戰術網（SVG pattern 平鋪） */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden>
        <defs>
          <pattern
            id={`homeHexTech-${uid}`}
            width="52"
            height="90.1"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(0.85)"
          >
            <path
              d="M26 0 L52 15 L52 45 L26 60 L0 45 L0 15 Z"
              fill="none"
              stroke="#34D399"
              strokeWidth="0.65"
              opacity="0.9"
            />
            <path
              d="M26 60 L52 75 L52 105 L26 120 L0 105 L0 75 Z"
              fill="none"
              stroke="#22D3EE"
              strokeWidth="0.55"
              opacity="0.75"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#homeHexTech-${uid})`} />
      </svg>

      {/* 中央 HUD 同心環（補強 TerminalBackdrop 雷達以外的結構感） */}
      <div className="absolute left-1/2 top-[40%] h-[min(95vw,85vh)] w-[min(95vw,85vh)] -translate-x-1/2 -translate-y-1/2 opacity-[0.11]">
        <div className="absolute inset-[6%] rounded-full border border-emerald-400/40" />
        <div className="absolute inset-[18%] rounded-full border border-cyan-300/25" />
        <div className="absolute inset-[31%] rounded-full border border-amber-400/20" />
        <div className="absolute inset-0 rounded-full border border-slate-500/15" />
      </div>

      {/* 四角 HUD 括號 */}
      <div className="absolute left-3 top-20 h-16 w-16 border-l-2 border-t-2 border-emerald-500/25 sm:left-6 sm:top-24" />
      <div className="absolute right-3 top-20 h-16 w-16 border-r-2 border-t-2 border-cyan-400/20 sm:right-6 sm:top-24" />
      <div className="absolute bottom-28 left-3 h-14 w-14 border-b-2 border-l-2 border-amber-500/18 sm:bottom-32 sm:left-6" />
      <div className="absolute bottom-28 right-3 h-14 w-14 border-b-2 border-r-2 border-emerald-500/18 sm:bottom-32 sm:right-6" />

      {/* 左側：簡化「匯流排／節點」示意 */}
      <svg
        className="absolute left-0 top-[18%] h-[55%] w-32 opacity-[0.14] sm:w-40"
        viewBox="0 0 160 520"
        preserveAspectRatio="xMinYMid meet"
        aria-hidden
      >
        <g fill="none" strokeLinecap="round">
          <path
            d="M12 20 L12 120 L48 160 L48 240 L28 280 L28 400 L60 440 L60 500"
            stroke="#10B981"
            strokeWidth="1.2"
            opacity="0.85"
          />
          <path d="M12 20 L44 48 L44 100" stroke="#22D3EE" strokeWidth="1" opacity="0.7" />
          <path d="M48 160 L88 180 L88 260" stroke="#F59E0B" strokeWidth="0.9" opacity="0.65" />
          <path d="M28 280 L8 320 L8 380" stroke="#94A3B8" strokeWidth="0.85" opacity="0.55" />
          {/* 刻度短線 */}
          {Array.from({ length: 14 }, (_, i) => (
            <line
              key={i}
              x1="4"
              y1={40 + i * 34}
              x2={i % 3 === 0 ? 18 : 12}
              y2={40 + i * 34}
              stroke="#64748B"
              strokeWidth="0.8"
              opacity="0.5"
            />
          ))}
        </g>
        <g>
          <circle cx="12" cy="20" r="3.5" fill="#34D399" opacity="0.9" />
          <circle cx="48" cy="160" r="3" fill="#22D3EE" opacity="0.85" />
          <circle cx="28" cy="280" r="2.8" fill="#F59E0B" opacity="0.8" />
          <circle cx="60" cy="440" r="3.2" fill="#34D399" opacity="0.75" />
        </g>
      </svg>

      {/* 右下：戰術桌（等高線 + 釘針 + 標尺） */}
      <svg
        className="absolute bottom-[-4rem] right-[-3rem] h-[42rem] w-[42rem] opacity-[0.075]"
        viewBox="0 0 600 600"
        aria-hidden
      >
        <defs>
          <radialGradient id={`opsTableGlow-${uid}`} cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#10B981" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="290" fill={`url(#opsTableGlow-${uid})`} />
        <g fill="none" stroke="#10B981" strokeWidth="1.2" opacity="0.85">
          <path d="M120 340 C 180 300, 260 300, 320 340 S 470 380, 520 350" />
          <path d="M100 370 C 180 320, 290 330, 360 370 S 500 410, 540 380" />
          <path d="M140 310 C 200 280, 260 270, 320 310 S 440 340, 490 320" />
          <path d="M170 280 C 210 260, 260 255, 310 280 S 410 305, 450 290" />
          <path d="M200 250 C 230 240, 270 235, 300 250 S 370 270, 400 260" />
        </g>
        <g stroke="#F59E0B" strokeWidth="1" opacity="0.7">
          {Array.from({ length: 18 }, (_, i) => (
            <line
              key={i}
              x1={80 + i * 26}
              y1={520}
              x2={80 + i * 26}
              y2={i % 5 === 0 ? 502 : 512}
            />
          ))}
          <line x1="80" y1="520" x2="540" y2="520" />
        </g>
        <g>
          <circle cx="260" cy="320" r="5" fill="#F59E0B" />
          <circle cx="260" cy="320" r="11" fill="none" stroke="#F59E0B" opacity="0.6" />
          <circle cx="380" cy="290" r="4" fill="#10B981" />
          <circle cx="430" cy="345" r="4" fill="#EF4444" />
          <circle cx="430" cy="345" r="9" fill="none" stroke="#EF4444" opacity="0.7" />
          <circle cx="200" cy="270" r="3.5" fill="#10B981" />
        </g>
        <path
          d="M200 270 L 260 320 L 380 290 L 430 345"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="1.2"
          strokeDasharray="6 5"
          opacity="0.65"
        />
      </svg>

      {/* 戰術燈光：左上、右上各一盞，緩慢擺動 */}
      <div
        className="ops-lamp-sway absolute -left-24 top-[-6rem] h-[28rem] w-[28rem] rounded-full opacity-60 blur-[80px]"
        style={{
          background:
            'radial-gradient(circle, rgba(245,158,11,0.25) 0%, rgba(245,158,11,0.08) 38%, transparent 65%)',
        }}
      />
      <div
        className="ops-lamp-sway absolute -right-32 top-[8rem] h-[26rem] w-[26rem] rounded-full opacity-50 blur-[80px]"
        style={{
          animationDelay: '-3.4s',
          background:
            'radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.05) 38%, transparent 65%)',
        }}
      />

      {/* 通訊雜訊條：三條不同節奏的細橫向亮線 */}
      <div
        className="ops-noise-sweep absolute left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(16,185,129,0.6) 50%, transparent)',
        }}
      />
      <div
        className="ops-noise-sweep delay-a absolute left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(245,158,11,0.5) 50%, transparent)',
        }}
      />
      <div
        className="ops-noise-sweep delay-b absolute left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(148,163,184,0.45) 50%, transparent)',
        }}
      />
    </div>
  );
}
