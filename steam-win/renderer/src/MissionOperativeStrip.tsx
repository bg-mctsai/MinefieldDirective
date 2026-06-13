import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Lock, ZoomIn } from 'lucide-react';
import { HEROES, resolveMissionBriefCarouselLines, setStoredHeroId } from './heroes';
import { useEffectiveUnlockedHeroIds } from './game/heroUnlockedStorage';
import { heroUnlockRequirementHint } from './game/heroUnlockByChapter';
import { HeroAvatarSilhouette } from './home/HeroAvatarSilhouette';
import { useHeroPortraitLightbox } from './home/HeroPortraitLightbox';
import { TeletypeInline } from './teletype';

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
  const effectiveUnlockedIds = useEffectiveUnlockedHeroIds();
  const unlocked = useMemo(() => new Set(effectiveUnlockedIds), [effectiveUnlockedIds]);
  const hero = HEROES.find((h) => h.id === operativeId) ?? HEROES[0];
  const briefLines = useMemo(
    () => resolveMissionBriefCarouselLines(operativeId, previewLevelId),
    [operativeId, previewLevelId],
  );
  const [lineIndex, setLineIndex] = useState(0);
  const line = briefLines[lineIndex % briefLines.length] ?? briefLines[0];
  const hook = hero.missionMapHook?.trim();
  const teletypeKey = `${operativeId}-${previewLevelId}-${lineIndex}`;
  const hookText = hook?.trim() ?? '';
  const { openPortrait } = useHeroPortraitLightbox();

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
            const canUse = unlocked.has(h.id);
            const title = canUse
              ? `切換為 ${h.name}`
              : (heroUnlockRequirementHint(h.id) ?? '尚未解鎖');
            return (
              <div key={h.id} className="relative inline-flex">
                <button
                  type="button"
                  title={title}
                  disabled={!canUse}
                  onClick={() => {
                    if (!canUse) return;
                    setStoredHeroId(h.id);
                    onOperativeChange(h.id);
                  }}
                  className={`relative rounded-xl border-2 p-0.5 transition-all ${
                    !canUse
                      ? 'cursor-not-allowed border-slate-700/80 opacity-40'
                      : active
                        ? 'border-[#F59E0B] bg-[#F59E0B]/15 shadow-[0_0_16px_rgba(245,158,11,0.25)]'
                        : 'border-transparent opacity-70 hover:border-slate-600 hover:opacity-100'
                  }`}
                >
                  <HeroAvatarSilhouette heroId={h.id} size={40} />
                  {!canUse && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                      <Lock size={14} className="text-slate-300" aria-hidden />
                    </span>
                  )}
                </button>
                {canUse && (
                <button
                  type="button"
                  title={`放大 ${h.name} 頭像`}
                  aria-label={`放大 ${h.name} 頭像`}
                  onClick={() => openPortrait(h.id)}
                  className="absolute -bottom-0.5 -right-0.5 z-10 flex h-[18px] w-[18px] items-center justify-center rounded-md border border-slate-600/90 bg-slate-950/95 text-amber-400 shadow-md ring-1 ring-black/40 transition-colors hover:border-amber-500/60 hover:text-amber-300"
                >
                  <ZoomIn size={11} strokeWidth={2.6} />
                </button>
                )}
              </div>
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
            <p className="text-base font-medium sm:text-lg">
              <span className="font-bold text-[#F59E0B]/90">{hero.name}</span>
              <span className="text-slate-500">：</span>
              <TeletypeInline full={line} resetKey={teletypeKey} caretClassName="bg-[#F59E0B]/75" />
            </p>
            {hook ? (
              <p className="border-l-2 border-emerald-600/40 pl-2.5 text-xs leading-snug text-slate-500 sm:text-sm">
                <TeletypeInline
                  full={hookText}
                  resetKey={`${teletypeKey}-hook`}
                  caretClassName="bg-emerald-600/60"
                />
              </p>
            ) : null}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
