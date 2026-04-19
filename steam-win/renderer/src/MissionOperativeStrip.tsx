import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { HEROES, resolveMissionBriefCarouselLines, setStoredHeroId } from './heroes';
import { HeroAvatarSilhouette } from './home/HeroAvatarSilhouette';
import { useTeletypeReveal } from './useTeletypeReveal';

const BRIEF_LINE_ROTATE_MS = 4200;

export function MissionOperativeStrip({
  operativeId,
  onOperativeChange,
  previewLevelId,
  className = '',
}: {
  operativeId: string;
  onOperativeChange: (id: string) => void;
  /** 目前預覽的關卡 id（作戰地圖 LEVELS[].id） */
  previewLevelId: number;
  className?: string;
}) {
  const hero = HEROES.find((h) => h.id === operativeId) ?? HEROES[0];
  const briefLines = useMemo(
    () => resolveMissionBriefCarouselLines(operativeId, previewLevelId),
    [operativeId, previewLevelId],
  );
  const [lineIndex, setLineIndex] = useState(0);
  const line = briefLines[lineIndex % briefLines.length] ?? briefLines[0];
  const hook = hero.missionMapHook?.trim();
  const teletypeKey = `${operativeId}-${previewLevelId}-${lineIndex}`;
  const { text: lineTyped, done: lineTypedDone } = useTeletypeReveal(line, teletypeKey);

  useEffect(() => {
    setLineIndex(0);
  }, [operativeId, previewLevelId, briefLines]);

  useEffect(() => {
    if (briefLines.length <= 1) return;
    const id = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % briefLines.length);
    }, BRIEF_LINE_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [briefLines]);

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border-2 border-[#1e293b] bg-[#0f141c]/95 p-3 shadow-xl backdrop-blur-sm sm:flex-row sm:items-stretch sm:gap-4 sm:p-3.5 ${className}`}
    >
      <div className="flex shrink-0 flex-col gap-2 sm:justify-center">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
          目前執行幹員
        </div>
        <div className="flex items-center justify-center gap-2 sm:justify-start">
          {HEROES.map((h) => {
            const active = h.id === operativeId;
            return (
              <button
                key={h.id}
                type="button"
                title={`切換為 ${h.name}`}
                onClick={() => {
                  setStoredHeroId(h.id);
                  onOperativeChange(h.id);
                }}
                className={`relative rounded-xl border-2 p-0.5 transition-all ${
                  active
                    ? 'border-[#F59E0B] bg-[#F59E0B]/15 shadow-[0_0_16px_rgba(245,158,11,0.25)]'
                    : 'border-transparent opacity-70 hover:border-slate-600 hover:opacity-100'
                }`}
              >
                <HeroAvatarSilhouette heroId={h.id} size={40} />
              </button>
            );
          })}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${operativeId}-${previewLevelId}-${lineIndex}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="min-w-0 flex-1 border-l-0 border-t border-emerald-500/40 pt-3 sm:border-l-2 sm:border-t-0 sm:pl-3 sm:pt-0"
        >
          <div className="space-y-2 text-left leading-relaxed text-slate-300">
            <p className="text-base font-medium sm:text-lg" aria-busy={!lineTypedDone}>
              <span className="font-bold text-[#F59E0B]/90">{hero.name}</span>
              <span className="text-slate-500">：</span>
              <span aria-hidden="true">{lineTyped}</span>
              {!lineTypedDone ? (
                <span
                  className="ops-typing-caret ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-px rounded-[1px] bg-[#F59E0B]/75 align-middle"
                  aria-hidden
                />
              ) : null}
              <span className="sr-only">{line}</span>
            </p>
            {hook ? (
              <p className="border-l-2 border-emerald-600/40 pl-2.5 text-xs leading-snug text-slate-500 sm:text-sm">
                {hook}
              </p>
            ) : null}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
