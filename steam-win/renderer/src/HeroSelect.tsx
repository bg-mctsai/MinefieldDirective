import { useId, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Camera,
  ChevronLeft,
  Compass,
  Lock,
  ScrollText,
  StickyNote,
  Tag,
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
import { HeroAvatarSilhouette, getHeroPortraitUrl } from './home/HeroAvatarSilhouette';
import { heroSkillHudLucideIcon } from './game/heroSkillHudIcons';
import { emit } from './audio/AudioEngine';
import { useEffectiveUnlockedHeroIds } from './game/heroUnlockedStorage';
import { heroUnlockRequirementHint } from './game/heroUnlockByChapter';

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

/** 無立繪檔時：匿名戰術剪影 SVG */
function LockedMysteryFallbackSvg({ gid }: { gid: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center p-[8%]">
      <svg
        viewBox="0 0 100 100"
        className="h-[76%] max-h-full w-auto max-w-[82%] drop-shadow-[0_0_14px_rgba(245,158,11,0.08)]"
        aria-hidden
      >
        <defs>
          <linearGradient id={`${gid}-sil`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="45%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id={`${gid}-rim`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(245,158,11,0.55)" />
            <stop offset="45%" stopColor="rgba(16,185,129,0.35)" />
            <stop offset="100%" stopColor="rgba(245,158,11,0.28)" />
          </linearGradient>
          <radialGradient id={`${gid}-veil`} cx="50%" cy="36%" r="55%">
            <stop offset="0%" stopColor="rgba(15,23,42,0)" />
            <stop offset="72%" stopColor="rgba(15,23,42,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.42)" />
          </radialGradient>
        </defs>
        <rect
          x="10"
          y="10"
          width="80"
          height="80"
          rx="13"
          fill="none"
          stroke="rgba(71,85,105,0.4)"
          strokeWidth="0.75"
          strokeDasharray="3.5 3.5"
        />
        <path
          d="M 50 21
             C 66 21 77 33 77 47
             L 75 54
             C 83 58 88 68 88 80
             L 88 92
             L 12 92
             L 12 80
             C 12 68 17 58 25 54
             L 23 47
             C 23 33 34 21 50 21 Z"
          fill={`url(#${gid}-sil)`}
          stroke={`url(#${gid}-rim)`}
          strokeWidth="1.15"
          strokeLinejoin="round"
        />
        <path
          d="M 34 46 C 40 40 60 40 66 46"
          fill="none"
          stroke="rgba(245,158,11,0.22)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <rect x="42" y="56" width="16" height="10" rx="1.5" fill="#020617" opacity="0.85" />
        <path
          d="M 50 21 C 66 21 77 33 77 47 L 75 54 C 83 58 88 68 88 80 L 88 92 L 12 92 L 12 80 C 12 68 17 58 25 54 L 23 47 C 23 33 34 21 50 21 Z"
          fill={`url(#${gid}-veil)`}
        />
        <text
          x="50"
          y="97"
          textAnchor="middle"
          fontSize="11"
          fontWeight="900"
          fontFamily="ui-monospace, monospace"
          fill="rgba(148,163,184,0.28)"
          letterSpacing="0.12em"
        >
          ?
        </text>
      </svg>
    </div>
  );
}

/**
 * 未解鎖幹員占位：有立繪時以真實肖像經對比／去彩／暗角疊成剪影感，最上層再以「?」遮蓋；無檔則幾何剪影 SVG。
 */
function LockedMysteryAvatar({ heroId, className = '' }: { heroId: string; className?: string }) {
  const rawId = useId();
  const gid = `mq-${rawId.replace(/:/g, '')}`;
  const portraitSrc = getHeroPortraitUrl(heroId);

  return (
    <div
      className={`relative isolate size-full min-h-0 overflow-hidden bg-[#05070d] ${className}`}
    >
      {portraitSrc ? (
        <>
          <img
            src={portraitSrc}
            alt=""
            draggable={false}
            decoding="async"
            className="pointer-events-none absolute inset-0 size-full scale-[1.07] object-cover object-[center_18%]"
            style={{
              filter: 'grayscale(1) contrast(1.85) brightness(0.36)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/42 via-slate-950/28 to-black/72"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 58% 72% at 50% 36%, transparent 0%, rgba(0,0,0,0.08) 52%, rgba(0,0,0,0.62) 100%)',
            }}
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 mix-blend-overlay bg-amber-500/[0.11]" aria-hidden />
          <div className="pointer-events-none absolute inset-0 mix-blend-soft-light bg-slate-300/[0.06]" aria-hidden />
          <div className="pointer-events-none absolute inset-0 mix-blend-color bg-cyan-950/14" aria-hidden />
        </>
      ) : (
        <LockedMysteryFallbackSvg gid={gid} />
      )}
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(ellipse 85% 70% at 50% 38%, rgba(34,211,238,0.07) 0%, transparent 52%), radial-gradient(ellipse 100% 55% at 50% 100%, rgba(245,158,11,0.055) 0%, transparent 48%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.11]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.45) 1px, transparent 1px)',
          backgroundSize: '9px 9px',
        }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-[0.42] mix-blend-overlay scanlines" />
      <div className="pointer-events-none absolute inset-[5px] rounded-[0.65rem] border border-cyan-400/15" />
      <div className="pointer-events-none absolute inset-[11px] rounded-md border border-white/[0.05]" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_24px_rgba(0,0,0,0.38)]" />
      {portraitSrc ? (
        <div
          className="pointer-events-none absolute inset-0 z-[8] flex items-center justify-center bg-black/32"
          aria-hidden
        >
          <span className="font-black tabular-nums leading-none text-slate-100/[0.88] max-[380px]:text-6xl text-7xl sm:text-[5.25rem] [text-shadow:0_0_42px_rgba(0,0,0,1),0_3px_0_rgba(0,0,0,0.92)]">
            ?
          </span>
        </div>
      ) : null}
    </div>
  );
}

/** 未解鎖列右側：無劇透的機密版面填充 */
function LockedRosterMysteryFill() {
  const widths = ['58%', '92%', '74%', '48%'] as const;
  return (
    <div className="mt-1 flex min-h-[5.25rem] flex-col justify-end gap-2 border-l border-cyan-500/15 pl-3">
      <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-slate-600">
        CLASSIFIED · NO CLEARANCE
      </p>
      <div className="flex flex-col gap-1.5">
        {widths.map((w, i) => (
          <div
            key={i}
            className="h-2 rounded-sm bg-gradient-to-r from-slate-600/55 via-slate-500/25 to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            style={{ width: w }}
          />
        ))}
      </div>
    </div>
  );
}

function HeroDossierPanel({ hero, locked }: { hero: HeroDef; locked: boolean }) {
  if (locked) {
    return (
      <div
        className="relative overflow-hidden rounded-3xl border-2 border-cyan-950/55 bg-gradient-to-br from-[#0b121c] via-[#080d14] to-[#05070c] p-7 shadow-2xl shadow-black/40 xl:p-8"
        aria-label={`${hero.name}，檔案未解鎖`}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.35) 1px, transparent 1px)',
            backgroundSize: '14px 14px',
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-overlay scanlines" aria-hidden />
        <ShoulderTape className="opacity-45" />
        <div className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-cyan-500/25 via-cyan-400/10 to-transparent" aria-hidden />

        <div className="relative flex min-h-[15rem] flex-col items-center justify-center gap-8 py-8">
          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-cyan-500/12 via-transparent to-amber-500/10 blur-md" aria-hidden />
            <div className="relative h-44 w-44 shrink-0 overflow-hidden rounded-2xl border-2 border-cyan-500/25 bg-[#04060a] shadow-[0_0_0_1px_rgba(0,0,0,0.5),inset_0_0_32px_rgba(0,0,0,0.5)]">
              <LockedMysteryAvatar heroId={hero.id} />
            </div>
          </div>
          <div className="text-center">
            <p className="mb-2 font-mono text-[10px] font-black uppercase tracking-[0.28em] text-slate-600">
              DOSSIER LOCKED
            </p>
            <div className="bg-gradient-to-b from-white to-slate-400 bg-clip-text text-3xl font-black tracking-tight text-transparent md:text-4xl">
              {hero.name}
            </div>
            <div className="mx-auto mt-4 h-px max-w-[12rem] bg-gradient-to-r from-transparent via-cyan-500/35 to-transparent" aria-hidden />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-[#1e293b] bg-[#0f141c]/95 p-7 shadow-2xl xl:p-8">
      <ShoulderTape />
      <ConfidentialStamp className="absolute right-6 top-6" />

      {/* 表頭：識別資訊 */}
      <div className="border-b border-[#1e293b] pb-5">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300">
          DOSSIER · 幹員個人檔案
        </div>
        <div className="mt-1 text-3xl font-black text-white">{hero.name}</div>
        <div className="text-lg font-bold text-[#F59E0B]">{hero.role}</div>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-sm text-slate-300">
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

      {/* BACKGROUND */}
      <section className="mt-5">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em] text-slate-300">
          <ScrollText size={14} className="text-[#F59E0B]/80" />
          BACKGROUND
        </h3>
        <div className="space-y-2 border-l-2 border-emerald-500/40 pl-3 text-base leading-relaxed text-slate-100">
          {(hero.background ?? ['（尚無檔案）']).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      {/* SPECIALTIES */}
      <section className="mt-5">
        <h3 className="mb-2 text-sm font-black uppercase tracking-[0.08em] text-slate-300">
          SPECIALTIES
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {(hero.specialties ?? []).map((s) => (
            <span
              key={s}
              className="rounded-md border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-2.5 py-1 text-sm font-bold text-[#F59E0B]"
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
                  className="flex gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-2.5 text-sm text-slate-200"
                >
                  {s.hudIcon ? (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-emerald-500/35 bg-[#0B0E14] text-[#F59E0B]">
                      <Icon size={18} strokeWidth={2.25} aria-hidden />
                    </span>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-emerald-400">{s.name}</div>
                    {s.detail.trim() ? (
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{s.detail}</p>
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
        <h3 className="mb-2 text-sm font-black uppercase tracking-[0.08em] text-slate-300">
          PERSONAL EFFECTS
        </h3>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(hero.personalItems ?? []).map((it) => (
            <li
              key={it.label}
              className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-[#0B0E14] px-2.5 py-2.5 text-sm text-slate-200"
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

export default function HeroSelect({
  onBack,
  devHeroUnlockToggle,
}: {
  onBack: () => void;
  /** DEV：一鍵視同全部幹員已解鎖，便於驗證檔案 UI */
  devHeroUnlockToggle?: {
    unlockAllActive: boolean;
    onToggleUnlockAll: () => void;
  };
}) {
  const [selected, setSelected] = useState(() => getStoredHeroId());
  const effectiveUnlockedIds = useEffectiveUnlockedHeroIds();
  const unlocked = useMemo(() => new Set(effectiveUnlockedIds), [effectiveUnlockedIds]);
  const hero = useMemo(() => HEROES.find((h) => h.id === selected) ?? HEROES[0], [selected]);
  const heroUnlocked = unlocked.has(hero.id);
  const deployedHeroId = getStoredHeroId();

  return (
    <TerminalBackdrop className="font-mono text-slate-200 selection:bg-[#F59E0B]/30">
      <div className="relative z-10 mx-auto w-full max-w-[min(96vw,1720px)] px-6 py-9 md:px-10">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4"
        >
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border-2 border-[#1e293b] bg-[#0f141c] px-4 py-2.5 text-base font-bold text-slate-200 hover:border-[#F59E0B]/50 hover:text-[#F59E0B]"
          >
            <ChevronLeft size={18} />
            返回首頁
          </button>
          <div className="flex flex-wrap items-center gap-3 text-white">
            <h1 className="text-2xl font-black md:text-3xl">幹員個人檔案 · Dossier</h1>
            {devHeroUnlockToggle != null && (
              <button
                type="button"
                onClick={devHeroUnlockToggle.onToggleUnlockAll}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                  devHeroUnlockToggle.unlockAllActive
                    ? 'border-rose-400/70 bg-rose-950/40 text-rose-100 hover:bg-rose-900/50'
                    : 'border-emerald-400/60 bg-emerald-950/35 text-emerald-100 hover:bg-emerald-900/45'
                }`}
                aria-pressed={devHeroUnlockToggle.unlockAllActive}
                aria-label={
                  devHeroUnlockToggle.unlockAllActive
                    ? '測試：還原幹員檔案鎖定'
                    : '測試：開放全部幹員檔案'
                }
              >
                {devHeroUnlockToggle.unlockAllActive
                  ? '測試 · 還原鎖定'
                  : '測試 · 開放全部幹員'}
              </button>
            )}
          </div>
        </motion.header>

        <div className="grid gap-7 lg:grid-cols-12">
          {/* 左：幹員清單 */}
          <div className="space-y-3 lg:col-span-5">
            <h2 className="text-sm font-black uppercase tracking-[0.1em] text-slate-300">
              ROSTER · 在編幹員
            </h2>
            {HEROES.map((h, i) => {
              const active = h.id === selected;
              const canUse = unlocked.has(h.id);
              const lockHint = canUse ? null : heroUnlockRequirementHint(h.id);
              const rosterSkillNames = getHeroCombatSkills(h).map((s) => s.name);
              const rosterSkillsLine =
                rosterSkillNames.length > 0 ? rosterSkillNames.join('、') : '教學基礎';
              return (
                <motion.button
                  key={h.id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    if (h.id !== selected) emit('ui.select.change');
                    setSelected(h.id);
                    if (canUse) setStoredHeroId(h.id);
                  }}
                  title={canUse ? undefined : lockHint ?? '檔案未解鎖'}
                  className={`relative w-full overflow-hidden rounded-3xl border-2 p-5 text-left transition-all ${
                    !canUse
                      ? active
                        ? 'cursor-pointer border-cyan-500/35 bg-gradient-to-br from-[#101820] via-[#0b1018] to-[#070a10] shadow-[0_0_28px_rgba(34,211,238,0.1)]'
                        : 'cursor-pointer border-slate-800/90 bg-gradient-to-br from-[#0c1018] via-[#090d12] to-[#06080c] opacity-[0.78] shadow-inner hover:border-slate-600/80 hover:opacity-[0.92]'
                      : active
                        ? 'border-[#F59E0B] bg-[#1a1408] shadow-[0_0_32px_rgba(245,158,11,0.22)]'
                        : 'border-[#1e293b] bg-[#0f141c]/95 hover:border-slate-600'
                  }`}
                >
                  {!canUse ? (
                    <div
                      className="pointer-events-none absolute inset-0 opacity-[0.07]"
                      style={{
                        backgroundImage:
                          'linear-gradient(rgba(148,163,184,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px)',
                        backgroundSize: '12px 12px',
                      }}
                      aria-hidden
                    />
                  ) : null}
                  {!canUse ? (
                    <div
                      className="pointer-events-none absolute inset-0 opacity-[0.28] mix-blend-overlay scanlines"
                      aria-hidden
                    />
                  ) : null}
                  <ShoulderTape className="opacity-70" />
                  <div className="flex items-start gap-4">
                    <div className="h-32 w-32 shrink-0">
                      <div
                        className={`h-32 w-32 overflow-hidden rounded-2xl border-2 bg-[#04060a] shadow-[inset_0_0_24px_rgba(0,0,0,0.45)] ${
                          canUse ? 'border-[#F59E0B]/35' : 'border-cyan-500/20'
                        }`}
                      >
                        {canUse ? (
                          <HeroAvatarSilhouette heroId={h.id} fillParent />
                        ) : (
                          <LockedMysteryAvatar heroId={h.id} />
                        )}
                      </div>
                    </div>
                    <div className="relative z-[1] min-w-0 flex-1 pt-0.5">
                      <div className="truncate text-lg font-black text-white">{h.name}</div>
                      {canUse ? (
                        <>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="font-mono text-xs text-slate-400">{h.codename}</span>
                          </div>
                          <div className="mt-0.5 truncate text-sm leading-snug">
                            <span className="font-bold text-[#F59E0B]">{h.role}</span>
                            <span className="text-emerald-400"> ({rosterSkillsLine})</span>
                          </div>
                        </>
                      ) : (
                        <LockedRosterMysteryFill />
                      )}
                    </div>
                    {canUse && deployedHeroId === h.id && (
                      <span className="shrink-0 rounded-md border border-[#F59E0B]/60 bg-[#F59E0B]/15 px-1.5 py-0.5 text-[10px] font-black text-[#F59E0B]">
                        IN USE
                      </span>
                    )}
                    {!canUse && (
                      <span className="relative z-[1] shrink-0 flex items-center gap-0.5 rounded-md border border-slate-600/70 bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-black text-slate-500 shadow-sm backdrop-blur-[2px]">
                        <Lock size={10} /> 未解鎖
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
              <HeroDossierPanel hero={hero} locked={!heroUnlocked} />
            </motion.div>
          </div>
        </div>
      </div>
    </TerminalBackdrop>
  );
}
