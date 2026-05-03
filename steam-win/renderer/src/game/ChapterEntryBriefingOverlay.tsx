import { AnimatePresence, motion } from 'motion/react';
import { Megaphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SequentialTypedLines } from '../teletype';

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
  const [phraseEpoch, setPhraseEpoch] = useState(0);
  const [toneSectionDone, setToneSectionDone] = useState(
    !hasChapterTone || chapterToneLines.length === 0,
  );

  useEffect(() => {
    const skipToneWait = !hasChapterTone || chapterToneLines.length === 0;
    if (visible) {
      setPhraseEpoch((e) => e + 1);
      setToneSectionDone(skipToneWait);
    } else {
      setToneSectionDone(skipToneWait);
    }
  }, [visible, hasChapterTone, chapterToneLines.length]);

  const toneResetKey = `ch-tone-${phraseEpoch}-${chapterTitle}`;
  const briefResetKey = `ch-brief-${phraseEpoch}-${chapterTitle}`;
  const showLevelBriefingBlock = hasLevelBriefing && toneSectionDone;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-6 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            className="max-h-[min(84vh,48rem)] w-full max-w-3xl overflow-y-auto rounded-2xl border-2 border-amber-600/80 bg-slate-900/95 p-8 shadow-[0_20px_50px_rgba(245,158,11,0.15)]"
          >
            <div className="mb-5 flex items-center gap-4 border-b border-amber-700/40 pb-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-900/40">
                <Megaphone className="h-7 w-7 text-amber-400" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-amber-400">長官簡報</p>
                <h2 className="text-3xl font-black text-white">{chapterTitle}</h2>
              </div>
            </div>
            <div className="mb-7 space-y-6">
              {hasChapterTone && (
                <section>
                  {!singleSection && (
                    <p className="mb-2 text-sm font-bold uppercase tracking-[0.08em] text-amber-400">
                      章節定調
                    </p>
                  )}
                  <SequentialTypedLines
                    as="ul"
                    itemAs="li"
                    lines={chapterToneLines}
                    resetKey={toneResetKey}
                    className="space-y-4 text-left text-xl leading-relaxed text-slate-100"
                    itemClassName="border-l-2 border-amber-600/50 pl-3"
                    onAllLinesDone={() => setToneSectionDone(true)}
                  />
                </section>
              )}
              {showLevelBriefingBlock && (
                <section>
                  {!singleSection && (
                    <p className="mb-2 text-sm font-bold uppercase tracking-[0.08em] text-amber-400">
                      本關簡報
                    </p>
                  )}
                  <SequentialTypedLines
                    as="ul"
                    itemAs="li"
                    lines={levelBriefingLines}
                    resetKey={briefResetKey}
                    className="space-y-4 text-left text-xl leading-relaxed text-slate-100"
                    itemClassName="border-l-2 border-amber-600/50 pl-3"
                  />
                </section>
              )}
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="w-full rounded-xl bg-amber-600 py-4 text-xl font-black text-slate-950 shadow-lg shadow-amber-900/30 transition-colors hover:bg-amber-500"
            >
              收到，開始執行
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
