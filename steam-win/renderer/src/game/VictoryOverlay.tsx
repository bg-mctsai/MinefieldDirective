import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy } from 'lucide-react';

export function VictoryOverlay({
  visible,
  fillPercentage,
  continueLabel = '繼續',
  onContinue,
}: {
  visible: boolean;
  fillPercentage: number;
  continueLabel?: string;
  onContinue: () => void;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            className="pointer-events-auto relative rounded-[3rem] border-4 border-emerald-500 bg-slate-900 p-10 text-center shadow-[0_20px_50px_rgba(16,185,129,0.3)]"
          >
            <div className="absolute -left-10 -top-10 animate-bounce text-amber-400">
              <Sparkles size={60} />
            </div>
            <div className="absolute -bottom-10 -right-10 animate-bounce text-amber-400 delay-300">
              <Sparkles size={60} />
            </div>

            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-900/30">
              <Trophy size={48} className="text-emerald-500" />
            </div>
            <h2 className="mb-2 text-4xl font-black text-white">任務成功！</h2>
            <p className="mb-1 text-sm font-bold text-slate-400">長官部門回電：戰果確認。</p>
            <p className="mb-8 font-bold text-emerald-500">覆蓋率達 {fillPercentage.toFixed(1)}%</p>
            <button
              type="button"
              onClick={onContinue}
              className="w-full rounded-2xl bg-emerald-600 py-4 font-black text-white shadow-lg shadow-emerald-900/40 transition-all hover:bg-emerald-700"
            >
              {continueLabel}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
