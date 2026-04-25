import type { AudioBusSettings, HomeSettings } from './types';

const LS_VOL = 'md:masterVolume';
const LS_BUSES = 'md:audioBuses';
const LS_LANG = 'md:lang';

const DEFAULT_BUSES: AudioBusSettings = {
  master: 0.7,
  ui: 0.9,
  sfx: 1.0,
  vo: 1.0,
  bgm: 0.55,
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function parseBuses(raw: string | null): AudioBusSettings | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as Partial<AudioBusSettings> | null;
    if (!obj || typeof obj !== 'object') return null;
    return {
      master: clamp01(Number(obj.master ?? DEFAULT_BUSES.master)),
      ui: clamp01(Number(obj.ui ?? DEFAULT_BUSES.ui)),
      sfx: clamp01(Number(obj.sfx ?? DEFAULT_BUSES.sfx)),
      vo: clamp01(Number(obj.vo ?? DEFAULT_BUSES.vo)),
      bgm: clamp01(Number(obj.bgm ?? DEFAULT_BUSES.bgm)),
    };
  } catch {
    return null;
  }
}

export function loadHomeSettings(): HomeSettings {
  let buses: AudioBusSettings = { ...DEFAULT_BUSES };
  let lang: HomeSettings['lang'] = 'zh-Hant';
  try {
    const parsed = parseBuses(localStorage.getItem(LS_BUSES));
    if (parsed) {
      buses = parsed;
    } else {
      // 遷移：舊 md:masterVolume -> buses.master
      const legacy = localStorage.getItem(LS_VOL);
      if (legacy != null) {
        const v = clamp01(parseFloat(legacy));
        buses = { ...DEFAULT_BUSES, master: Number.isFinite(v) ? v : DEFAULT_BUSES.master };
        localStorage.setItem(LS_BUSES, JSON.stringify(buses));
        localStorage.removeItem(LS_VOL);
      }
    }
    const l = localStorage.getItem(LS_LANG);
    if (l === 'en' || l === 'zh-Hant') lang = l;
  } catch {
    /* ignore */
  }
  return { volume: buses.master, buses, lang };
}

export function saveHomeSettings(s: HomeSettings) {
  try {
    const buses: AudioBusSettings = {
      master: clamp01(s.buses?.master ?? s.volume ?? DEFAULT_BUSES.master),
      ui: clamp01(s.buses?.ui ?? DEFAULT_BUSES.ui),
      sfx: clamp01(s.buses?.sfx ?? DEFAULT_BUSES.sfx),
      vo: clamp01(s.buses?.vo ?? DEFAULT_BUSES.vo),
      bgm: clamp01(s.buses?.bgm ?? DEFAULT_BUSES.bgm),
    };
    localStorage.setItem(LS_BUSES, JSON.stringify(buses));
    localStorage.setItem(LS_LANG, s.lang);
    // 維持相容：部分舊呼叫仍讀這個 key
    localStorage.setItem(LS_VOL, String(buses.master));
  } catch {
    /* ignore */
  }
}

export function clearAllMdSaveData() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('md:'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export { DEFAULT_BUSES };
