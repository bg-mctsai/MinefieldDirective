/** 1→8→7→…→2 往返一週（不含尾端重複 1，下一 tick 回 1） */
export const SIGNAL_JAMMING_PINGPONG: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2];

/** 未在 levels.json 指定 `commandSlotJammingStepMs` 時使用；數字愈大輪播愈慢 */
export const SIGNAL_JAMMING_STEP_MS_DEFAULT = 200;

export const SIGNAL_JAMMING_STEP_MS_MIN = 80;
export const SIGNAL_JAMMING_STEP_MS_MAX = 2000;

/** @deprecated 改用 `resolveSignalJammingStepMs` 或關卡欄位 */
export const SIGNAL_JAMMING_STEP_MS = SIGNAL_JAMMING_STEP_MS_DEFAULT;

const LEN = SIGNAL_JAMMING_PINGPONG.length;

/** 各槽位錯開相位，避免多道顯示完全同步 */
const SLOT_PHASE_OFFSET = [0, 5, 9, 3, 11] as const;

export function resolveSignalJammingStepMs(raw?: number): number {
  if (raw == null || !Number.isFinite(raw)) return SIGNAL_JAMMING_STEP_MS_DEFAULT;
  return Math.min(SIGNAL_JAMMING_STEP_MS_MAX, Math.max(SIGNAL_JAMMING_STEP_MS_MIN, Math.round(raw)));
}

export function signalJammingDisplayedDigit(
  epochMs: number,
  slotIndex: number,
  nowMs: number,
  stepMs?: number,
): number {
  const step = resolveSignalJammingStepMs(stepMs);
  const tick = Math.floor((nowMs - epochMs) / step);
  const off = SLOT_PHASE_OFFSET[slotIndex % SLOT_PHASE_OFFSET.length]!;
  const phase = (tick + off) % LEN;
  return SIGNAL_JAMMING_PINGPONG[phase]!;
}
