/**
 * 音訊事件集中目錄（single source of truth）。
 * 新增事件只在這裡登記，並在 `audio/synths/` 加對應合成工廠。
 *
 * 命名規則：`<domain>.<scene|system>.<action>`，禁中文與空白。
 */

export type AudioBusId = 'master' | 'ui' | 'sfx' | 'vo' | 'bgm';

export type AudioPriority = 'low' | 'normal' | 'high';

export type AudioDuckSpec = {
  /** 被壓下的 bus */
  targetBus: Exclude<AudioBusId, 'master'>;
  /** 壓下的增益倍率（線性，0~1；例如 0.5 約 -6dB） */
  gainMul: number;
  /** 壓下維持秒數（含回升） */
  durationSec: number;
};

export type AudioEventDef = {
  /** 對應到 `audio/synths/<synthId>.ts` 匯出的 `playOn(busNode, ctx, params)` */
  synthId: string;
  /** 路由到的 bus；master 由 engine 串接，不可直接指定 master */
  bus: Exclude<AudioBusId, 'master'>;
  priority: AudioPriority;
  /** 同事件最小觸發間隔（毫秒），用來抑制高頻重入 */
  cooldownMs?: number;
  /** 觸發時對其他 bus 做 ducking（可多筆） */
  duck?: AudioDuckSpec[];
  /** 是否為循環（BGM 類；engine 會長駐一條實例） */
  loop?: boolean;
  note?: string;
};

/**
 * 所有事件 key 的集中註冊表。
 * 型別 `AudioEventKey` 從此處自動推導，保證 emit 端與 catalog 不會漂移。
 */
export const AUDIO_EVENT_CATALOG = {
  // UI
  'ui.menu.hover': {
    synthId: 'uiHover',
    bus: 'ui',
    priority: 'low',
    cooldownMs: 40,
    note: '主選單 hover 短 beep',
  },
  'ui.mission.enterConfirm': {
    synthId: 'uiConfirm',
    bus: 'ui',
    priority: 'normal',
    note: '作戰地圖雙擊進場確認',
  },
  'ui.briefing.openFolder': {
    synthId: 'uiBriefingOpen',
    bus: 'ui',
    priority: 'normal',
    cooldownMs: 120,
    note: '展開章節卷宗（紙張翻開感）',
  },
  'ui.briefing.closeFolder': {
    synthId: 'uiBriefingClose',
    bus: 'ui',
    priority: 'normal',
    cooldownMs: 100,
    note: '收起章節卷宗（紙張回收感）',
  },
  'ui.select.change': {
    synthId: 'uiSelectChangeDing',
    bus: 'ui',
    priority: 'normal',
    cooldownMs: 70,
    note: '切換選擇（雙擊鈴：叮、叮）',
  },

  // VO / teletype
  'vo.teletype.blip': {
    synthId: 'teletypeBlip',
    bus: 'vo',
    priority: 'low',
    cooldownMs: 20,
    note: '逐字顯示電報音（高頻，嚴格 cooldown）',
  },

  // Game SFX
  'game.countdown.tick': {
    synthId: 'gameCountdownTick',
    bus: 'sfx',
    priority: 'normal',
    note: '倒數最後 N 秒滴答；params.remainingSeconds 影響頻率',
  },
  'game.time.up': {
    synthId: 'gameTimeUp',
    bus: 'sfx',
    priority: 'high',
    duck: [{ targetBus: 'bgm', gainMul: 0.5, durationSec: 0.6 }],
    note: '時限歸零警示',
  },
  'game.number.place': {
    synthId: 'gamePlaceNumber',
    bus: 'sfx',
    priority: 'normal',
    note: '數字安放；params.value 影響音高',
  },
  'game.mine.explode': {
    synthId: 'gameExplosionPop',
    bus: 'sfx',
    priority: 'high',
    duck: [
      { targetBus: 'bgm', gainMul: 0.35, durationSec: 0.9 },
      { targetBus: 'ui', gainMul: 0.5, durationSec: 0.4 },
    ],
    note: '單顆地雷爆炸；params.stepIndex 影響頻率',
  },
  'game.bobby.downshift': {
    synthId: 'gameBobbyDownshift',
    bus: 'sfx',
    priority: 'high',
    note: '波比緊急降碼；fromValue / toValue 影響音高',
  },

  // BGM（合成式循環骨架；之後可替換為真素材）
  'bgm.base.ambience': {
    synthId: 'bgmBaseAmbience',
    bus: 'bgm',
    priority: 'low',
    loop: true,
    note: '舊版基地環境循環（保留相容）',
  },
  'bgm.mission.map': {
    synthId: 'bgmSettingsGlass',
    bus: 'bgm',
    priority: 'low',
    loop: true,
    note: '行動卷宗／章節地圖選擇循環（The Glass Interface）',
  },
  'bgm.combat.loop': {
    synthId: 'bgmHomeThirdWire',
    bus: 'bgm',
    priority: 'low',
    loop: true,
    note: '進入戰場循環（The Third Wire）',
  },
  'bgm.home.settings': {
    synthId: 'bgmSettingsGlass',
    bus: 'bgm',
    priority: 'low',
    loop: true,
    note: '首頁設定視窗背景循環（The Glass Interface）',
  },
} as const satisfies Record<string, AudioEventDef>;

export type AudioEventKey = keyof typeof AUDIO_EVENT_CATALOG;

export type AudioEventParamsMap = {
  'ui.menu.hover': void;
  'ui.mission.enterConfirm': void;
  'ui.briefing.openFolder': void;
  'ui.briefing.closeFolder': void;
  'ui.select.change': void;
  'vo.teletype.blip': void;
  'game.countdown.tick': { remainingSeconds: number };
  'game.time.up': void;
  'game.number.place': { value: number };
  'game.mine.explode': { stepIndex: number };
  'game.bobby.downshift': { fromValue: number; toValue: number };
  'bgm.base.ambience': void;
  'bgm.mission.map': void;
  'bgm.combat.loop': void;
  'bgm.home.settings': void;
};

export function getAudioEventDef<K extends AudioEventKey>(key: K): AudioEventDef {
  return AUDIO_EVENT_CATALOG[key];
}

export function listAudioEventKeys(): AudioEventKey[] {
  return Object.keys(AUDIO_EVENT_CATALOG) as AudioEventKey[];
}
