import { useEffect, useRef, useState } from 'react';
import { emit } from '../audio/AudioEngine';

export type TeletypePace = 'default' | 'slow';

const PACE_TIMING: Record<
  TeletypePace,
  { initialMs: number; gap: (charIndex: number) => number; blipMod: number }
> = {
  /** 戰鬥 HUD、地圖台詞：較快 */
  default: {
    initialMs: 160,
    gap: (n) => 28 + ((n * 13) % 10),
    blipMod: 2,
  },
  /** 卷宗長文：較慢、首字稍晚出現；音效較疏 */
  slow: {
    initialMs: 420,
    gap: (n) => 92 + ((n * 23) % 44),
    blipMod: 4,
  },
};

export type UseTeletypeRevealOptions = {
  pace?: TeletypePace;
};

/**
 * 作戰地圖幹員台詞：逐字顯示＋極輕電報音（resetKey 變更時重播）。
 * `prefers-reduced-motion: reduce` 時改為一次顯示全文、無音效。
 */
export function useTeletypeReveal(
  full: string,
  resetKey: string,
  options?: UseTeletypeRevealOptions,
) {
  const pace = options?.pace ?? 'default';
  const [len, setLen] = useState(0);

  /**
   * 多行串行時每行一個新 key，但舊的 `len` 要同步清掉，否則比上一行短時
   * 第一幀就滿足 len >= full.length，done 變成 true、誤觸 onAllLinesDone（下一行提前開跑）。
   * React 18 同元件依 props 校正狀態：見 https://react.dev/reference/react/useState#storing-information-from-previous-renders
   */
  const prevKeyRef = useRef<string | null>(null);
  if (prevKeyRef.current !== resetKey) {
    if (prevKeyRef.current != null) {
      setLen(0);
    }
    prevKeyRef.current = resetKey;
  }

  useEffect(() => {
    if (!full) {
      setLen(0);
      return;
    }

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;

    if (reduce) {
      setLen(full.length);
      return;
    }

    setLen(0);
    let cancelled = false;
    let i = 0;
    let tid: number | undefined;
    const timing = PACE_TIMING[pace];

    const step = () => {
      if (cancelled) return;
      i += 1;
      const next = Math.min(i, full.length);
      setLen(next);
      if (next > 0 && (next === full.length || next % timing.blipMod === 1)) {
        emit('vo.teletype.blip');
      }
      if (next < full.length) {
        const gap = timing.gap(next);
        tid = window.setTimeout(step, gap);
      }
    };

    tid = window.setTimeout(step, timing.initialMs);
    return () => {
      cancelled = true;
      if (tid !== undefined) window.clearTimeout(tid);
    };
  }, [full, resetKey, pace]);

  return {
    text: full.slice(0, len),
    done: full.length === 0 || len >= full.length,
  };
}
