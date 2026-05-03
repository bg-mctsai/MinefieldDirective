import missionTacticalSatelliteBase from './assets/mission-tactical-satellite-base.png';

/**
 * 關卡專屬底圖：`assets/mission-tactical-level-{兩位數 levelId}.png`（例 01、80）。
 * 建置時 glob 收錄；有則優先於章節底圖。
 */
const levelTerrainModules = import.meta.glob<string>('./assets/mission-tactical-level-*.png', {
  eager: true,
  import: 'default',
});

/**
 * 章節共用底圖：`assets/mission-tactical-chapter-maps/mission-tactical-chapter-{NN}.png`；
 * 第 1 章可為 `mission-tactical-chapter-01-bootcamp.png`。未收錄的章節回退衛星圖。
 */
const chapterTerrainModules = import.meta.glob<string>(
  './assets/mission-tactical-chapter-maps/mission-tactical-chapter-*.png',
  { eager: true, import: 'default' },
);

const levelTerrainUrlById = (() => {
  const m = new Map<number, string>();
  for (const path of Object.keys(levelTerrainModules)) {
    const match = /[/\\]mission-tactical-level-(\d+)\.png$/i.exec(path);
    if (!match) continue;
    const id = parseInt(match[1], 10);
    if (!Number.isFinite(id) || id < 1) continue;
    const url = levelTerrainModules[path];
    if (typeof url === 'string') m.set(id, url);
  }
  return m;
})();

const chapterTerrainUrlByChapter = (() => {
  const m = new Map<number, string>();
  const sortedPaths = Object.keys(chapterTerrainModules).sort();
  for (const path of sortedPaths) {
    const norm = path.replace(/\\/g, '/');
    const match = /mission-tactical-chapter-(\d+)(?:-[\w-]+)?\.png$/i.exec(norm);
    if (!match) continue;
    const ch = parseInt(match[1], 10);
    if (!Number.isFinite(ch) || ch < 1) continue;
    const url = chapterTerrainModules[path];
    if (typeof url === 'string') m.set(ch, url);
  }
  return m;
})();

function missionTerrainChapterFallback(chapter: number): string {
  if (!Number.isFinite(chapter) || chapter < 1) return missionTacticalSatelliteBase;
  const ch = Math.floor(chapter);
  return chapterTerrainUrlByChapter.get(ch) ?? missionTacticalSatelliteBase;
}

/** 僅章節、無關卡 id 時使用（例如預覽）。 */
export function missionTerrainSrcForChapter(chapter: number): string {
  return missionTerrainChapterFallback(chapter);
}

export function missionTerrainSrcForLevel(levelId: number, chapter: number): string {
  const id = Number.isFinite(levelId) && levelId >= 1 ? Math.floor(levelId) : 1;
  return levelTerrainUrlById.get(id) ?? missionTerrainChapterFallback(chapter);
}
