import type { Level } from '../gameLogic';
import type { GridSystem, MapLayout } from '../levelData/types';

const CHAPTER_NAMES = [
  '',
  '新兵訓練',
  '巷戰封鎖線',
  '乾谷據點',
  '蜂巢戰線',
  '斷線封鎖',
  '深海要塞',
  '信號干擾區',
  '引爆危機',
  '鄰焰共振',
  '終焉防線',
] as const;

/** 作戰地圖章節頁籤副標（依企劃 `chapter` 欄位） */
export function chapterCampaignTagline(chapter: number): string {
  return CHAPTER_NAMES[chapter] ?? '';
}

function neighborLogicLine(grid: GridSystem): string {
  switch (grid) {
    case 'HEXAGON':
      return '蜂巢戰區：數字＝六邊形邊相接之鄰格內地雷數（邊界或空格區旁有效鄰格少於 6）。';
    case 'MIXED':
      return '複合戰區由多區併成；每格數字仍表示其周圍有效鄰格內的地雷總數（依目前 solver 為 8 鄰接）。';
    default:
      return '每個數字格周圍 8 格（含對角）內，地雷總數必須恰好等於該數字。';
  }
}

function forbiddenCount(layout: MapLayout): number | null {
  if (layout.type === 'SQUARE' && layout.forbiddenCells?.length) return layout.forbiddenCells.length;
  if (layout.type === 'HEXAGON' && layout.forbiddenCells?.length) return layout.forbiddenCells.length;
  return null;
}

export type LevelStrategyGuideModel = {
  briefingSummaryLines: string[];
  eventsLines: string[];
  logicNeighborLine: string;
};

export function buildLevelStrategyGuideModel(
  level: Level,
  opts?: { heroId?: string },
): LevelStrategyGuideModel {
  const d = level.definition;
  const forbidden = forbiddenCount(d.mapLayout);
  const hints = level.initialHints.length;
  const briefingSummaryLines: string[] = [];

  if (d.commandSlotReceiveJamming) {
    if (opts?.heroId === 'ada') {
      briefingSummaryLines.push(
        '電報會輪播；艾達上場時輪播較慢（換字間隔為平常兩倍），先鎖定讀值再下。',
      );
    } else {
      briefingSummaryLines.push('電報會輪播，先鎖定數字再下。');
    }
  }
  if ((d.blastPoints?.length ?? 0) > 0) {
    briefingSummaryLines.push('炸點會倒數，歸零前沒處理完就輸。');
  }
  if ((d.digitOutposts?.length ?? 0) > 0) {
    briefingSummaryLines.push('據點格一定要填數字，不能放著不管。');
  }
  if (d.dynamicMinePerMove) {
    briefingSummaryLines.push('每次成功佈署後，場上會多一顆廢雷。');
  }
  if (d.neighborPlacedDigitBonus) {
    briefingSummaryLines.push('落點數字會吃鄰格加成，不一定等於電報底數。');
  }
  if (forbidden !== null) {
    briefingSummaryLines.push('場上有禁區，算路時別把那些格算進去。');
  }
  if (briefingSummaryLines.length === 0) {
    briefingSummaryLines.push('本關沒有額外機制，先把基本節奏做對。');
    if (hints > 0) briefingSummaryLines.push('開局提示格就是你的第一批線索。');
  }

  return {
    briefingSummaryLines,
    eventsLines: ['無'],
    logicNeighborLine:
      (d.mapLayout.type === 'HEXAGON' || d.mapLayout.type === 'SQUARE') && (forbidden ?? 0) > 0
        ? `${neighborLogicLine(d.gridSystem)} 本關含種子隨機空格區域（不可佈署）。`
        : neighborLogicLine(d.gridSystem),
  };
}
