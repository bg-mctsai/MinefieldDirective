import { getHeroCombatSkills, getHeroDef } from '../heroes';

export type HeroSkillBriefPanel = { title: string; paragraphs: string[] };

/** 對局內「點頭像」彈層：被動說明；無戰鬥被動時用 skillDetail 或通用句補位 */
export function getHeroSkillBriefPanels(heroId: string, buckEmergencyAvailable: boolean): HeroSkillBriefPanel[] {
  const hero = getHeroDef(heroId);

  if (heroId === 'laozhang') {
    const detail = (hero.skillDetail ?? '').trim();
    const statusLine = buckEmergencyAvailable ? '本關狀態：抵銷尚未使用（仍可用 1 次）。' : '本關狀態：抵銷已耗盡。';
    return [
      {
        title: '加固模組',
        paragraphs: [detail || '錯誤發生時可抵銷一次爆炸並移除出錯的雷。每關限一次。', statusLine],
      },
    ];
  }

  const skills = getHeroCombatSkills(hero);
  if (skills.length > 0) {
    return skills.map((s) => ({
      title: s.name,
      paragraphs: [s.detail.trim() || '（無額外說明）'],
    }));
  }

  const flavor = hero.skillDetail?.trim();
  if (flavor) {
    return [{ title: `${hero.name} · 作戰備註`, paragraphs: [flavor] }];
  }
  return [{ title: `${hero.name}`, paragraphs: ['本作戰無被動技能加成。'] }];
}
