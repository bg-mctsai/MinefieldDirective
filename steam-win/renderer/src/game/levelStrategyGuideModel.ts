import type { Level } from '../gameLogic';
import type { GridSystem, LevelEvent, MapLayout } from '../levelData/types';

const CHAPTER_NAMES = [
  '',
  '新兵訓練營',
  '巷戰封鎖線',
  '荒漠記憶',
  '三角高地',
  '蜂巢幽閉',
  '異次元裂縫',
  '終焉防線',
] as const;

function chapterDisplayName(chapter: number, levelId: number): string {
  if (levelId >= 31 && levelId <= 40) return '三角高地';
  if (levelId >= 41 && levelId <= 50) return '蜂巢防線';
  return CHAPTER_NAMES[chapter] ?? `第 ${chapter} 章`;
}

function mapLayoutLabel(layout: MapLayout): string {
  switch (layout.type) {
    case 'SQUARE':
      return `矩形格網　寬${layout.width}×高${layout.height}`;
    case 'CROSS':
      return `十字戰區　寬${layout.width}×高${layout.height}`;
    case 'DIAMOND':
      return `菱形戰區（半徑 ${layout.radius}）`;
    case 'TRIANGLE': {
      const n = layout.forbiddenCells?.length ?? 0;
      const terrain = n > 0 ? `；${n} 格隨機碎裂地形（禁佈）` : '';
      return `三角鑲嵌格網　寬${layout.placeholder.width}×高${layout.placeholder.height}${terrain}`;
    }
    case 'HEXAGON': {
      const n = layout.forbiddenCells?.length ?? 0;
      const voids = n > 0 ? `；${n} 格空格／禁佈區` : '';
      return `六角網格占位　寬${layout.placeholder.width}×高${layout.placeholder.height}${voids}`;
    }
    case 'MIXED':
      return `複合戰區（${layout.sectors.length} 個區塊）`;
    default:
      return '自訂戰區';
  }
}

function neighborLogicLine(grid: GridSystem): string {
  switch (grid) {
    case 'HEXAGON':
      return '蜂巢戰區：數字＝六邊形邊相接之鄰格內地雷數（邊界或空格區旁有效鄰格少於 6）。';
    case 'TRIANGLE':
      return '三角鑲嵌：數字＝共用邊的鄰格內地雷數；內格最多 3 鄰、邊界 1～2 鄰，故線索與電報數字皆不超過 3。';
    case 'MIXED':
      return '複合戰區由多區併成；每格數字仍表示其周圍有效鄰格內的地雷總數（依目前 solver 為 8 鄰接）。';
    default:
      return '每個數字格周圍 8 格（含對角）內，地雷總數必須恰好等於該數字。';
  }
}

function forbiddenCount(layout: MapLayout): number | null {
  if (layout.type === 'SQUARE' && layout.forbiddenCells?.length) return layout.forbiddenCells.length;
  if (layout.type === 'TRIANGLE' && layout.forbiddenCells?.length) return layout.forbiddenCells.length;
  if (layout.type === 'HEXAGON' && layout.forbiddenCells?.length) return layout.forbiddenCells.length;
  return null;
}

function weightedDigits(weights: Record<string, number>): number[] {
  return Object.entries(weights)
    .filter(([, w]) => w > 0)
    .map(([k]) => Number(k))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
}

function formatEvent(e: LevelEvent, timeLimit: number): string {
  const trig =
    e.trigger === 'PROGRESS'
      ? `覆蓋率達 ${Math.round(e.threshold * 100)}% 時`
      : `剩餘時間 ≤ ${e.threshold} 秒時（本關${timeLimit > 0 ? `限時 ${timeLimit} 秒` : '未啟用倒數'}）`;

  if (e.type === 'REINFORCE') {
    return `${trig}：增援 — 隨機鎖定 ${e.count} 格。`;
  }
  const name =
    e.type === 'SANDSTORM' ? '沙塵暴' : e.type === 'JAMMING' ? '通訊干擾' : 'EMP 脈衝';
  return `${trig}：${name}，持續 ${e.duration} 秒。`;
}

export type LevelStrategyGuideModel = {
  chapterLine: string;
  mapLine: string;
  deployableCells: number;
  boundaryLine: string;
  coveragePercent: number;
  timeLine: string;
  handLine: string;
  poolLine: string;
  digitsLine: string;
  hintsLine: string;
  forbiddenLine: string | null;
  /** 有設定 mapCloudOverlay 時（例：第 21～30 關荒漠雲層） */
  cloudLine: string | null;
  eventsLines: string[];
  logicNeighborLine: string;
};

export function buildLevelStrategyGuideModel(level: Level): LevelStrategyGuideModel {
  const d = level.definition;
  const chName = chapterDisplayName(d.chapter, d.levelId);
  const digits = weightedDigits(d.commands.weights);
  const digitsLine =
    digits.length > 0 ? `電報可能出現的數字：${digits.join('、')}。` : '電碼池未設定有效數字（請檢查企劃資料）。';

  const poolLine =
    d.commands.poolType === 'WEIGHTED'
      ? '長官電報採「加權隨機」：權重越高的數字越常出現在待辦電碼。'
      : '長官電報採「均等隨機」：在設定的數字中平均抽選。';

  const forbidden = forbiddenCount(d.mapLayout);
  const hints = level.initialHints.length;

  return {
    chapterLine: `章節：${chName}（關卡 ${d.levelId}）`,
    mapLine: `地圖形狀：${mapLayoutLabel(d.mapLayout)}`,
    deployableCells: level.cells.length,
    boundaryLine: `盤面邊界框：寬${level.width}×高${level.height}（可部署格數 ${level.cells.length}）`,
    coveragePercent: Math.round(d.coverageGoal * 1000) / 10,
    timeLine: d.timeLimit > 0 ? `任務時限：${d.timeLimit} 秒。` : '任務時限：無（不計時）。',
    handLine: `待辦電碼上限：同時最多 ${d.commands.maxHand} 道（選定後再標格執行）。`,
    poolLine,
    digitsLine,
    hintsLine:
      hints > 0
        ? `開局已有 ${hints} 個提示數字格（不可移動，需滿足其約束）。`
        : '開局無預置提示數字；全依長官電報與你方佈雷推進。',
    forbiddenLine:
      forbidden !== null ? `場上有 ${forbidden} 格障礙／禁區，無法部署。` : null,
    cloudLine: d.mapCloudOverlay
      ? '戰場有飄動沙塵迷霧（CSS 漸層＋模糊動畫）沿全圖巡迴，中心並以 backdrop 模糊棋格（僅畫面，不擋點格、不影響邏輯）。'
      : null,
    eventsLines: d.events.length ? d.events.map((ev) => formatEvent(ev, d.timeLimit)) : ['本關無動態戰場事件。'],
    logicNeighborLine:
      d.chapter === 4 && d.levelId >= 33 && d.mapLayout.type === 'TRIANGLE' && (d.mapLayout.forbiddenCells?.length ?? 0) > 0
        ? `${neighborLogicLine(d.gridSystem)} 本關起含種子隨機地形格（不可佈署），邊界形狀會影響可走的三角拓撲。`
        : d.mapLayout.type === 'HEXAGON' && (d.mapLayout.forbiddenCells?.length ?? 0) > 0
          ? `${neighborLogicLine(d.gridSystem)} 本關含種子隨機空格區域（不可佈署）。`
          : neighborLogicLine(d.gridSystem),
  };
}
