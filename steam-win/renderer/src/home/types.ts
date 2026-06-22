export type HomeNavigate = 'mission' | 'hero';

/** 首頁 `onNavigate` 可選參數（例如直接開指定章卷宗） */
export type HomeNavigateOptions = {
  /** 作戰地圖進入時展開的章；省略或 null 則為章選畫面 */
  missionOpenChapter?: number | null;
};

export type HomeNavigateHandler = (to: HomeNavigate, options?: HomeNavigateOptions) => void;

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
  /** 遊戲音效（含介面提示音）總開關 */
  sfxEnabled: boolean;
  /** 背景音樂總開關 */
  bgmEnabled: boolean;
  lang: 'zh-Hant' | 'en';
};
