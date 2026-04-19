import { useEffect, useRef, useState, type MutableRefObject } from 'react';

function teletypeBlip(ctxRef: MutableRefObject<AudioContext | null>) {
  if (typeof window === 'undefined') return;
  try {
    let ctx = ctxRef.current;
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
      ctxRef.current = ctx;
    }
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1020 + Math.random() * 160, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.005, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.00012, t + 0.022);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.024);
  } catch {
    // 自動播放限制或不支援
  }
}

/**
 * 作戰地圖幹員台詞：逐字顯示＋極輕電報音（resetKey 變更時重播）。
 * `prefers-reduced-motion: reduce` 時改為一次顯示全文、無音效。
 */
export function useTeletypeReveal(full: string, resetKey: string) {
  const [len, setLen] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);

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

    const step = () => {
      if (cancelled) return;
      i += 1;
      const next = Math.min(i, full.length);
      setLen(next);
      if (next > 0 && (next % 2 === 1 || next === full.length)) {
        teletypeBlip(ctxRef);
      }
      if (next < full.length) {
        const gap = 28 + ((next * 13) % 10);
        tid = window.setTimeout(step, gap);
      }
    };

    tid = window.setTimeout(step, 160);
    return () => {
      cancelled = true;
      if (tid !== undefined) window.clearTimeout(tid);
    };
  }, [full, resetKey]);

  return {
    text: full.slice(0, len),
    done: full.length === 0 || len >= full.length,
  };
}
