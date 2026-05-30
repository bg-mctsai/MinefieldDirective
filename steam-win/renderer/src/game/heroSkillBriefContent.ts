import { BOBBY_DOWNSHIFT_CHARGES_PER_LEVEL } from './bobbyDownshift';
import { LAOZHANG_COPY_USES_PER_COPY } from './laozhangCopyCommand';
import { getHeroCombatSkills, getHeroDef } from '../heroes';

export type HeroSkillBriefPanel = { title: string; paragraphs: string[] };

/** 對局內「點頭像」彈層：被動說明；無戰鬥被動時用 skillDetail 或通用句補位 */
export function getHeroSkillBriefPanels(
  heroId: string,
  fortifyRemaining: number,
  bobbyDownshiftRemaining = 0,
  laozhangCopiedValue: number | null = null,
  laozhangCopiedUsesRemaining = 0,
): HeroSkillBriefPanel[] {
  const hero = getHeroDef(heroId);

  if (heroId === 'tungsten') {
    const detail = (hero.skillDetail ?? '').trim();
    const statusLine =
      fortifyRemaining > 0
        ? `本關狀態：加固剩 ${fortifyRemaining} 次（錯格不爆，該格計入火力）。`
        : '本關狀態：加固已耗盡。';
    return [
      {
        title: '加固模組',
        paragraphs: [detail || '錯格不爆，該格改算火力。每關 2 次。', statusLine],
      },
    ];
  }

  if (heroId === 'laozhang') {
    const detail = (hero.skillDetail ?? '').trim();
    const statusLine =
      laozhangCopiedUsesRemaining > 0 && laozhangCopiedValue !== null
        ? `本關狀態：壓箱槽「${laozhangCopiedValue}」剩 ${laozhangCopiedUsesRemaining} 次（共 ${LAOZHANG_COPY_USES_PER_COPY} 次）。`
        : '本關狀態：壓箱槽空。先選電碼，再點壓箱槽。';
    return [
      {
        title: '壓箱電碼',
        paragraphs: [detail || '壓箱後選中壓箱槽，可連續點格使用（最多 3 次），可隨時再壓新電碼。', statusLine],
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
