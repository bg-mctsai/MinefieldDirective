import { AnimatePresence, motion } from 'motion/react';
import { HEROES } from '../heroes';
import type { HeroDef } from '../heroes';
import { TeletypeInline } from '../teletype';
import { HeroAvatarSilhouette } from './HeroAvatarSilhouette';
import { useHeroPortraitLightbox } from './HeroPortraitLightbox';

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
  const { openPortrait } = useHeroPortraitLightbox();

  return (
    <motion.aside
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.18, duration: 0.45 }}
      className="relative lg:col-span-5"
    >
      <div className="relative overflow-hidden rounded-3xl border-2 border-[#1e293b] bg-[#0f141c]/95 p-6 shadow-xl">
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

        <div className="relative flex flex-col items-center gap-4 md:flex-row md:items-start">
          <button
            type="button"
            onClick={() => openPortrait(hero.id)}
            title="點擊放大頭像"
            aria-label={`放大 ${hero.name} 頭像`}
            className="group relative flex h-28 w-28 shrink-0 cursor-zoom-in items-center justify-center rounded-2xl border border-[#F59E0B]/30 bg-[#0B0E14] shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] outline-none ring-offset-2 ring-offset-[#0f141c] transition-[transform,box-shadow] hover:scale-[1.02] hover:shadow-[0_0_0_2px_rgba(245,158,11,0.35)] focus-visible:ring-2 focus-visible:ring-amber-500/80 active:scale-[0.99]"
          >
            <HeroAvatarSilhouette heroId={hero.id} size={104} className="relative z-[1]" />
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl border border-emerald-500/20"
              animate={{ opacity: [0.35, 0.9, 0.35] }}
              transition={{ duration: 3.2, repeat: Infinity }}
            />
          </button>
          <div className="min-w-0 flex-1 text-center md:text-left">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Hero Spotlight</div>
            <div className="mt-1 text-xl font-black text-white">{hero.name}</div>
            <div className="text-sm text-[#F59E0B]/90">{hero.role}</div>
            <AnimatePresence mode="wait">
              <motion.p
                key={quoteKey}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="mt-4 border-l-2 border-emerald-500/60 pl-3 text-left text-sm leading-relaxed text-slate-400"
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
            <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
              {HEROES.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => onPickHero(h.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                    h.id === heroId ? 'bg-[#F59E0B] text-black' : 'bg-[#1a2332] text-slate-400 hover:text-white'
                  }`}
                >
                  {h.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
