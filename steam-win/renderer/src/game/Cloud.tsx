import { motion } from 'motion/react';

type CloudProps = {
  widthPx: number;
  heightPx: number;
  opacity: number;
  blurPx?: number;
  breatheSec?: number;
  /** 0/1/2：三種沙色變體，讓各條沙帶有微妙色差 */
  colorVariant?: number;
};

// 沙塵暴用：三組偏紅棕沙色漸層，以 OP / OP2 / OP3 為透明度佔位符
// 漸層刻意讓不透明區域延伸到 85% 以上，使條帶中心非常實
const SAND_COLORS = [
  // 0 – 深紅棕塵（主力色）
  {
    base: 'radial-gradient(ellipse 98% 65% at 44% 50%, rgba(188,100,52,OP) 0%, rgba(165,82,40,OP2) 52%, rgba(138,62,30,OP3) 82%, rgba(118,50,24,OP3) 92%, transparent 100%)',
    top:  'radial-gradient(ellipse 88% 52% at 52% 46%, rgba(210,118,62,OP) 0%, rgba(182,95,48,OP2) 60%, rgba(155,74,36,OP3) 86%, transparent 100%)',
    core: 'radial-gradient(ellipse 70% 38% at 50% 50%, rgba(200,110,56,OP) 0%, rgba(175,88,44,OP2) 65%, transparent 100%)',
  },
  // 1 – 橘紅沙（中間混色）
  {
    base: 'radial-gradient(ellipse 96% 62% at 48% 52%, rgba(210,130,58,OP) 0%, rgba(185,105,44,OP2) 54%, rgba(155,80,32,OP3) 84%, rgba(134,65,24,OP3) 93%, transparent 100%)',
    top:  'radial-gradient(ellipse 86% 48% at 50% 48%, rgba(228,148,70,OP) 0%, rgba(200,120,52,OP2) 62%, rgba(170,92,38,OP3) 88%, transparent 100%)',
    core: 'radial-gradient(ellipse 66% 34% at 50% 50%, rgba(220,138,64,OP) 0%, rgba(194,112,48,OP2) 68%, transparent 100%)',
  },
  // 2 – 暗磚紅塵（深色厚重感）
  {
    base: 'radial-gradient(ellipse 98% 68% at 42% 48%, rgba(170,82,42,OP) 0%, rgba(148,65,32,OP2) 48%, rgba(122,50,25,OP3) 80%, rgba(105,42,20,OP3) 92%, transparent 100%)',
    top:  'radial-gradient(ellipse 84% 50% at 54% 50%, rgba(192,96,50,OP) 0%, rgba(165,76,38,OP2) 58%, rgba(138,58,28,OP3) 86%, transparent 100%)',
    core: 'radial-gradient(ellipse 72% 40% at 50% 50%, rgba(180,88,46,OP) 0%, rgba(156,70,36,OP2) 66%, transparent 100%)',
  },
];

function applyOpacity(template: string, op: number): string {
  // OP3 提高到 0.58x，讓邊緣更實；OP2 提高到 0.82x
  return template
    .replace(/OP3/g, String(Math.round(op * 0.58 * 100) / 100))
    .replace(/OP2/g, String(Math.round(op * 0.82 * 100) / 100))
    .replace(/OP/g,  String(Math.round(op * 100) / 100));
}

/**
 * 單條橫向沙帶：寬扁不規則橢圓 + 暖沙色漸層 + blur。
 * 供 MapCloudOverlay 複數排列使用，製造沙塵暴視覺。
 */
export function Cloud({
  widthPx,
  heightPx,
  opacity: op,
  blurPx = 16,
  breatheSec = 5,
  colorVariant = 0,
}: CloudProps) {
  const o = Math.min(1, Math.max(0, op));
  const colors = SAND_COLORS[colorVariant % SAND_COLORS.length];

  const abs = {
    position: 'absolute' as const,
    pointerEvents: 'none' as const,
    willChange: 'transform, opacity' as const,
  };

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{ width: widthPx, height: heightPx }}
      aria-hidden
    >
      {/* 底層：大範圍沙霧帶，極度水平扁平 */}
      <motion.div
        style={{
          ...abs,
          inset: '-6% -2%',
          borderRadius: '76% 24% 82% 18% / 34% 64% 36% 66%',
          background: applyOpacity(colors.base, o),
          filter: `blur(${blurPx}px)`,
        }}
        animate={{
          scaleX: [1, 1.09, 0.95, 1.05, 1],
          scaleY: [1, 0.92, 1.07, 0.96, 1],
          x: [0, 10, -6, 7, 0],
        }}
        transition={{ duration: breatheSec * 1.25, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* 中層：集中亮沙帶 */}
      <motion.div
        style={{
          ...abs,
          inset: '10% -1%',
          borderRadius: '60% 40% 70% 30% / 44% 54% 46% 56%',
          background: applyOpacity(colors.top, o * 0.95),
          filter: `blur(${blurPx * 0.55}px)`,
        }}
        animate={{
          scaleX: [1, 0.93, 1.08, 0.96, 1],
          x: [0, -7, 11, -5, 0],
          y: [0, 3, -2, 4, 0],
        }}
        transition={{ duration: breatheSec, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
      {/* 頂層：不模糊實心核心，讓條帶中心真正不透明 */}
      <motion.div
        style={{
          ...abs,
          inset: '18% 4%',
          borderRadius: '58% 42% 68% 32% / 48% 56% 44% 52%',
          background: applyOpacity(colors.core, o * 0.88),
          filter: `blur(${blurPx * 0.28}px)`,
        }}
        animate={{
          scaleX: [1, 1.05, 0.94, 1.03, 1],
          x: [0, 5, -8, 4, 0],
        }}
        transition={{ duration: breatheSec * 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
      />
    </div>
  );
}
