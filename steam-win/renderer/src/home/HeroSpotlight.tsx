import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HEROES, getHeroCombatSkills } from '../heroes';
import type { HeroDef } from '../heroes';
import { loadUnlockedHeroIds } from '../game/heroUnlockedStorage';
import { TeletypeInline } from '../teletype';
import { HeroPortraitZoomButton } from './HeroPortraitZoomButton';

const HOME_SPOTLIGHT_AVATAR_SIZE = 210;

export function HeroSpotlight({
  hero,
  heroId,
  quoteIdx,
  onPickHero,
}: {
  hero: HeroDef;
  heroId: string;
  quoteIdx: number;
  onPickHero: (id: string) => void;
}) {
  const quoteLine = hero.lines[quoteIdx % hero.lines.length] ?? '';
  const quoteKey = `${hero.id}-${quoteIdx}`;
  const pickableHeroes = useMemo(() => {
    const unlockedHeroIds = new Set(loadUnlockedHeroIds());
    const unlocked = HEROES.filter((h) => unlockedHeroIds.has(h.id));
    return unlocked.length > 0 ? unlocked : [HEROES[0]];
  }, []);
  const combatSkills = useMemo(() => getHeroCombatSkills(hero), [hero]);
  const currentIndex = Math.max(
    0,
    pickableHeroes.findIndex((h) => h.id === heroId),
  );
  const canSwitchHero = pickableHeroes.length > 1;
  const pickRelativeHero = (delta: number) => {
    if (!canSwitchHero) return;
    const next = pickableHeroes[(currentIndex + delta + pickableHeroes.length) % pickableHeroes.length];
    if (next) onPickHero(next.id);
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.18, duration: 0.45 }}
      className="relative lg:col-span-4"
    >
      <div className="relative overflow-hidden rounded-3xl border-2 border-[#1e293b] bg-[#0f141c]/95 p-7 shadow-xl xl:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="data-stream absolute left-[12%] top-0 h-full w-px animate-[stream_3.2s_linear_infinite] bg-gradient-to-b from-transparent via-emerald-500/50 to-transparent" />
          <div
            className="data-stream absolute left-[45%] top-0 h-full w-px animate-[stream_4.1s_linear_infinite] bg-gradient-to-b from-transparent via-[#F59E0B]/40 to-transparent"
            style={{ animationDelay: '-1.2s' }}
          />
          <div
            className="data-stream absolute right-[18%] top-0 h-full w-px animate-[stream_5s_linear_infinite] bg-gradient-to-b from-transparent via-emerald-400/35 to-transparent"
            style={{ animationDelay: '-2.4s' }}
          />
        </div>

        <div className="relative flex flex-col items-center gap-5 md:flex-row md:items-start">
          <HeroPortraitZoomButton
            heroId={hero.id}
            size={HOME_SPOTLIGHT_AVATAR_SIZE - 10}
            title={`放大 ${hero.name} 頭像`}
            ariaLabel={`放大 ${hero.name} 頭像`}
            className="relative flex shrink-0 items-center justify-center rounded-2xl border border-[#F59E0B]/30 bg-[#0B0E14] shadow-[inset_0_0_40px_rgba(0,0,0,0.58)] transition-transform hover:scale-[1.015]"
            style={{ width: HOME_SPOTLIGHT_AVATAR_SIZE, height: HOME_SPOTLIGHT_AVATAR_SIZE }}
          />
          <div className="min-w-0 flex-1 text-center md:text-left">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <button
                type="button"
                onClick={() => pickRelativeHero(-1)}
                disabled={!canSwitchHero}
                className="rounded-lg border border-slate-700/70 bg-slate-950/60 p-1 text-slate-400 transition-colors hover:border-[#F59E0B]/70 hover:text-[#F59E0B] disabled:cursor-default disabled:opacity-30"
                aria-label="切換上一名幹員"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="min-w-20 text-center text-3xl font-black text-white">{hero.name}</div>
              <button
                type="button"
                onClick={() => pickRelativeHero(1)}
                disabled={!canSwitchHero}
                className="rounded-lg border border-slate-700/70 bg-slate-950/60 p-1 text-slate-400 transition-colors hover:border-[#F59E0B]/70 hover:text-[#F59E0B] disabled:cursor-default disabled:opacity-30"
                aria-label="切換下一名幹員"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="mt-1 text-xl font-bold text-[#F59E0B]">{hero.role}</div>
            <div
              className="mt-1 space-y-0.5 text-sm font-bold leading-snug text-emerald-400 sm:text-base md:text-left"
              aria-label={
                combatSkills.length > 0
                  ? `角色技能：${combatSkills.map((s) => s.name).join('、')}`
                  : '角色技能：教學基礎'
              }
            >
              {combatSkills.length > 0 ? (
                combatSkills.map((s) => (
                  <div key={s.name} className="break-words" title={s.detail.trim() ? s.detail : undefined}>
                    （{s.name}）
                  </div>
                ))
              ) : (
                <div className="break-words">（教學基礎）</div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={quoteKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="relative mt-4 min-h-[4.6rem] overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-950/35 px-5 py-3.5 text-left text-xl leading-relaxed text-slate-100"
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
          >
            <TeletypeInline
              full={quoteLine}
              resetKey={quoteKey}
              caretClassName="bg-emerald-500/75"
              prefix={
                <span className="text-slate-500" aria-hidden>
                  「
                </span>
              }
              suffix={
                <span className="text-slate-500" aria-hidden>
                  」
                </span>
              }
              screenReaderText={`「${quoteLine}」`}
            />
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
