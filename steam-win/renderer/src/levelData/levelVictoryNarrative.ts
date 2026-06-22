import narrativesJson from './levelVictoryNarratives.json';

export type LevelVictoryNarrativeLine = {
  speaker: string;
  text: string;
};

export type LevelVictoryNarrativeBlock = {
  title: string;
  lines: LevelVictoryNarrativeLine[];
};

type NarrativesFile = {
  byLevelId: Record<string, LevelVictoryNarrativeBlock>;
};

const BY_LEVEL = (narrativesJson as NarrativesFile).byLevelId;

export function getLevelVictoryNarrative(levelId: number): LevelVictoryNarrativeBlock | null {
  if (!Number.isFinite(levelId)) return null;
  const block = BY_LEVEL[String(levelId)];
  if (!block?.lines?.length) return null;
  return {
    title: block.title?.trim() || '戰地通訊',
    lines: block.lines.filter((l) => l?.text?.trim()),
  };
}
