export type HomeNavigate = 'mission' | 'hero';

export type AudioBusSettings = {
  master: number;
  ui: number;
  sfx: number;
  vo: number;
  bgm: number;
};

export type HomeSettings = {
  /** 向後相容的主音量（= buses.master），舊呼叫點仍可使用 */
  volume: number;
  buses: AudioBusSettings;
  lang: 'zh-Hant' | 'en';
};
