import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { HEROES, setStoredHeroId } from '../heroes';
import { clearAllMdSaveData } from './homeSettingsStorage';
import type { HomeSettings } from './types';

export function SettingsModal({
  open,
  onClose,
  settings,
  onChange,
  onResetHero,
}: {
  open: boolean;
  onClose: () => void;
  settings: HomeSettings;
  onChange: (next: HomeSettings) => void;
  onResetHero: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="w-full max-w-md rounded-3xl border-2 border-[#1e293b] bg-[#0f141c] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-black text-white">系統設定</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-[#1a2332] hover:text-white"
                aria-label="關閉"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  主音量
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(settings.volume * 100)}
                  onChange={(e) => onChange({ ...settings, volume: Number(e.target.value) / 100 })}
                  className="w-full accent-[#F59E0B]"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  語言
                </label>
                <select
                  value={settings.lang}
                  onChange={(e) =>
                    onChange({ ...settings, lang: e.target.value as HomeSettings['lang'] })
                  }
                  className="w-full rounded-xl border border-[#1e293b] bg-[#0B0E14] px-3 py-2 text-sm text-white"
                >
                  <option value="zh-Hant">繁體中文</option>
                  <option value="en">English（介面預留）</option>
                </select>
                <p className="mt-1 text-xs text-slate-600">英文為預留；目前仍以繁中內容為主。</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearAllMdSaveData();
                  onChange({ volume: 0.7, lang: 'zh-Hant' });
                  setStoredHeroId(HEROES[0].id);
                  onResetHero();
                }}
                className="w-full rounded-2xl border-2 border-red-500/40 bg-red-500/10 py-3 text-sm font-black text-red-400 hover:bg-red-500/20"
              >
                清除本機存檔（md:*）
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
