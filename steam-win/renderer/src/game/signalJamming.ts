import type { GridSystem } from '../levelData/types';

/** gridSystem → 指令數字上限 */
export function maxDigitForGrid(gs: GridSystem): number {
  if (gs === 'HEXAGON') return 6;
  return 8;
}

/**
 * 輪播上限：方格 = maxDigit+1（可閃過 8 作干擾假數）；六角僅 1～6，不出 7、8。
 */
function jammingCeil(gs: GridSystem): number {
  const max = maxDigitForGrid(gs);
  if (gs === 'HEXAGON') return max;
  return Math.min(max + 1, 8);
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

/**
 * 各槽相對於關卡基準步長的倍率（同一 commandSlotJammingStepMs 下仍可有不同輪播節奏）。
 * 大於 1 較慢、小於 1 較快。
 */
const SLOT_STEP_MULTIPLIER = [1.0, 1.52, 0.68, 1.2, 0.88] as const;

/**
 * false：沿 pingpong 序列正向；true：時間前進時在序列上倒退（與他槽「捲動方向」相反）。
 */
const SLOT_SEQUENCE_REVERSE = [false, true, false, true, false] as const;

/** 單槽步長下限（毫秒），避免倍率過低時難以辨識 */
const SLOT_STEP_MS_FLOOR = 48;

function slotStepMs(baseStepMs: number, slotIndex: number): number {
  const mult = SLOT_STEP_MULTIPLIER[slotIndex % SLOT_STEP_MULTIPLIER.length]!;
  return Math.max(SLOT_STEP_MS_FLOOR, Math.round(baseStepMs * mult));
}

export function resolveSignalJammingStepMs(raw?: number): number {
  if (raw == null || !Number.isFinite(raw)) return SIGNAL_JAMMING_STEP_MS_DEFAULT;
  return Math.min(SIGNAL_JAMMING_STEP_MS_MAX, Math.max(SIGNAL_JAMMING_STEP_MS_MIN, Math.round(raw)));
}

/**
 * 信號干擾區輪播「每步」間隔（毫秒）。
 * 艾達：間隔再 ×2（慢一倍），上限為 {@link SIGNAL_JAMMING_STEP_MS_MAX} 的兩倍，避免極端關卡過慢。
 */
export function effectiveSignalJammingStepMs(rawStepMs: number | undefined, heroId: string): number {
  const base = resolveSignalJammingStepMs(rawStepMs);
  if (heroId !== 'ada') return base;
  return Math.min(SIGNAL_JAMMING_STEP_MS_MAX * 2, base * 2);
}

export function signalJammingDisplayedDigit(
  epochMs: number,
  slotIndex: number,
  nowMs: number,
  stepMs?: number,
  gridSystem?: GridSystem,
  /** 艾達時干擾區輪播較慢，須與 UI 一致 */
  jammingHeroId?: string,
): number {
  const maxD = jammingCeil(gridSystem ?? 'SQUARE');
  const pp = getPingpong(maxD);
  const baseStep = effectiveSignalJammingStepMs(stepMs, jammingHeroId ?? '');
  const step = slotStepMs(baseStep, slotIndex);
  const rawTick = Math.floor((nowMs - epochMs) / step);
  const reverse = SLOT_SEQUENCE_REVERSE[slotIndex % SLOT_SEQUENCE_REVERSE.length]!;
  const tick = reverse ? -rawTick : rawTick;
  const off = SLOT_PHASE_OFFSET[slotIndex % SLOT_PHASE_OFFSET.length]!;
  const phase = ((tick + off) % pp.length + pp.length) % pp.length;
  return pp[phase]!;
}

/**
 * 干擾輪播數字切換時的進場方向（與序列正／反獨立，純視覺）：true = 新數字自上方移入。
 */
export function signalJammingSlotEnterFromTop(slotIndex: number): boolean {
  const fromTop = [false, true, true, false, true] as const;
  return fromTop[slotIndex % fromTop.length]!;
}
