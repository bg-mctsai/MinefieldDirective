/**
 * 行動基地環境層：戰術桌等高線 SVG、戰術燈光、通訊雜訊條
 * 全部 pointer-events-none、純 CSS 動畫，避免 raf／listener 影響首頁互動
 */
export function BaseAmbience() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* 右下：戰術桌（等高線 + 釘針 + 標尺） */}
      <svg
        className="absolute bottom-[-4rem] right-[-3rem] h-[42rem] w-[42rem] opacity-[0.06]"
        viewBox="0 0 600 600"
        aria-hidden
      >
        <defs>
          <radialGradient id="opsTableGlow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#10B981" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="290" fill="url(#opsTableGlow)" />
        {/* 等高線 */}
        <g fill="none" stroke="#10B981" strokeWidth="1.2" opacity="0.85">
          <path d="M120 340 C 180 300, 260 300, 320 340 S 470 380, 520 350" />
          <path d="M100 370 C 180 320, 290 330, 360 370 S 500 410, 540 380" />
          <path d="M140 310 C 200 280, 260 270, 320 310 S 440 340, 490 320" />
          <path d="M170 280 C 210 260, 260 255, 310 280 S 410 305, 450 290" />
          <path d="M200 250 C 230 240, 270 235, 300 250 S 370 270, 400 260" />
        </g>
        {/* 標尺刻度 */}
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
        {/* 釘針：作戰標記 */}
        <g>
          <circle cx="260" cy="320" r="5" fill="#F59E0B" />
          <circle cx="260" cy="320" r="11" fill="none" stroke="#F59E0B" opacity="0.6" />
          <circle cx="380" cy="290" r="4" fill="#10B981" />
          <circle cx="430" cy="345" r="4" fill="#EF4444" />
          <circle cx="430" cy="345" r="9" fill="none" stroke="#EF4444" opacity="0.7" />
          <circle cx="200" cy="270" r="3.5" fill="#10B981" />
        </g>
        {/* 虛線進攻路徑 */}
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
