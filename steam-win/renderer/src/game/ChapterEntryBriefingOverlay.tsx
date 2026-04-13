import { AnimatePresence, motion } from 'motion/react';
import { Megaphone } from 'lucide-react';

export function ChapterEntryBriefingOverlay({
  visible,
  chapterTitle,
  chapterToneLines,
  levelBriefingLines,
  onDismiss,
}: {
  visible: boolean;
  chapterTitle: string;
  chapterToneLines: string[];
  levelBriefingLines: string[];
  onDismiss: () => void;
}) {
  const hasChapterTone = chapterToneLines.length > 0;
  const hasLevelBriefing = levelBriefingLines.length > 0;
  const singleSection = (hasChapterTone ? 1 : 0) + (hasLevelBriefing ? 1 : 0) <= 1;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            className="max-h-[min(70vh,32rem)] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-amber-600/80 bg-slate-900/95 p-6 shadow-[0_20px_50px_rgba(245,158,11,0.15)]"
          >
            <div className="mb-4 flex items-center gap-3 border-b border-amber-700/40 pb-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-900/40">
                <Megaphone className="h-6 w-6 text-amber-400" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600/90">長官簡報</p>
                <h2 className="text-lg font-black text-white">{chapterTitle}</h2>
              </div>
            </div>
            <div className="mb-6 space-y-5">
              {hasChapterTone && (
                <section>
                  {!singleSection && (
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-500/90">
                      章節定調
                    </p>
                  )}
                  <ul className="space-y-3 text-left text-sm leading-relaxed text-slate-200">
                    {chapterToneLines.map((line, i) => (
                      <li key={`tone-${i}`} className="border-l-2 border-amber-600/50 pl-3">
                        {line}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {hasLevelBriefing && (
                <section>
                  {!singleSection && (
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-500/90">
                      本關簡報
                    </p>
                  )}
                  <ul className="space-y-3 text-left text-sm leading-relaxed text-slate-200">
                    {levelBriefingLines.map((line, i) => (
                      <li key={`brief-${i}`} className="border-l-2 border-amber-600/50 pl-3">
                        {line}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="w-full rounded-xl bg-amber-600 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-amber-900/30 transition-colors hover:bg-amber-500"
            >
              收到，開始執行
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
