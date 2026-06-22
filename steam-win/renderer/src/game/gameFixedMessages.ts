import gameFixedMessagesJson from './gameFixedMessages.json';

export const GAME_FIXED = gameFixedMessagesJson;

export type HeroCombatLineCategory =
  | 'gameStatus'
  | 'afterPlace'
  | 'victoryStatus'
  | 'commanderRowHint'
  | 'lossOperative';

type HeroLineBlock = Record<HeroCombatLineCategory, Record<string, string | string[]>>;

type ChapterLineOverrides = Record<string, Record<string, string | string[]>>;

const DEFAULT_HERO_ID = 'xiaoming';

function resolveHeroBlock(heroId: string): HeroLineBlock {
  const byHero = GAME_FIXED.byHero as Record<string, HeroLineBlock>;
  if (byHero[heroId]) return byHero[heroId];
  return byHero[DEFAULT_HERO_ID] ?? byHero[Object.keys(byHero)[0]!]!;
}

function pickTemplate(raw: string | string[] | undefined, fallback: string): string {
  if (raw == null) return fallback;
  if (Array.isArray(raw)) {
    if (raw.length === 0) return fallback;
    return raw[Math.floor(Math.random() * raw.length)]!;
  }
  return raw;
}

/** 將 `{key}` 替換為 vars[key]（用於集中文案的插值） */
export function sub(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = vars[key];
    return v != null ? String(v) : `{${key}}`;
  });
}

function chapterCategoryOverride(
  table: Record<string, ChapterLineOverrides> | undefined,
  chapter: number | undefined,
  heroId: string,
  key: string,
): string | string[] | undefined {
  if (chapter == null || !Number.isFinite(chapter) || !table) return undefined;
  const chBlock = table[String(Math.floor(chapter))];
  return chBlock?.[heroId]?.[key] ?? chBlock?.[DEFAULT_HERO_ID]?.[key];
}

function chapterGameStatusOverride(
  chapter: number | undefined,
  heroId: string,
  key: string,
): string | string[] | undefined {
  const byChapter = (GAME_FIXED as { byChapterGameStatus?: Record<string, ChapterLineOverrides> })
    .byChapterGameStatus;
  return chapterCategoryOverride(byChapter, chapter, heroId, key);
}

function chapterAfterPlaceOverride(
  chapter: number | undefined,
  heroId: string,
  key: string,
): string | string[] | undefined {
  const byChapter = (GAME_FIXED as { byChapterAfterPlace?: Record<string, ChapterLineOverrides> })
    .byChapterAfterPlace;
  return chapterCategoryOverride(byChapter, chapter, heroId, key);
}

/** 依出戰幹員取戰鬥過程台詞（含開始／結束／提示列） */
export function pickHeroCombatLine(
  heroId: string,
  category: HeroCombatLineCategory,
  key: string,
  vars?: Record<string, string | number>,
  chapter?: number,
): string {
  if (category === 'gameStatus') {
    const chOverride = chapterGameStatusOverride(chapter, heroId, key);
    if (chOverride != null) {
      const template = pickTemplate(chOverride, '');
      return vars ? sub(template, vars) : template;
    }
  }
  if (category === 'afterPlace') {
    const chOverride = chapterAfterPlaceOverride(chapter, heroId, key);
    if (chOverride != null) {
      const template = pickTemplate(chOverride, '');
      return vars ? sub(template, vars) : template;
    }
  }
  const primary = resolveHeroBlock(heroId)[category]?.[key];
  const fallback = resolveHeroBlock(DEFAULT_HERO_ID)[category]?.[key];
  const template = pickTemplate(primary, pickTemplate(fallback, ''));
  return vars ? sub(template, vars) : template;
}
