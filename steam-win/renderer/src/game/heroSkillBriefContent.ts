import { BOBBY_DOWNSHIFT_CHARGES_PER_LEVEL } from './bobbyDownshift';
import { getHeroCombatSkills, getHeroDef } from '../heroes';

export type HeroSkillBriefPanel = { title: string; paragraphs: string[] };

/** 對局內「點頭像」彈層：被動說明；無戰鬥被動時用 skillDetail 或通用句補位 */
export function getHeroSkillBriefPanels(
  heroId: string,
  laozhangFortifyRemaining: number,
  bobbyDownshiftRemaining = 0,
): HeroSkillBriefPanel[] {
  const hero = getHeroDef(heroId);

  if (heroId === 'laozhang') {
    const detail = (hero.skillDetail ?? '').trim();
    const statusLine =
      laozhangFortifyRemaining > 0
        ? `本關狀態：加固剩 ${laozhangFortifyRemaining} 次（錯格不爆，該格計入火力）。`
        : '本關狀態：加固已耗盡。';
    return [
      {
        title: '加固模組',
        paragraphs: [detail || '錯誤發生時可抵銷一次爆炸並移除出錯的雷。每關限一次。', statusLine],
      },
    ];
  }

  const skills = getHeroCombatSkills(hero);
  if (skills.length > 0) {
    return skills.map((s) => {
      const detail = s.detail.trim() || '（無額外說明）';
      if (heroId === 'bobby' && s.name === '緊急降碼') {
        const statusLine =
          bobbyDownshiftRemaining > 0
            ? `本關狀態：緊急降碼剩 ${bobbyDownshiftRemaining} 次（共 ${BOBBY_DOWNSHIFT_CHARGES_PER_LEVEL} 次）。`
            : '本關狀態：緊急降碼已用盡。';
        return { title: s.name, paragraphs: [detail, statusLine] };
      }
      return { title: s.name, paragraphs: [detail] };
    });
  }

  const flavor = hero.skillDetail?.trim();
  if (flavor) {
    return [{ title: `${hero.name} · 作戰備註`, paragraphs: [flavor] }];
  }
  return [{ title: `${hero.name}`, paragraphs: ['本作戰無被動技能加成。'] }];
}
