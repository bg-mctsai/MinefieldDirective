import { signalJammingDisplayedDigit } from './signalJamming';
import type { GameState } from './types';

/** 老張「壓箱電碼」每次壓箱後可用次數 */
export const LAOZHANG_COPY_USES_PER_COPY = 3;

export const LAOZHANG_COPY_HERO_ID = 'laozhang';

export function initialLaozhangCopiedValue(heroId: string): number | null {
  return null;
}

export function initialLaozhangCopiedUsesRemaining(heroId: string): number {
  return 0;
}

/** 從長官電報槽解析當前可壓箱的電碼（干擾關需已鎖定讀值） */
export function resolveHandTelegramValue(
  gameState: GameState,
  handIndex: number,
  heroId: string,
): number | null {
  const jamActive = Boolean(
    gameState.level.definition.commandSlotReceiveJamming && gameState.jammingEpochMs > 0,
  );
  if (jamActive) {
    const lock = gameState.jammingLockedSlot;
    if (!lock || lock.slotIndex !== handIndex) return null;
    return lock.value;
  }
  const v = gameState.hand[handIndex];
  return v === undefined ? null : v;
}
