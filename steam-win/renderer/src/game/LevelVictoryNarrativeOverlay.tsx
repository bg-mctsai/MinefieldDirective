import { AnimatePresence, motion } from 'motion/react';
import { Radio } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LevelVictoryNarrativeBlock } from '../levelData/levelVictoryNarrative';
import { DialogueTeletypeLine } from './HeroUnlockDialogueOverlay';

const SPEAKER_COLOR: Record<string, string> = {
  老Ｋ: 'text-amber-300',
  小明: 'text-cyan-200',
  艾達: 'text-emerald-300',
  系統音: 'text-slate-400',
  通訊頻道: 'text-red-300/90',
  指揮官: 'text-orange-300',
  老張: 'text-stone-300',
  波比: 'text-yellow-200/90',
  鎢鋼: 'text-zinc-400',
  克萊兒: 'text-sky-200',
};

function speakerClass(name: string): string {
  return SPEAKER_COLOR[name] ?? 'text-slate-200';
}

export function LevelVictoryNarrativeOverlay({
  visible,
  narrative,
  onComplete,
}: {
  visible: boolean;
  narrative: LevelVictoryNarrativeBlock;
  onComplete: () => void;
}) {
  const lines = narrative.lines;
  const [lineIndex, setLineIndex] = useState(0);
  const [lineTypingDone, setLineTypingDone] = useState(false);
  const current = lines[lineIndex];
  const isLast = lineIndex >= lines.length - 1;
  const lineResetKey = useMemo(
    () => `lv-narr-${lineIndex}-${current?.speaker}-${current?.text}`,
    [lineIndex, current?.speaker, current?.text],
  );

  useEffect(() => {
    if (visible) {
      setLineIndex(0);
      setLineTypingDone(lines.length === 0);
    }
  }, [visible, lines.length, narrative.title]);

  useEffect(() => {
    setLineTypingDone(false);
  }, [lineIndex, visible]);

  const advance = useCallback(() => {
    if (!lineTypingDone) return;
    if (isLast) {
      onComplete();
      return;
    }
    setLineIndex((i) => i + 1);
  }, [isLast, lineTypingDone, onComplete]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!visible) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, advance]);

  if (!current) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[64] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lv-narrative-title"
        >
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            className="max-h-[min(88vh,44rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 border-red-700/50 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 shadow-[0_24px_80px_rgba(127,29,29,0.35)] sm:p-8"
          >
            <div className="mb-5 flex items-center gap-3 border-b border-red-800/40 pb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-950/60">
                <Radio className="h-6 w-6 text-red-400" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-red-400/90">遠端即時通訊</p>
                <h2 id="lv-narrative-title" className="text-xl font-black text-white sm:text-2xl">
                  {narrative.title}
                </h2>
              </div>
            </div>

            <div className="mb-6 min-h-[8rem]">
              <p className={`mb-2 text-sm font-black tracking-wide ${speakerClass(current.speaker)}`}>
                {current.speaker}
              </p>
              <DialogueTeletypeLine
                text={current.text}
                resetKey={lineResetKey}
                caretClassName="bg-red-300/80"
                onTypingDone={setLineTypingDone}
              />
            </div>

            <p className="mb-4 text-center text-xs text-slate-500">
              {lineIndex + 1} / {lines.length}
              {!lineTypingDone ? ' · 讀取中…' : isLast ? ' · 點擊繼續' : ' · 點擊下一句'}
            </p>

            <button
              type="button"
              onClick={advance}
              disabled={!lineTypingDone}
              className="w-full rounded-xl border border-red-500/30 bg-red-950/80 py-3.5 text-base font-black text-red-100 transition-colors hover:bg-red-900/90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isLast ? '……通訊歸零' : '下一句'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
