import { useEffect, useMemo, useRef, useState, type ElementType, type ReactNode } from 'react';
import { useTeletypeReveal, type TeletypePace } from './useTeletypeReveal';
import { TeletypeCaret } from './TeletypeCaret';

type SeqProps = {
  lines: string[];
  /** 每次簡報／彈窗重新開啟時換 key，才會從頭打字 */
  resetKey: string;
  className?: string;
  itemClassName?: string;
  as?: 'ul' | 'div';
  itemAs?: 'li' | 'p';
  /** 最後一行逐字播完時觸發一次（resetKey／內容變更會重置） */
  onAllLinesDone?: () => void;
  /** 進行中那一行的游標顏色 */
  activeCaretClassName?: string;
  pace?: TeletypePace;
  /** 遞增時立刻顯示全文（仍觸發 onAllLinesDone） */
  skipSignal?: number;
};

/**
 * 多行敘事：依序逐字打完上一行再打下一行（每行內仍用 useTeletypeReveal）。
 */
export function SequentialTypedLines({
  lines,
  resetKey,
  className = '',
  itemClassName = '',
  as: Container = 'ul',
  itemAs: Item = 'li',
  onAllLinesDone,
  activeCaretClassName = 'bg-emerald-400/80',
  pace,
  skipSignal = 0,
}: SeqProps) {
  const [idx, setIdx] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const linesFingerprint = useMemo(() => lines.join('\u0001'), [lines]);
  const prevAllDoneRef = useRef(false);

  useEffect(() => {
    setIdx(0);
    setSkipped(false);
    prevAllDoneRef.current = false;
  }, [resetKey, linesFingerprint]);

  useEffect(() => {
    if (skipSignal <= 0) return;
    setSkipped(true);
    setIdx(Math.max(0, lines.length - 1));
  }, [skipSignal, lines.length]);

  const safeLen = lines.length;
  const clampedIdx = safeLen === 0 ? 0 : Math.min(idx, safeLen - 1);
  const current = lines[clampedIdx] ?? '';
  const lineKey = `${resetKey}-${clampedIdx}-${current}`;
  const { text: typed, done } = useTeletypeReveal(current, lineKey, pace ? { pace } : undefined);

  useEffect(() => {
    if (!done || safeLen === 0) return;
    if (idx < safeLen - 1) {
      setIdx((i) => i + 1);
    }
  }, [done, idx, safeLen]);

  const allTyped = skipped || (safeLen > 0 && idx === safeLen - 1 && done);
  useEffect(() => {
    if (!allTyped || !onAllLinesDone || prevAllDoneRef.current) return;
    prevAllDoneRef.current = true;
    onAllLinesDone();
  }, [allTyped, onAllLinesDone]);

  if (safeLen === 0) return null;

  const C = Container as ElementType;
  const I = Item as ElementType;

  if (skipped) {
    return (
      <C className={className}>
        {lines.map((line, i) => (
          <I key={`skip-${i}`} className={itemClassName}>
            {line}
          </I>
        ))}
      </C>
    );
  }

  const nodes: ReactNode[] = [];
  for (let i = 0; i < idx; i += 1) {
    const line = lines[i];
    nodes.push(
      <I key={`done-${i}`} className={itemClassName}>
        {line}
      </I>,
    );
  }
  if (idx < safeLen) {
    nodes.push(
      <I key={`active-${idx}`} className={itemClassName} aria-busy={!done}>
        <span aria-hidden="true">{typed}</span>
        {!done ? <TeletypeCaret className={activeCaretClassName} /> : null}
        <span className="sr-only">{current}</span>
      </I>,
    );
  }

  return <C className={className}>{nodes}</C>;
}
