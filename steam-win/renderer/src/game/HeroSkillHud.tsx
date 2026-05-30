import { motion } from 'motion/react';
import { Copy, ShieldOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getHeroCombatSkills, getHeroDef } from '../heroes';
import { LAOZHANG_COPY_USES_PER_COPY } from './laozhangCopyCommand';
import type { HeroCombatTheme } from './heroCombatTheme';
import { heroSkillHudLucideIcon } from './heroSkillHudIcons';

function heroSkillHudShellClass(theme: HeroCombatTheme): string {
  return `flex min-w-[5.75rem] w-max shrink-0 flex-col items-stretch gap-1 rounded-lg border-2 px-1.5 py-1.5 shadow-md sm:min-w-[6.25rem] sm:gap-1.5 sm:rounded-xl sm:px-2 sm:py-2 sm:shadow-lg md:min-w-[6.75rem] md:rounded-2xl md:shadow-xl ${theme.telegraphWrap}`;
}

const SKILL_ROW_CLASS =
  'flex w-full flex-row items-center gap-1.5 rounded-md px-1 py-1.5 text-left sm:gap-2 sm:px-1.5 sm:py-2';

function HeroSkillHudRow({
  Icon,
  name,
  charge,
  iconClass,
  chargeClass,
  dimmed = false,
  highlighted = false,
  title,
}: {
  Icon: LucideIcon;
  name: string;
  charge?: string;
  iconClass: string;
  chargeClass: string;
  dimmed?: boolean;
  highlighted?: boolean;
  title: string;
}) {
  return (
    <div
      className={`${SKILL_ROW_CLASS} cursor-help transition-colors hover:bg-slate-800/50 ${
        dimmed ? 'opacity-45' : ''
      } ${highlighted ? 'bg-slate-800/55 ring-1 ring-orange-400/30' : ''}`}
      title={title}
      aria-label={title}
    >
      <Icon
        className={`h-5 w-5 shrink-0 sm:h-6 sm:w-6 ${dimmed ? 'text-slate-600' : iconClass}`}
        strokeWidth={2.25}
        aria-hidden
      />
      <span
        className={`min-w-0 flex-1 text-[11px] font-black leading-tight sm:text-xs md:text-sm ${
          dimmed ? 'text-slate-600 line-through' : 'text-white'
        }`}
      >
        {name}
        {charge ? <span className={dimmed ? '' : chargeClass}> {charge}</span> : null}
      </span>
    </div>
  );
}

function FortifyModuleHud({
  fortifyRemaining,
  theme,
}: {
  fortifyRemaining: number;
  theme: HeroCombatTheme;
}) {
  const spent = fortifyRemaining <= 0;
  const title = spent
    ? '加固模組已耗盡'
    : `加固模組：放錯不爆，該格改算火力（本關剩 ${fortifyRemaining} 次）`;

  return (
    <motion.div className={heroSkillHudShellClass(theme)} role="group" aria-label="幹員被動技能">
      <HeroSkillHudRow
        Icon={ShieldOff}
        name="加固模組"
        charge={spent ? undefined : `×${fortifyRemaining}`}
        iconClass="text-orange-400/95"
        chargeClass="text-orange-300/90"
        dimmed={spent}
        title={title}
      />
    </motion.div>
  );
}

function LaozhangCopyHud({
  laozhangCopiedValue,
  laozhangCopiedUsesRemaining,
  laozhangCopySlotSelected = false,
  handSelected = false,
  theme,
}: {
  laozhangCopiedValue: number | null;
  laozhangCopiedUsesRemaining: number;
  laozhangCopySlotSelected?: boolean;
  handSelected?: boolean;
  theme: HeroCombatTheme;
}) {
  const active = laozhangCopiedUsesRemaining > 0 && laozhangCopiedValue !== null;
  const readyToCopy = handSelected && !active;
  const usingCopy = laozhangCopySlotSelected && active;
  const highlighted = readyToCopy || usingCopy;

  const title = active
    ? `壓箱電碼：「${laozhangCopiedValue}」剩 ${laozhangCopiedUsesRemaining} 次（每次壓箱可用 ${LAOZHANG_COPY_USES_PER_COPY} 次）`
    : `壓箱電碼：先選電碼，再點左側壓箱槽（每次壓箱可用 ${LAOZHANG_COPY_USES_PER_COPY} 次）`;

  return (
    <motion.div className={heroSkillHudShellClass(theme)} role="status" aria-label={title}>
      <HeroSkillHudRow
        Icon={Copy}
        name="壓箱電碼"
        charge={active ? `${laozhangCopiedValue}×${laozhangCopiedUsesRemaining}` : undefined}
        iconClass="text-orange-400/95"
        chargeClass="text-orange-300/90"
        highlighted={highlighted}
        title={title}
      />
    </motion.div>
  );
}

/** 對局棋盤右側：幹員被動技能（圖示左、名稱右）；老張／堡壘-09 另有專屬 UI。 */
export function HeroSkillHud({
  heroId,
  fortifyRemaining = 0,
  laozhangCopiedValue = null,
  laozhangCopiedUsesRemaining = 0,
  laozhangCopySlotSelected = false,
  handSelected = false,
  bobbyDownshiftRemaining = 0,
  theme,
}: {
  heroId: string;
  /** 堡壘-09「加固模組」本關剩餘次數 */
  fortifyRemaining?: number;
  laozhangCopiedValue?: number | null;
  laozhangCopiedUsesRemaining?: number;
  laozhangCopySlotSelected?: boolean;
  /** 手牌已選電碼（老張可壓箱） */
  handSelected?: boolean;
  /** 波比「緊急降碼」本關剩餘次數 */
  bobbyDownshiftRemaining?: number;
  theme: HeroCombatTheme;
}) {
  if (heroId === 'tungsten') {
    return <FortifyModuleHud fortifyRemaining={fortifyRemaining} theme={theme} />;
  }

  if (heroId === 'laozhang') {
    return (
      <LaozhangCopyHud
        laozhangCopiedValue={laozhangCopiedValue}
        laozhangCopiedUsesRemaining={laozhangCopiedUsesRemaining}
        laozhangCopySlotSelected={laozhangCopySlotSelected}
        handSelected={handSelected}
        theme={theme}
      />
    );
  }

  const skills = getHeroCombatSkills(getHeroDef(heroId));
  if (skills.length === 0) return null;

  const iconClass = heroId === 'bobby' ? 'text-teal-400/95' : 'text-[#F59E0B]/90';
  const chargeClass = heroId === 'bobby' ? 'text-teal-300/90' : 'text-[#F59E0B]/90';

  return (
    <motion.div className={heroSkillHudShellClass(theme)} role="group" aria-label="幹員被動技能">
      {skills.map((s) => {
        const tip = s.detail.trim() || s.name;
        const baseTitle = `${s.name}：${tip}`;
        const Icon = heroSkillHudLucideIcon(s.hudIcon);
        const isDownshift = heroId === 'bobby' && s.name === '緊急降碼';
        const downshiftSpent = isDownshift && bobbyDownshiftRemaining <= 0;
        const title = isDownshift
          ? `${baseTitle}（本關剩 ${bobbyDownshiftRemaining} 次）`
          : baseTitle;

        return (
          <button key={s.name} type="button" className="w-full border-0 bg-transparent p-0 text-left">
            <HeroSkillHudRow
              Icon={Icon}
              name={s.name}
              charge={isDownshift ? `×${bobbyDownshiftRemaining}` : undefined}
              iconClass={iconClass}
              chargeClass={chargeClass}
              dimmed={downshiftSpent}
              title={title}
            />
          </button>
        );
      })}
    </motion.div>
  );
}
