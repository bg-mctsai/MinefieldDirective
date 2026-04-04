import { motion } from 'motion/react';

/** 已爆／標示為雷的格：廢墟塊面（取代炸彈圖示） */
export function MineRuins({
  x,
  y,
  exploding,
}: {
  x: number;
  y: number;
  exploding: boolean;
}) {
  const stagger = ((x * 7 + y * 13) % 5) * 0.07;
  return (
    <motion.svg
      width={22}
      height={22}
      viewBox="0 0 22 22"
      className="overflow-visible text-stone-500"
      aria-hidden
    >
      <motion.g
        initial={false}
        animate={
          exploding
            ? { scale: [1, 1.12, 0.4], opacity: [1, 0.85, 0.15], y: [0, 1, 4] }
            : { scale: 1, opacity: 1, y: 0 }
        }
        transition={{ duration: 0.48, delay: stagger, ease: 'easeIn' }}
      >
        <path d="M1.5 17 L7.5 13.5 L5.5 18.5 Z" fill="currentColor" className="text-stone-600" />
        <path d="M6 14.5 L13.5 11 L11.5 17.5 L4.5 17.5 Z" fill="currentColor" className="text-stone-500" />
        <path d="M12.5 12.5 L20 15 L17.5 19 L10 17 Z" fill="currentColor" className="text-stone-600" />
        <rect
          x="8"
          y="7.5"
          width="6.5"
          height="3.2"
          rx="0.4"
          transform="rotate(-10 11.25 9.1)"
          fill="currentColor"
          className="text-stone-400"
        />
        <path d="M14 8 L18 9 L17 11.5 L13 10 Z" fill="currentColor" className="text-stone-500 opacity-80" />
      </motion.g>
    </motion.svg>
  );
}
