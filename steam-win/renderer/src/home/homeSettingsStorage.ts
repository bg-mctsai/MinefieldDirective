import type { HomeSettings } from './types';

const LS_VOL = 'md:masterVolume';
const LS_LANG = 'md:lang';

export function loadHomeSettings(): HomeSettings {
  let volume = 0.7;
  let lang: HomeSettings['lang'] = 'zh-Hant';
  try {
    const v = localStorage.getItem(LS_VOL);
    if (v != null) volume = Math.min(1, Math.max(0, parseFloat(v)));
    const l = localStorage.getItem(LS_LANG);
    if (l === 'en' || l === 'zh-Hant') lang = l;
  } catch {
    /* ignore */
  }
  return { volume: Number.isFinite(volume) ? volume : 0.7, lang };
}

export function saveHomeSettings(s: HomeSettings) {
  try {
    localStorage.setItem(LS_VOL, String(s.volume));
    localStorage.setItem(LS_LANG, s.lang);
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
