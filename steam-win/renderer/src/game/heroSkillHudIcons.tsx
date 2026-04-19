import { Activity, Mails, Sparkles, type LucideIcon } from 'lucide-react';

/** 與 heroes.ts `HeroCombatSkill.hudIcon` 字串一致 */
export type HeroSkillHudIconId = 'mails' | 'activity';

export function heroSkillHudLucideIcon(id?: string): LucideIcon {
  switch (id) {
    case 'mails':
      return Mails;
    case 'activity':
      return Activity;
    default:
      return Sparkles;
  }
}
