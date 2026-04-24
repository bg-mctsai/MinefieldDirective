import type { ReactNode } from 'react';
import { useTeletypeReveal, type TeletypePace } from './useTeletypeReveal';
import { TeletypeCaret } from './TeletypeCaret';

/**
 * 單段逐字：可選前後裝飾、`sr-only` 讀稿；外層 `aria-busy` 反映是否仍在Reveal。
 */
export function TeletypeInline({
  full,
  resetKey,
  caretClassName = 'bg-emerald-400/80',
  prefix,
  suffix,
  screenReaderText,
  className = 'inline',
  pace,
}: {
  full: string;
  resetKey: string;
  caretClassName?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** 預設為全文；有裝飾性標點時可覆寫（例如含「」的讀稿） */
  screenReaderText?: string;
  /** 外層包 `aria-busy`；預設 `inline` 不打斷排版 */
  className?: string;
  pace?: TeletypePace;
}) {
  const { text, done } = useTeletypeReveal(full, resetKey, pace ? { pace } : undefined);
  const sr = screenReaderText ?? full;

  return (
    <span className={className} aria-busy={!done}>
      {prefix}
      <span aria-hidden="true">{text}</span>
      {!done ? <TeletypeCaret className={caretClassName} /> : null}
      {suffix}
      {sr ? <span className="sr-only">{sr}</span> : null}
    </span>
  );
}
