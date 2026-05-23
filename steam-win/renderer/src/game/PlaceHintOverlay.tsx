import { motion } from 'motion/react';

/** 波比：選定電碼後的可放格提示（虛線框，不暗示雷或數字） */
export function PlaceHintOverlay() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-[3px] z-[9] rounded-[0.65rem] border-2 border-dashed border-teal-400/75 bg-teal-500/12 shadow-[inset_0_0_12px_rgba(45,212,191,0.12)]"
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.55, 0.95, 0.55] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}
