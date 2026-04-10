import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';

const SHOW_DELAY_MS = 380;
const OFFSET_PX = 14;

type TipState = { text: string; x: number; y: number };

export function useSvgBoardTooltip() {
  const [state, setState] = useState<TipState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ text: string; x: number; y: number } | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const open = useCallback(
    (text: string, clientX: number, clientY: number) => {
      clearTimer();
      pendingRef.current = { text, x: clientX, y: clientY };
      timerRef.current = setTimeout(() => {
        const p = pendingRef.current;
        if (!p) return;
        setState({ text: p.text, x: p.x, y: p.y });
      }, SHOW_DELAY_MS);
    },
    [clearTimer],
  );

  const onPolygonEnter = useCallback(
    (text: string, e: MouseEvent<SVGPolygonElement>) => {
      open(text, e.clientX, e.clientY);
    },
    [open],
  );

  const onPolygonMove = useCallback((e: MouseEvent<SVGPolygonElement>) => {
    const x = e.clientX;
    const y = e.clientY;
    const p = pendingRef.current;
    if (p) pendingRef.current = { ...p, x, y };
    setState((s) => (s ? { ...s, x, y } : null));
  }, []);

  const onPolygonLeave = useCallback(() => {
    clearTimer();
    pendingRef.current = null;
    setState(null);
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const tooltipEl = state ? (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[100] max-w-[min(20rem,85vw)] rounded-lg border border-amber-500/45 bg-slate-950/95 px-2.5 py-1.5 text-left text-xs font-medium leading-snug text-slate-100 shadow-[0_0_14px_rgba(251,191,36,0.22)] backdrop-blur-sm"
      style={{ left: state.x + OFFSET_PX, top: state.y + OFFSET_PX }}
    >
      {state.text}
    </div>
  ) : null;

  return { onPolygonEnter, onPolygonMove, onPolygonLeave, tooltipEl };
}
