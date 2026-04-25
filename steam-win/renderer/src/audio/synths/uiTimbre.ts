/**
 * UI 音色基準（Cinematic UI Pack v1）
 * 所有 UI 合成器盡量引用這裡，避免每檔各自漂移。
 */
export const UI_TIMBRE = {
  hover: {
    clickPeak: 0.018,
    bodyPeak: 0.028,
  },
  confirm: {
    toneAPeak: 0.04,
    toneBPeak: 0.028,
  },
  briefing: {
    openPeak: 0.05,
    openNoisePeak: 0.025,
    closePeak: 0.036,
    closeNoisePeak: 0.015,
  },
} as const;

