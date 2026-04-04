import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Lock, Map as MapIcon } from 'lucide-react';
import { LEVELS } from './gameLogic';
import { TerminalBackdrop } from './ui/TerminalBackdrop';
import { isLevelUnlocked } from './game/gameProgressStorage';

export default function MissionMap({
  onBack,
  onStart,
  highestClearedLevel,
}: {
  onBack: () => void;
  onStart: (levelIndex: number) => void;
  highestClearedLevel: number;
}) {
  return (
    <TerminalBackdrop className="font-mono text-slate-200 selection:bg-[#F59E0B]/30">
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4"
        >
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border-2 border-[#1e293b] bg-[#0f141c] px-3 py-2 text-sm font-bold text-slate-200 hover:border-[#F59E0B]/50 hover:text-[#F59E0B]"
          >
            <ChevronLeft size={18} />
            返回首頁
          </button>
          <div className="flex items-center gap-2 text-white">
            <MapIcon className="text-[#F59E0B]" size={24} />
            <h1 className="text-xl font-black md:text-2xl">關卡選擇 · Mission Map</h1>
          </div>
        </motion.header>

        <p className="mb-6 text-sm text-slate-500">
          選擇戰區後進入戰術部署。你可以在戰鬥介面中隨時切換其他地圖。
        </p>

        <ul className="space-y-3">
          {LEVELS.map((lv, idx) => (
            <motion.li
              key={lv.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
            >
              <div className="flex flex-col gap-3 rounded-2xl border-2 border-[#1e293b] bg-[#0f141c]/95 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    SECTOR {String(lv.id).padStart(2, '0')}
                  </div>
                  <div className="text-lg font-black text-white">{lv.name}</div>
                  <div className="text-xs text-slate-500">
                    {lv.cells.length} 格可部署 · 寬{lv.width}×高{lv.height} 邊界
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!isLevelUnlocked(lv.id, highestClearedLevel)}
                  onClick={() => {
                    if (!isLevelUnlocked(lv.id, highestClearedLevel)) return;
                    onStart(idx);
                  }}
                  className={
                    isLevelUnlocked(lv.id, highestClearedLevel)
                      ? 'inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F59E0B] px-5 py-3 text-sm font-black text-black shadow-[0_0_24px_rgba(245,158,11,0.25)] transition-transform hover:scale-[1.02] active:scale-[0.98]'
                      : 'inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-800/60 px-5 py-3 text-sm font-black text-slate-500 shadow-none cursor-not-allowed'
                  }
                >
                  {isLevelUnlocked(lv.id, highestClearedLevel) ? (
                    <>
                      出擊
                      <ChevronRight size={18} />
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      已鎖定
                    </>
                  )}
                </button>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </TerminalBackdrop>
  );
}
