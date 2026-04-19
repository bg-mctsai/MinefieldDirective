/**
 * 對局標題列徽章：戰術 HUD + 雷區核心符號（取代泛用炸彈圖示）。
 * 顏色由外層 `className` 的 `text-*`（例如 heroCombatTheme.headerMissionMark）提供。
 */
export function MissionDirectiveEmblem({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* 底層發光描邊 */}
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.2} opacity={0.18}>
        <path d="M7 11h5M7 11v5M33 11h-5M33 11v5M7 29h5M7 29v-5M33 29h-5M33 29v-5" />
        <circle cx={20} cy={21} r={8.2} />
        <circle cx={20} cy={21} r={4.2} />
      </g>
      {/* HUD 角標 */}
      <path
        d="M7 11h5M7 11v5M33 11h-5M33 11v5M7 29h5M7 29v-5M33 29h-5M33 29v-5"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
      {/* 外框細線 */}
      <rect
        x={10.5}
        y={10.5}
        width={19}
        height={19}
        rx={3.5}
        stroke="currentColor"
        strokeWidth={0.9}
        opacity={0.35}
      />
      {/* 方位刻度 */}
      <path
        d="M20 9.5v2M20 28.5v-2M9.5 21h2M28.5 21h-2"
        stroke="currentColor"
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={0.55}
      />
      {/* 雷芯：雙環 */}
      <circle cx={20} cy={21} r={8} stroke="currentColor" strokeWidth={1.25} opacity={0.9} />
      <circle cx={20} cy={21} r={4.25} stroke="currentColor" strokeWidth={1.05} opacity={0.75} />
      {/* 信號弧（呼應電報／指令） */}
      <path
        d="M14.5 16.5c2.2-2.4 5.5-3.1 8.2-1.6"
        stroke="currentColor"
        strokeWidth={1.05}
        strokeLinecap="round"
        opacity={0.55}
      />
      {/* 引信／起爆點 */}
      <path
        d="M23.5 12.5l2.2-3.2"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <circle cx={26.2} cy={8.9} r={1.15} fill="currentColor" opacity={0.95} />
      {/* 內十字準星（極細，不搶主體） */}
      <path d="M20 17.2v7.6M16.2 21h7.6" stroke="currentColor" strokeWidth={0.65} opacity={0.35} />
    </svg>
  );
}
