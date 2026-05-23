import dialoguesJson from './heroUnlockDialogues.json';

export type HeroUnlockDialogueSide = 'hero' | 'player';

export type HeroUnlockDialogueLine = {
  side: HeroUnlockDialogueSide;
  text: string;
};

export type HeroUnlockDialogueBlock = {
  lines: HeroUnlockDialogueLine[];
};

type Table = { byHeroId: Record<string, HeroUnlockDialogueBlock> };

const table = dialoguesJson as Table;

/** 玩家視角固定為新兵小明 */
export const HERO_UNLOCK_PLAYER_HERO_ID = 'xiaoming' as const;

export function getHeroUnlockDialogue(heroId: string): HeroUnlockDialogueBlock | null {
  const block = table.byHeroId[heroId];
  if (!block?.lines?.length) return null;
  const lines = block.lines.filter(
    (l): l is HeroUnlockDialogueLine =>
      (l.side === 'hero' || l.side === 'player') && typeof l.text === 'string' && l.text.trim().length > 0,
  );
  if (lines.length === 0) return null;
  return { lines };
}

/** 僅保留有台詞稿的幹員，維持解鎖順序 */
export function filterHeroIdsWithUnlockDialogue(heroIds: string[]): string[] {
  return heroIds.filter((id) => getHeroUnlockDialogue(id) != null);
}
