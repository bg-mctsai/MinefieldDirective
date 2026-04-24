import dossierJson from './dossierPostChapter10Briefings.json';

export type DossierPostChapter10Block = {
  title: string;
  encouragement: string[];
  nextHazard: string[];
  /** 藍筆批註，可與正規內文並陳，集中於 `dossierPostChapter10Briefings.json` */
  penSketches: string[];
};

type DossierFile = {
  byCompletedChapter: Record<
    string,
    { title: string; encouragement: string[]; nextHazard: string[]; penSketches?: string[] }
  >;
};

const BY_CH = (dossierJson as DossierFile).byCompletedChapter;

const DEFAULT_BLOCK: DossierPostChapter10Block = {
  title: '指揮官筆記',
  encouragement: [
    '章內戰事告一段落。把疲勞留在場外，把紀律帶回卷宗。',
    '下一階段只會更硬。你要相信流程，少賭衝鋒。',
  ],
  nextHazard: [
    '下一戰的雷情與地形都會變，別沿用上一線的壞習慣。',
    '先讀圖、再鋪線。速度永遠排在可驗算之後。',
  ],
  penSketches: [],
};

/** 以「剛通關的章」為鍵，取得回到行動卷宗前的指揮官台詞。 */
export function getDossierPostChapter10Content(completedChapter: number): DossierPostChapter10Block {
  if (!Number.isFinite(completedChapter) || completedChapter < 1) return DEFAULT_BLOCK;
  const key = String(Math.min(10, Math.max(1, Math.floor(completedChapter))));
  const block = BY_CH[key];
  if (block) {
    return {
      title: typeof block.title === 'string' && block.title.trim() !== '' ? block.title : DEFAULT_BLOCK.title,
      encouragement: Array.isArray(block.encouragement) && block.encouragement.length > 0 ? block.encouragement : DEFAULT_BLOCK.encouragement,
      nextHazard: Array.isArray(block.nextHazard) && block.nextHazard.length > 0 ? block.nextHazard : DEFAULT_BLOCK.nextHazard,
      penSketches: Array.isArray(block.penSketches) ? block.penSketches : DEFAULT_BLOCK.penSketches,
    };
  }
  return DEFAULT_BLOCK;
}
