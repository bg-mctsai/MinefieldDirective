import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Music, Volume2, VolumeX, X } from 'lucide-react';
import { HEROES, setStoredHeroId } from '../heroes';
import { clearAllMdSaveData, DEFAULT_BUSES } from './homeSettingsStorage';
import type { AudioBusSettings, HomeSettings } from './types';

const BUS_LABELS: { id: keyof AudioBusSettings; label: string; hint?: string }[] = [
  { id: 'master', label: '主音量' },
  { id: 'ui', label: '介面' },
  { id: 'sfx', label: '音效' },
  { id: 'vo', label: '語音/電報' },
  { id: 'bgm', label: '背景樂' },
];

function AudioSwitchRow({
  label,
  enabled,
  onToggle,
  iconOn,
  iconOff,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
  iconOn: ReactNode;
  iconOff: ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={[
        'flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors',
        enabled
          ? 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15'
          : 'border-slate-600/50 bg-slate-900/60 hover:border-slate-500/60',
      ].join(' ')}
    >
      <span className="flex items-center gap-2.5 text-sm font-bold text-slate-200">
        <span className="text-emerald-400">{enabled ? iconOn : iconOff}</span>
        {label}
      </span>
      <span
        className={[
          'rounded-lg px-3 py-1 text-xs font-black tracking-wider',
          enabled ? 'bg-emerald-500/25 text-emerald-300' : 'bg-slate-700/80 text-slate-500',
        ].join(' ')}
      >
        {enabled ? '開啟' : '關閉'}
      </span>
    </button>
  );
}

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
  const updateBus = (id: keyof AudioBusSettings, value01: number) => {
    const nextBuses: AudioBusSettings = { ...settings.buses, [id]: value01 };
    onChange({
      ...settings,
      buses: nextBuses,
      volume: id === 'master' ? value01 : settings.volume,
    });
  };

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
            <div className="space-y-5">
              <div className="space-y-3 rounded-2xl border border-[#1e293b] bg-[#0B0E14] p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">音訊開關</div>
                <AudioSwitchRow
                  label="背景音樂"
                  enabled={settings.bgmEnabled}
                  onToggle={() => onChange({ ...settings, bgmEnabled: !settings.bgmEnabled })}
                  iconOn={<Music size={18} />}
                  iconOff={<Music size={18} className="opacity-40" />}
                />
                <AudioSwitchRow
                  label="音效"
                  enabled={settings.sfxEnabled}
                  onToggle={() => onChange({ ...settings, sfxEnabled: !settings.sfxEnabled })}
                  iconOn={<Volume2 size={18} />}
                  iconOff={<VolumeX size={18} />}
                />
              </div>
              <div className="space-y-4 rounded-2xl border border-[#1e293b] bg-[#0B0E14] p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  音訊通道
                </div>
                {BUS_LABELS.map(({ id, label }) => {
                  const value = settings.buses?.[id] ?? DEFAULT_BUSES[id];
                  const busMuted =
                    (id === 'bgm' && !settings.bgmEnabled) ||
                    ((id === 'sfx' || id === 'ui') && !settings.sfxEnabled);
                  return (
                    <div key={id} className={busMuted ? 'opacity-45' : undefined}>
                      <div className="mb-1 flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">{label}</label>
                        <span className="text-xs tabular-nums text-slate-500">
                          {Math.round(value * 100)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(value * 100)}
                        onChange={(e) => updateBus(id, Number(e.target.value) / 100)}
                        className="w-full accent-[#F59E0B]"
                      />
                    </div>
                  );
                })}
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
                  onChange({
                    volume: DEFAULT_BUSES.master,
                    buses: { ...DEFAULT_BUSES },
                    sfxEnabled: true,
                    bgmEnabled: true,
                    lang: 'zh-Hant',
                  });
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
