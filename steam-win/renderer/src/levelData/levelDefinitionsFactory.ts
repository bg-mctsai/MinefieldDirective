import type { CommandConfig, LevelDefinition, LevelEvent, LevelRewards, MapLayout } from './types';

const CHAPTER_NAMES = [
  '',
  '新兵訓練營',
  '城市巷戰',
  '沙漠閃擊',
  '三角形陣地',
  '蜂巢幽閉',
  '異次元裂縫',
  '終焉防線',
] as const;

function chapterOf(levelId: number): number {
  if (levelId <= 10) return 1;
  if (levelId <= 20) return 2;
  if (levelId <= 35) return 3;
  if (levelId <= 50) return 4;
  if (levelId <= 70) return 5;
  if (levelId <= 90) return 6;
  return 7;
}

function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededForbiddenCells(seed: string, width: number, height: number, count: number): [number, number][] {
  const roll = mulberry32(hashSeed(seed));
  const cells: [number, number][] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      cells.push([x, y]);
    }
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(roll() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells.slice(0, Math.min(count, cells.length));
}

function weightsCh1(): CommandConfig['weights'] {
  return { '3': 30, '4': 30, '5': 22, '6': 18 };
}

function weightsCh2(): CommandConfig['weights'] {
  return { '2': 12, '3': 22, '4': 22, '5': 18, '6': 16, '7': 10 };
}

function weightsCh3(): CommandConfig['weights'] {
  return { '1': 8, '2': 14, '3': 22, '4': 22, '5': 14, '6': 10, '7': 7, '8': 3 };
}

function weightsCh4(): CommandConfig['weights'] {
  return { '1': 10, '2': 15, '3': 18, '4': 18, '5': 15, '6': 12, '7': 8, '8': 4 };
}

function weightsCh5(): CommandConfig['weights'] {
  // 企劃：六角鄰居上限 6；核心尚未支援 0，1–6 加權偏高
  return { '1': 18, '2': 22, '3': 20, '4': 18, '5': 12, '6': 8, '7': 1, '8': 1 };
}

function weightsCh6(): CommandConfig['weights'] {
  return { '1': 12, '2': 14, '3': 18, '4': 18, '5': 14, '6': 12, '7': 8, '8': 4 };
}

function weightsCh7(): CommandConfig['weights'] {
  return { '1': 28, '2': 8, '3': 10, '4': 10, '5': 8, '6': 8, '7': 10, '8': 18 };
}

function defaultCommands(ch: number, levelId: number): CommandConfig {
  const poolType = 'WEIGHTED' as const;
  const maxHand = ch >= 5 ? 5 : 4;
  let weights: CommandConfig['weights'];
  if (ch === 1) weights = weightsCh1();
  else if (ch === 2) weights = weightsCh2();
  else if (ch === 3) weights = weightsCh3();
  else if (ch === 4) weights = weightsCh4();
  else if (ch === 5) weights = weightsCh5();
  else if (ch === 6) weights = weightsCh6();
  else weights = weightsCh7();

  if (levelId === 100) {
    weights = { ...weightsCh7(), '1': 35, '8': 35 };
  }

  return { maxHand, poolType, weights };
}

function defaultEvents(ch: number, timeLimit: number): LevelEvent[] {
  if (ch <= 2) return [];
  if (ch === 3) {
    const t = Math.max(timeLimit, 60);
    return [
      { trigger: 'TIME_LEFT', threshold: Math.floor(t * 0.5), type: 'JAMMING', duration: 12 },
      { trigger: 'PROGRESS', threshold: 0.55, type: 'REINFORCE', count: 2 },
    ];
  }
  if (ch === 4) {
    return [{ trigger: 'PROGRESS', threshold: 0.5, type: 'SANDSTORM', duration: 8 }];
  }
  if (ch === 5) {
    return [
      { trigger: 'PROGRESS', threshold: 0.38, type: 'JAMMING', duration: 18 },
      { trigger: 'TIME_LEFT', threshold: 40, type: 'JAMMING', duration: 12 },
    ];
  }
  if (ch === 6) {
    return [
      { trigger: 'TIME_LEFT', threshold: 48, type: 'EMP', duration: 8 },
      { trigger: 'PROGRESS', threshold: 0.32, type: 'SANDSTORM', duration: 10 },
      { trigger: 'PROGRESS', threshold: 0.62, type: 'REINFORCE', count: 2 },
    ];
  }
  return [
    { trigger: 'TIME_LEFT', threshold: 55, type: 'JAMMING', duration: 14 },
    { trigger: 'PROGRESS', threshold: 0.22, type: 'SANDSTORM', duration: 12 },
    { trigger: 'PROGRESS', threshold: 0.58, type: 'EMP', duration: 7 },
  ];
}

function defaultRewards(ch: number, levelId: number): LevelRewards {
  const todo: string[] = [];
  if (ch === 3 && levelId === 21) {
    return {
      unlockCharacterIds: ['engineer'],
      todo: ['TODO: 實作工程師角色技能與 UI 解鎖'],
    };
  }
  if (ch === 4 && levelId === 36) {
    return {
      unlockCharacterIds: ['veteran'],
      todo: ['TODO: 實作老兵角色與三角格邏輯'],
    };
  }
  if (ch === 6 && levelId === 71) {
    return {
      unlockCharacterIds: ['intel_officer'],
      todo: ['TODO: 實作情報官、偽裝指令、混合格鄰接'],
    };
  }
  if (ch === 4) todo.push('TODO: 三角鑲嵌格與鄰居模型');
  if (ch === 5) todo.push('TODO: 六角格鄰居與畫面呈現');
  if (ch === 6) todo.push('TODO: 混合地形接縫鄰接表（見 logic_mixed_grid.md）');
  if (ch === 7) todo.push('TODO: 超大型異形輪廓地圖美術與格點');
  if (levelId === 100) {
    return { narrativeFlag: 'CAMPAIGN_COMPLETE', todo: ['TODO: 結局演出與結算'] };
  }
  return todo.length ? { todo } : {};
}

function titleFor(levelId: number, chapter: number): string {
  if (levelId === 100) return '神之眼';
  if (levelId === 71) return '異次元邊界';
  return `${CHAPTER_NAMES[chapter]} · 第 ${levelId} 戰`;
}

function coverageFor(ch: number, levelId: number): number {
  if (levelId === 100) return 1;
  if (ch <= 2) return 0.7;
  if (ch <= 4) return 0.75;
  if (ch <= 5) return 0.8;
  if (ch <= 6) return 0.85;
  return 0.9;
}

function timeLimitFor(ch: number, levelId: number): number {
  if (ch <= 2 || levelId === 100) return 0;
  if (ch === 3) return 60 + ((levelId - 21) % 6) * 12;
  if (ch === 4) return 72 + ((levelId - 36) % 5) * 10;
  if (ch === 5) return 90 + ((levelId - 51) % 5) * 8;
  if (ch === 6) return 100 + ((levelId - 71) % 5) * 6;
  return 110 + ((levelId - 91) % 4) * 12;
}

function mapLayoutFor(levelId: number, chapter: number, seed: string): MapLayout {
  if (chapter === 1) {
    const size = [5, 6, 8][(levelId - 1) % 3] as number;
    return { type: 'SQUARE', width: size, height: size };
  }
  if (chapter === 2) {
    return (levelId - 11) % 2 === 0
      ? { type: 'CROSS', width: 11, height: 11 }
      : { type: 'DIAMOND', radius: 4 };
  }
  if (chapter === 3) {
    const nForbidden = 3 + (levelId % 5);
    return {
      type: 'SQUARE',
      width: 10,
      height: 10,
      forbiddenCells: seededForbiddenCells(seed, 10, 10, nForbidden),
    };
  }
  if (chapter === 4) {
    const w = 10 + (levelId % 2);
    return {
      type: 'TRIANGLE',
      placeholder: { width: w, height: w },
    };
  }
  if (chapter === 5) {
    const w = 10 + ((levelId - 51) % 3);
    return {
      type: 'HEXAGON',
      placeholder: { width: w, height: w },
    };
  }
  if (chapter === 6) {
    const variant = (levelId - 71) % 4;
    if (variant === 0) {
      return {
        type: 'MIXED',
        sectors: [
          { id: 'sec_1', shape: 'SQUARE', offset: { x: 0, y: 0 }, size: [5, 10] },
          { id: 'sec_2', shape: 'HEXAGON', offset: { x: 5, y: 0 }, size: [5, 10] },
        ],
      };
    }
    if (variant === 1) {
      return {
        type: 'MIXED',
        sectors: [
          { id: 'sec_a', shape: 'SQUARE', offset: { x: 0, y: 0 }, size: [6, 6] },
          { id: 'sec_b', shape: 'TRIANGLE', offset: { x: 6, y: 0 }, size: [6, 6] },
          { id: 'sec_c', shape: 'SQUARE', offset: { x: 0, y: 6 }, size: [12, 5] },
        ],
      };
    }
    if (variant === 2) {
      return {
        type: 'MIXED',
        sectors: [
          { id: 'hex_block', shape: 'HEXAGON', offset: { x: 0, y: 0 }, size: [7, 8] },
          { id: 'sq_bridge', shape: 'SQUARE', offset: { x: 7, y: 3 }, size: [5, 5] },
        ],
      };
    }
    return {
      type: 'MIXED',
      sectors: [
        { id: 'left', shape: 'SQUARE', offset: { x: 0, y: 0 }, size: [4, 10] },
        { id: 'mid', shape: 'HEXAGON', offset: { x: 4, y: 0 }, size: [4, 10] },
        { id: 'right', shape: 'TRIANGLE', offset: { x: 8, y: 0 }, size: [4, 10] },
      ],
    };
  }
  // chapter 7
  if (levelId === 100) {
    return { type: 'SQUARE', width: 12, height: 12 };
  }
  const fw = 12;
  const fh = 12;
  const nBlock = 8 + (levelId % 12);
  return {
    type: 'SQUARE',
    width: fw,
    height: fh,
    forbiddenCells: seededForbiddenCells(`${seed}-fin`, fw, fh, nBlock),
  };
}

function gridSystemFor(chapter: number): LevelDefinition['gridSystem'] {
  if (chapter <= 2) return 'SQUARE';
  if (chapter === 4) return 'TRIANGLE';
  if (chapter === 5) return 'HEXAGON';
  if (chapter === 6) return 'MIXED';
  return 'SQUARE';
}

export function createLevelDefinition(levelId: number): LevelDefinition {
  const chapter = chapterOf(levelId);
  const initialSeed = `minefield-campaign-v1-L${levelId}-ch${chapter}`;
  const coverageGoal = coverageFor(chapter, levelId);
  const timeLimit = timeLimitFor(chapter, levelId);
  const mapLayout = mapLayoutFor(levelId, chapter, initialSeed);

  return {
    levelId,
    chapter,
    title: titleFor(levelId, chapter),
    gridSystem: gridSystemFor(chapter),
    coverageGoal,
    timeLimit,
    initialSeed,
    mapLayout,
    commands: defaultCommands(chapter, levelId),
    events: defaultEvents(chapter, timeLimit),
    rewards: defaultRewards(chapter, levelId),
  };
}

/** 執行時關卡資料讀取 `levels.json`；若只改此檔邏輯，請執行 `npm run export-levels-json` 重新產生 JSON。 */
