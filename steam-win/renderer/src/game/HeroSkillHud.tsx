import { motion } from 'motion/react';
import { ShieldOff } from 'lucide-react';
import { getHeroCombatSkills, getHeroDef } from '../heroes';
import type { HeroCombatTheme } from './heroCombatTheme';
import { heroSkillHudLucideIcon } from './heroSkillHudIcons';

/** 對局棋盤右側：幹員被動技能（圖示左、名稱右）；詳情以原生 title（tooltip）顯示。老張另保留「加固模組」狀態 UI。 */
export function HeroSkillHud({
  heroId,
  laozhangFortifyRemaining = 0,
  bobbyDownshiftRemaining = 0,
  theme,
}: {
  heroId: string;
  laozhangFortifyRemaining?: number;
  /** 波比「緊急降碼」本關剩餘次數 */
  bobbyDownshiftRemaining?: number;
  theme: HeroCombatTheme;
}) {
  if (heroId === 'laozhang') {
    const spent = laozhangFortifyRemaining <= 0;
    return (
      <div
        className={`flex shrink-0 items-center gap-1.5 rounded-xl border-2 px-2 py-1.5 shadow-md sm:gap-2 sm:px-2.5 sm:py-2 ${
          spent ? 'border-slate-700 bg-slate-900/80' : `${theme.telegraphWrap}`
        }`}
        title={
          spent
            ? '加固模組已耗盡'
            : `加固模組：放錯不爆，該格改算火力（本關剩 ${laozhangFortifyRemaining} 次）`
        }
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
            {spent ? '已耗盡' : `剩 ${laozhangFortifyRemaining} 次`}
          </div>
        </div>
      </div>
    );
  }

  const skills = getHeroCombatSkills(getHeroDef(heroId));
  if (skills.length === 0) return null;

  const shellClass = `flex min-w-[5.75rem] w-max shrink-0 flex-col items-stretch gap-1 rounded-lg border-2 px-1.5 py-1.5 shadow-md sm:min-w-[6.25rem] sm:gap-1.5 sm:rounded-xl sm:px-2 sm:py-2 sm:shadow-lg md:min-w-[6.75rem] md:rounded-2xl md:shadow-xl ${theme.telegraphWrap}`;

  return (
    <motion.div className={shellClass} role="group" aria-label="幹員被動技能">
      {skills.map((s) => {
        const tip = s.detail.trim() || s.name;
        const title = `${s.name}：${tip}`;
        const Icon = heroSkillHudLucideIcon(s.hudIcon);
        const iconClass =
          heroId === 'bobby' ? 'text-teal-400/95' : 'text-[#F59E0B]/90';
        const isDownshift = heroId === 'bobby' && s.name === '緊急降碼';
        const downshiftSpent = isDownshift && bobbyDownshiftRemaining <= 0;
        const chargeTitle = isDownshift
          ? `${title}（本關剩 ${bobbyDownshiftRemaining} 次）`
          : title;
        return (
          <button
            key={s.name}
            type="button"
            title={chargeTitle}
            aria-label={chargeTitle}
            className={`flex w-full cursor-help flex-row items-center gap-1.5 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-slate-800/50 sm:gap-2 sm:px-1.5 sm:py-2 ${
              downshiftSpent ? 'opacity-45' : ''
            }`}
          >
            <Icon
              className={`h-5 w-5 shrink-0 sm:h-6 sm:w-6 ${downshiftSpent ? 'text-slate-600' : iconClass}`}
              strokeWidth={2.25}
              aria-hidden
            />
            <span
              className={`min-w-0 flex-1 text-[11px] font-black leading-tight sm:text-xs md:text-sm ${
                downshiftSpent ? 'text-slate-600 line-through' : 'text-white'
              }`}
            >
              {s.name}
              {isDownshift ? (
                <span className={downshiftSpent ? '' : 'text-teal-300/90'}> ×{bobbyDownshiftRemaining}</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </motion.div>
  );
}
