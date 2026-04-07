import { AnimatePresence, motion } from 'motion/react';
import { Crown, Sparkles, Trophy } from 'lucide-react';

export function VictoryCelebrationOverlay({
  visible,
  variant,
  fillPercentage,
  levelCount,
  onConfirm,
}: {
  visible: boolean;
  variant: 'level' | 'campaign';
  fillPercentage: number;
  levelCount: number;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        >
          {variant === 'level' && (
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-md rounded-[2rem] border-4 border-emerald-500 bg-slate-900 p-8 text-center shadow-[0_20px_50px_rgba(16,185,129,0.3)] sm:p-10"
            >
              <div className="absolute -left-8 -top-8 text-amber-400">
                <Sparkles size={48} className="animate-bounce" />
              </div>
              <div className="absolute -bottom-8 -right-8 text-amber-400 delay-300">
                <Sparkles size={48} className="animate-bounce" />
              </div>

              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-900/30 sm:h-24 sm:w-24">
                <Trophy size={48} className="text-emerald-500" />
              </div>
              <h2 className="mb-2 text-3xl font-black text-white sm:text-4xl">任務成功！</h2>
              <p className="mb-1 text-sm font-bold text-slate-400">長官部門回電：戰果確認。</p>
              <p className="mb-8 text-lg font-bold text-emerald-500 sm:text-xl">
                覆蓋率達 {fillPercentage.toFixed(1)}%
              </p>
              <button
                type="button"
                onClick={onConfirm}
                className="w-full rounded-2xl bg-emerald-600 py-3.5 font-black text-white shadow-lg shadow-emerald-900/40 transition-all hover:bg-emerald-700 active:scale-[0.98] sm:py-4"
              >
                確定
              </button>
            </motion.div>
          )}

          {variant === 'campaign' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="relative w-full max-w-lg rounded-[2rem] border-4 border-amber-400 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-8 text-center shadow-[0_24px_80px_rgba(251,191,36,0.25)] sm:p-10"
            >
              <div className="absolute -left-6 -top-6 text-amber-300/90">
                <Sparkles size={52} className="animate-pulse" />
              </div>
              <div className="absolute -bottom-6 -right-6 text-amber-300/90">
                <Sparkles size={52} className="animate-pulse delay-500" />
              </div>

              <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/15 ring-4 ring-amber-400/40">
                <Crown size={52} className="text-amber-400" strokeWidth={1.75} />
              </div>
              <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] text-amber-400/90">戰役全破</p>
              <h2 className="mb-3 text-3xl font-black text-white md:text-4xl">恭喜破關！</h2>
              <p className="mb-2 text-base font-medium text-slate-400">
                已完成全部 <span className="font-black text-amber-300">{levelCount}</span> 關戰略部署
              </p>
              <p className="mb-8 text-lg font-bold text-emerald-400">本關覆蓋率 {fillPercentage.toFixed(1)}%</p>
              <button
                type="button"
                onClick={onConfirm}
                className="w-full rounded-2xl bg-amber-500 py-3.5 font-black text-slate-950 shadow-lg shadow-amber-900/30 transition-all hover:bg-amber-400 active:scale-[0.98] sm:py-4"
              >
                確定
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
