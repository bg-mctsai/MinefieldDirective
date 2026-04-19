import { motion } from 'motion/react';
import { ShieldOff } from 'lucide-react';
import { getHeroCombatSkills, getHeroDef } from '../heroes';
import type { HeroCombatTheme } from './heroCombatTheme';
import { heroSkillHudLucideIcon } from './heroSkillHudIcons';

/** 對局右上角：列出幹員被動技能名；詳情以原生 title（tooltip）顯示。老張另保留「加固模組」狀態 UI。 */
export function HeroSkillHud({
  heroId,
  buckEmergencyAvailable,
  theme,
}: {
  heroId: string;
  buckEmergencyAvailable: boolean;
  theme: HeroCombatTheme;
}) {
  if (heroId === 'laozhang') {
    const spent = !buckEmergencyAvailable;
    return (
      <div
        className={`flex shrink-0 items-center gap-1.5 rounded-xl border-2 px-2 py-1.5 shadow-md sm:gap-2 sm:px-2.5 sm:py-2 ${
          spent ? 'border-slate-700 bg-slate-900/80' : `${theme.telegraphWrap}`
        }`}
        title={spent ? '加固模組已耗盡' : '加固模組：每關可抵銷一次放錯導致的爆炸'}
      >
        <div className="relative">
          <ShieldOff
            size={22}
            className={spent ? 'text-slate-600' : 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.45)]'}
            strokeWidth={2}
          />
          {spent && (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full text-red-500/70"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path d="M4 4 L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M3 14 L10 21" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
            </svg>
          )}
          {!spent && (
            <motion.span
              className="absolute -inset-1 rounded-lg bg-orange-500/15"
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            />
          )}
        </div>
        <div className="min-w-0">
          <div
            className={`text-[10px] font-black uppercase tracking-wider ${spent ? 'text-slate-600' : 'text-orange-300/90'}`}
          >
            加固模組
          </div>
          <div className={`text-[9px] font-bold ${spent ? 'text-slate-600 line-through' : 'text-slate-400'}`}>
            {spent ? '已耗盡' : '每關 1 次'}
          </div>
        </div>
      </div>
    );
  }

  const skills = getHeroCombatSkills(getHeroDef(heroId));
  if (skills.length === 0) return null;

  return (
    <div
      className={`flex max-w-[min(100vw-8rem,20rem)] flex-wrap items-center justify-end gap-1 rounded-xl border-2 px-1.5 py-1 shadow-md sm:gap-1.5 sm:px-2 sm:py-1.5 ${theme.telegraphWrap}`}
      role="group"
      aria-label="幹員被動技能"
    >
      {skills.map((s) => {
        const tip = s.detail.trim() || s.name;
        const Icon = heroSkillHudLucideIcon(s.hudIcon);
        return (
          <button
            key={s.name}
            type="button"
            title={tip}
            aria-label={`${s.name}。${tip}`}
            className="flex max-w-[6.25rem] cursor-help items-center gap-1 rounded-lg border border-slate-600/85 bg-slate-950/80 px-1 py-0.5 text-left text-[9px] font-black leading-none text-slate-200 transition-colors hover:border-[#F59E0B]/55 hover:text-[#F59E0B] sm:max-w-[6.75rem] sm:gap-1.5 sm:px-1.5 sm:py-1 sm:text-[10px]"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-[#F59E0B]/90 sm:h-4 sm:w-4" strokeWidth={2.25} aria-hidden />
            <span className="min-w-0 flex-1 tracking-tight">{s.name}</span>
          </button>
        );
      })}
    </div>
  );
}
