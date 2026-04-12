import type { GridSystem } from '../levelData/types';

/** gridSystem → 指令數字上限 */
export function maxDigitForGrid(gs: GridSystem): number {
  if (gs === 'TRIANGLE') return 3;
  if (gs === 'HEXAGON') return 6;
  return 8;
}

/** 輪播上限 = maxDigit + 1，讓玩家有機會選到不能放的數字（增加干擾感） */
function jammingCeil(gs: GridSystem): number {
  return Math.min(maxDigitForGrid(gs) + 1, 8);
}

/** 依 maxDigit 產生 1→max→…→2 pingpong（不含尾端重複 1） */
function buildPingpong(maxDigit: number): readonly number[] {
  const up: number[] = [];
  for (let i = 1; i <= maxDigit; i++) up.push(i);
  const down: number[] = [];
  for (let i = maxDigit - 1; i >= 2; i--) down.push(i);
  return [...up, ...down];
}

const pingpongCache = new Map<number, readonly number[]>();
function getPingpong(maxDigit: number): readonly number[] {
  let pp = pingpongCache.get(maxDigit);
  if (!pp) {
    pp = buildPingpong(maxDigit);
    pingpongCache.set(maxDigit, pp);
  }
  return pp;
}

/** @deprecated 僅保留 SQUARE 的舊序列供外部參考 */
export const SIGNAL_JAMMING_PINGPONG: readonly number[] = buildPingpong(8);

/** 未在 levels.json 指定 `commandSlotJammingStepMs` 時使用；數字愈大輪播愈慢 */
export const SIGNAL_JAMMING_STEP_MS_DEFAULT = 200;

export const SIGNAL_JAMMING_STEP_MS_MIN = 80;
export const SIGNAL_JAMMING_STEP_MS_MAX = 2000;

/** @deprecated 改用 `resolveSignalJammingStepMs` 或關卡欄位 */
export const SIGNAL_JAMMING_STEP_MS = SIGNAL_JAMMING_STEP_MS_DEFAULT;

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
  gridSystem?: GridSystem,
): number {
  const maxD = jammingCeil(gridSystem ?? 'SQUARE');
  const pp = getPingpong(maxD);
  const step = resolveSignalJammingStepMs(stepMs);
  const tick = Math.floor((nowMs - epochMs) / step);
  const off = SLOT_PHASE_OFFSET[slotIndex % SLOT_PHASE_OFFSET.length]!;
  const phase = (tick + off) % pp.length;
  return pp[phase]!;
}
