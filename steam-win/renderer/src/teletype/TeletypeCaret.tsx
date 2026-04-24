/** 游標幾何（不含顏色）；顏色用 `className` 疊 `bg-*` */
export const TELETYPE_CARET_BASE =
  'ops-typing-caret ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-px rounded-[1px] align-middle';

export function TeletypeCaret({ className = 'bg-emerald-400/80' }: { className?: string }) {
  return <span className={`${TELETYPE_CARET_BASE} ${className}`} aria-hidden />;
}
