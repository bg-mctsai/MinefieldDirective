import {
  Activity,
  ArrowDown,
  Filter,
  Footprints,
  LayoutGrid,
  Mails,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

/** 與 heroes.ts `HeroCombatSkill.hudIcon` 字串一致；每個技能各用一個，不可重複。 */
export type HeroSkillHudIconId =
  | 'mails'
  | 'filter'
  | 'grid'
  | 'footprints'
  | 'arrow-down'
  /** @deprecated 舊資料相容；新技能請勿使用 */
  | 'activity';

const ICON_BY_ID: Record<HeroSkillHudIconId, LucideIcon> = {
  mails: Mails,
  filter: Filter,
  grid: LayoutGrid,
  footprints: Footprints,
  'arrow-down': ArrowDown,
  activity: Activity,
};

export function heroSkillHudLucideIcon(id?: string): LucideIcon {
  if (id && id in ICON_BY_ID) {
    return ICON_BY_ID[id as HeroSkillHudIconId];
  }
  return Sparkles;
}
