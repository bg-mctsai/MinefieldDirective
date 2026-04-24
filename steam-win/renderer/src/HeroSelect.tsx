import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Camera,
  ChevronLeft,
  Compass,
  ScrollText,
  StickyNote,
  Tag,
  ZoomIn,
} from 'lucide-react';
import {
  HEROES,
  getHeroCombatSkills,
  getStoredHeroId,
  setStoredHeroId,
  type HeroDef,
  type HeroPersonalItemIcon,
} from './heroes';
import { TerminalBackdrop } from './ui/TerminalBackdrop';
import { HeroAvatarSilhouette } from './home/HeroAvatarSilhouette';
import { useHeroPortraitLightbox } from './home/HeroPortraitLightbox';
import { heroSkillHudLucideIcon } from './game/heroSkillHudIcons';

function ConfidentialStamp({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none select-none rounded-md border-[3px] border-red-500/70 px-3 py-0.5 font-mono text-[10px] font-black uppercase tracking-[0.32em] text-red-500/85 ops-stamp-wobble ${className}`}
      style={{ textShadow: '0 0 6px rgba(239,68,68,0.35)' }}
    >
      CONFIDENTIAL
    </div>
  );
}

function ShoulderTape({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute -right-6 -top-6 h-16 w-32 rotate-[28deg] bg-gradient-to-br from-red-500/35 via-red-500/15 to-transparent ${className}`}
      style={{
        backgroundImage:
          'repeating-linear-gradient(-45deg, rgba(239,68,68,0.35) 0 6px, transparent 6px 12px)',
      }}
    />
  );
}

function PersonalItemIcon({ icon, size = 16 }: { icon: HeroPersonalItemIcon; size?: number }) {
  if (icon === 'note') return <StickyNote size={size} />;
  if (icon === 'photo') return <Camera size={size} />;
  if (icon === 'compass') return <Compass size={size} />;
  return <Tag size={size} />;
}

function HeroDossierPanel({ hero }: { hero: HeroDef }) {
  const { openPortrait } = useHeroPortraitLightbox();

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-[#1e293b] bg-[#0f141c]/95 p-6 shadow-2xl">
      <ShoulderTape />
      <ConfidentialStamp className="absolute right-6 top-6" />

      {/* 表頭：頭像 + 識別資訊 */}
      <div className="flex flex-col gap-4 border-b border-[#1e293b] pb-5 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => openPortrait(hero.id)}
          title="點擊放大頭像"
          aria-label={`放大 ${hero.name} 頭像`}
          className="group relative h-28 w-28 shrink-0 cursor-zoom-in self-center overflow-hidden rounded-2xl border border-[#F59E0B]/30 bg-[#0B0E14] outline-none ring-offset-2 ring-offset-[#0f141c] transition-[transform,box-shadow] hover:scale-[1.02] hover:shadow-[0_0_0_2px_rgba(245,158,11,0.35)] focus-visible:ring-2 focus-visible:ring-amber-500/75 active:scale-[0.99] sm:self-auto"
        >
          <HeroAvatarSilhouette heroId={hero.id} size={112} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">
            DOSSIER · 幹員個人檔案
          </div>
          <div className="mt-1 text-2xl font-black text-white">{hero.name}</div>
          <div className="text-sm font-bold text-[#F59E0B]/90">{hero.role}</div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-slate-400">
            <div>
              <span className="text-slate-500">CODENAME</span>
              <span className="ml-1.5 text-emerald-400">{hero.codename ?? '—'}</span>
            </div>
            <div>
              <span className="text-slate-500">SN</span>
              <span className="ml-1.5 text-slate-300">{hero.serialNo ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BACKGROUND */}
      <section className="mt-5">
        <h3 className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
          <ScrollText size={14} className="text-[#F59E0B]/80" />
          BACKGROUND
        </h3>
        <div className="space-y-2 border-l-2 border-emerald-500/40 pl-3 text-sm leading-relaxed text-slate-300">
          {(hero.background ?? ['（尚無檔案）']).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      {/* SPECIALTIES */}
      <section className="mt-5">
        <h3 className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
          SPECIALTIES
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {(hero.specialties ?? []).map((s) => (
            <span
              key={s}
              className="rounded-md border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-2 py-0.5 text-xs font-bold text-[#F59E0B]"
            >
              {s}
            </span>
          ))}
          {(hero.specialties ?? []).length === 0 && (
            <span className="text-xs text-slate-500">資料封存</span>
          )}
        </div>
        {getHeroCombatSkills(hero).length > 0 && (
          <div className="mt-3 space-y-2">
            {getHeroCombatSkills(hero).map((s) => {
              const Icon = heroSkillHudLucideIcon(s.hudIcon);
              return (
                <div
                  key={s.name}
                  className="flex gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-2 text-xs text-slate-300"
                >
                  {s.hudIcon ? (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-emerald-500/35 bg-[#0B0E14] text-[#F59E0B]">
                      <Icon size={18} strokeWidth={2.25} aria-hidden />
                    </span>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-emerald-400">{s.name}</div>
                    {s.detail.trim() ? (
                      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{s.detail}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* PERSONAL EFFECTS */}
      <section className="mt-5">
        <h3 className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
          PERSONAL EFFECTS
        </h3>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(hero.personalItems ?? []).map((it) => (
            <li
              key={it.label}
              className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-[#0B0E14] px-2.5 py-2 text-xs text-slate-300"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-[#0f141c] text-[#F59E0B]">
                <PersonalItemIcon icon={it.icon} />
              </span>
              <span className="truncate">{it.label}</span>
            </li>
          ))}
          {(hero.personalItems ?? []).length === 0 && (
            <li className="text-xs text-slate-500">本檔案無附帶物品。</li>
          )}
        </ul>
      </section>
    </div>
  );
}

export default function HeroSelect({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState(getStoredHeroId);
  const hero = useMemo(() => HEROES.find((h) => h.id === selected) ?? HEROES[0], [selected]);
  const { openPortrait } = useHeroPortraitLightbox();

  return (
    <TerminalBackdrop className="font-mono text-slate-200 selection:bg-[#F59E0B]/30">
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4"
        >
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border-2 border-[#1e293b] bg-[#0f141c] px-3 py-2 text-sm font-bold text-slate-200 hover:border-[#F59E0B]/50 hover:text-[#F59E0B]"
          >
            <ChevronLeft size={18} />
            返回首頁
          </button>
          <h1 className="text-xl font-black text-white md:text-2xl">幹員個人檔案 · Dossier</h1>
        </motion.header>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* 左：幹員清單 */}
          <div className="space-y-3 lg:col-span-5">
            <h2 className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
              ROSTER · 在編幹員
            </h2>
            {HEROES.map((h, i) => {
              const active = h.id === selected;
              const rosterSkills = getHeroCombatSkills(h)
                .map((s) => s.name)
                .join(' · ');
              return (
                <motion.button
                  key={h.id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    setSelected(h.id);
                    setStoredHeroId(h.id);
                  }}
                  className={`relative w-full overflow-hidden rounded-3xl border-2 p-4 text-left transition-all ${
                    active
                      ? 'border-[#F59E0B] bg-[#1a1408] shadow-[0_0_32px_rgba(245,158,11,0.22)]'
                      : 'border-[#1e293b] bg-[#0f141c]/95 hover:border-slate-600'
                  }`}
                >
                  <ShoulderTape className="opacity-70" />
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0">
                      <div className="h-14 w-14 overflow-hidden rounded-xl border border-[#F59E0B]/30 bg-[#0B0E14]">
                        <HeroAvatarSilhouette heroId={h.id} size={56} />
                      </div>
                      <button
                        type="button"
                        title={`放大 ${h.name} 頭像`}
                        aria-label={`放大 ${h.name} 頭像`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openPortrait(h.id);
                        }}
                        className="absolute -bottom-0.5 -right-0.5 z-10 flex h-[18px] w-[18px] items-center justify-center rounded-md border border-slate-600/90 bg-slate-950/95 text-amber-400 shadow-md ring-1 ring-black/40 transition-colors hover:border-amber-500/60 hover:text-amber-300"
                      >
                        <ZoomIn size={11} strokeWidth={2.6} />
                      </button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-base font-black text-white">{h.name}</span>
                        <span className="font-mono text-[10px] text-slate-500">{h.codename}</span>
                      </div>
                      <div className="text-xs font-bold text-[#F59E0B]/85">{h.role}</div>
                      {rosterSkills ? (
                        <div className="mt-0.5 truncate text-[11px] text-slate-400">
                          <span className="text-emerald-400">{rosterSkills}</span>
                        </div>
                      ) : (
                        <div className="mt-0.5 text-[11px] text-slate-500">教學基礎</div>
                      )}
                    </div>
                    {active && (
                      <span className="shrink-0 rounded-md border border-[#F59E0B]/60 bg-[#F59E0B]/15 px-1.5 py-0.5 text-[10px] font-black text-[#F59E0B]">
                        IN USE
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* 右：Dossier 詳細檔案 */}
          <div className="lg:col-span-7">
            <motion.div
              key={hero.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              <HeroDossierPanel hero={hero} />
            </motion.div>
          </div>
        </div>
      </div>
    </TerminalBackdrop>
  );
}
