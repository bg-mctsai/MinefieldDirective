import { motion, AnimatePresence } from 'motion/react';
import { Crown, Sparkles } from 'lucide-react';

export function CampaignCompleteOverlay({
  visible,
  fillPercentage,
  totalLevels,
  onReturnToMission,
  onReplayFinalLevel,
}: {
  visible: boolean;
  fillPercentage: number;
  totalLevels: number;
  onReturnToMission: () => void;
  onReplayFinalLevel: () => void;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="pointer-events-auto relative max-w-lg rounded-[3rem] border-4 border-amber-400 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-10 text-center shadow-[0_24px_80px_rgba(251,191,36,0.25)]"
          >
            <div className="absolute -left-8 -top-8 text-amber-300/90">
              <Sparkles size={56} className="animate-pulse" />
            </div>
            <div className="absolute -bottom-8 -right-8 text-amber-300/90">
              <Sparkles size={56} className="animate-pulse delay-500" />
            </div>

            <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-amber-500/15 ring-4 ring-amber-400/40">
              <Crown size={56} className="text-amber-400" strokeWidth={1.75} />
            </div>
            <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] text-amber-400/90">戰役全破</p>
            <h2 className="mb-3 text-4xl font-black text-white md:text-5xl">恭喜破關！</h2>
            <p className="mb-2 text-base font-medium text-slate-400">
              已完成全部 <span className="font-black text-amber-300">{totalLevels}</span> 關戰略部署
            </p>
            <p className="mb-8 text-lg font-bold text-emerald-400">本關覆蓋率 {fillPercentage.toFixed(1)}%</p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={onReturnToMission}
                className="min-w-[10rem] rounded-2xl bg-amber-500 py-4 font-black text-slate-950 shadow-lg shadow-amber-900/30 transition-all hover:bg-amber-400 active:scale-[0.98]"
              >
                返回作戰地圖
              </button>
              <button
                type="button"
                onClick={onReplayFinalLevel}
                className="min-w-[10rem] rounded-2xl border-2 border-slate-600 bg-slate-800/80 py-4 font-black text-slate-200 transition-all hover:border-slate-500 hover:bg-slate-800 active:scale-[0.98]"
              >
                再挑戰最終關
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
