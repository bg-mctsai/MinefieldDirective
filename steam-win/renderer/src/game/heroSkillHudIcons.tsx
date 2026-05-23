import { Activity, ArrowDown, Mails, Sparkles, type LucideIcon } from 'lucide-react';

/** 與 heroes.ts `HeroCombatSkill.hudIcon` 字串一致 */
export type HeroSkillHudIconId = 'mails' | 'activity' | 'arrow-down';

export function heroSkillHudLucideIcon(id?: string): LucideIcon {
  switch (id) {
    case 'mails':
      return Mails;
    case 'activity':
      return Activity;
    case 'arrow-down':
      return ArrowDown;
    default:
      return Sparkles;
  }
}
