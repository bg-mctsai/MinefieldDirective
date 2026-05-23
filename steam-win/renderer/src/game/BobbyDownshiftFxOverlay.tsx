import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown } from 'lucide-react';
import { overlayBoardCellCenterPx, type OverlayBoardLayout } from './overlayBoardCellCenter';
import { placedCommandDigitClassName, placedCommandDigitFontPx } from './mineCombatVisual';

export type BobbyDownshiftFxState = {
  x: number;
  y: number;
  fromValue: number;
  toValue: number;
};

/** 波比緊急降碼：落點青綠脈衝、數字 −1 校正、浮動降碼標記 */
export function BobbyDownshiftFxOverlay({
  fx,
  layout,
  cellSize,
  hexMin,
  squareGridMin,
}: {
  fx: BobbyDownshiftFxState | null;
  layout: OverlayBoardLayout;
  cellSize: number;
  hexMin?: { x: number; y: number };
  squareGridMin?: { x: number; y: number };
}) {
  if (!fx) return null;

  const { cx, cy } = overlayBoardCellCenterPx(
    layout,
    fx.x,
    fx.y,
    cellSize,
    layout === 'hex' ? hexMin : undefined,
    layout === 'square' ? squareGridMin : undefined,
  );

  const digitFont = placedCommandDigitFontPx(cellSize);
  const ringR = layout === 'hex' ? cellSize * 0.92 : cellSize * 0.48;
  const badgeSize = Math.max(18, Math.round(cellSize * 0.38));

  return (
    <AnimatePresence>
      <motion.div
        key={`${fx.x},${fx.y}-${fx.fromValue}-${fx.toValue}`}
        className="pointer-events-none absolute z-[32]"
        style={{ left: cx, top: cy, transform: 'translate(-50%, -50%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
      >
        <motion.div
          className="absolute rounded-full border-2 border-teal-400/80"
          style={{ width: ringR * 2, height: ringR * 2, left: -ringR, top: -ringR }}
          initial={{ scale: 0.55, opacity: 0.9 }}
          animate={{ scale: 1.45, opacity: 0 }}
          transition={{ duration: 0.62, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute rounded-full border border-amber-400/70"
          style={{ width: ringR * 1.5, height: ringR * 1.5, left: -ringR * 0.75, top: -ringR * 0.75 }}
          initial={{ scale: 0.7, opacity: 0.75 }}
          animate={{ scale: 1.25, opacity: 0 }}
          transition={{ duration: 0.48, ease: 'easeOut', delay: 0.06 }}
        />

        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 1.12 }}
          animate={{ scale: [1.12, 0.92, 1.04] }}
          transition={{ duration: 0.42, times: [0, 0.55, 1] }}
        >
          <motion.span
            key={`from-${fx.fromValue}`}
            className={`${placedCommandDigitClassName(false)} text-red-400/90`}
            style={{ fontSize: digitFont }}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -6, scale: 0.85 }}
            transition={{ duration: 0.22, delay: 0.08 }}
          >
            {fx.fromValue}
          </motion.span>
          <motion.span
            key={`to-${fx.toValue}`}
            className={`${placedCommandDigitClassName(false)} absolute text-teal-300 drop-shadow-[0_0_10px_rgba(45,212,191,0.75)]`}
            style={{ fontSize: digitFont }}
            initial={{ opacity: 0, y: 8, scale: 0.75 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 20, delay: 0.18 }}
          >
            {fx.toValue}
          </motion.span>
        </motion.div>

        <motion.div
          className="absolute flex items-center gap-0.5 rounded-md border border-teal-500/55 bg-slate-950/90 px-1 py-0.5 shadow-[0_0_12px_rgba(45,212,191,0.45)]"
          style={{
            left: ringR * 0.55,
            top: -badgeSize * 0.35,
            fontSize: Math.max(10, Math.round(badgeSize * 0.55)),
          }}
          initial={{ opacity: 0, y: 8, scale: 0.85 }}
          animate={{ opacity: 1, y: -ringR * 0.35, scale: 1 }}
          transition={{ duration: 0.38, ease: 'easeOut', delay: 0.12 }}
        >
          <ArrowDown size={badgeSize * 0.65} className="text-teal-400" strokeWidth={3} aria-hidden />
          <span className="font-black tabular-nums text-amber-200">−1</span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
