import type {
  LevelDefinition,
  MapLayout,
  SquareMapLayout,
} from './types';

export type PlayableLevel = {
  id: number;
  name: string;
  width: number;
  height: number;
  cells: { x: number; y: number }[];
  definition: LevelDefinition;
  initialHints: { x: number; y: number; value: number }[];
};

function cellsKey(x: number, y: number) {
  return `${x},${y}`;
}

function dedupeCells(cells: { x: number; y: number }[]) {
  const seen = new Set<string>();
  const out: { x: number; y: number }[] = [];
  for (const c of cells) {
    const k = cellsKey(c.x, c.y);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return out;
}

function boundsFromCells(cells: { x: number; y: number }[]) {
  let maxX = 0;
  let maxY = 0;
  for (const c of cells) {
    maxX = Math.max(maxX, c.x + 1);
    maxY = Math.max(maxY, c.y + 1);
  }
  return { width: maxX, height: maxY };
}

/** 盤面邊界框：與企劃 JSON 一致（SQUARE／CROSS／占位幾何以 mapLayout 為準，勿僅依 cells 外包框推算以免與地圖定義脫鉤） */
function boardBoundsFromDefinition(definition: LevelDefinition, cells: { x: number; y: number }[]): {
  width: number;
  height: number;
} {
  const ml = definition.mapLayout;
  switch (ml.type) {
    case 'SQUARE':
      return { width: ml.width, height: ml.height };
    case 'CROSS':
      return { width: ml.width, height: ml.height };
    case 'TRIANGLE':
      return { width: ml.placeholder.width, height: ml.placeholder.height };
    case 'HEXAGON':
      return { width: ml.placeholder.width, height: ml.placeholder.height };
    case 'DIAMOND':
    case 'MIXED':
    default:
      return boundsFromCells(cells);
  }
}

function squareCells(layout: SquareMapLayout): { x: number; y: number }[] {
  const forbidden = new Set((layout.forbiddenCells ?? []).map(([x, y]) => cellsKey(x, y)));
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < layout.height; y++) {
    for (let x = 0; x < layout.width; x++) {
      if (forbidden.has(cellsKey(x, y))) continue;
      cells.push({ x, y });
    }
  }
  return cells;
}

function crossCells(width: number, height: number): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const midX = (width - 1) / 2;
      const midY = (height - 1) / 2;
      const arm = 1;
      if ((x >= midX - arm && x <= midX + arm) || (y >= midY - arm && y <= midY + arm)) {
        cells.push({ x, y });
      }
    }
  }
  return cells;
}

/** 與舊 makeCrossLevel 一致：11×11，粗 3 格臂 */
function defaultCrossCells(): { x: number; y: number }[] {
  const width = 11;
  const height = 11;
  return Array.from({ length: width * height }, (_, i) => {
    const x = i % width;
    const y = Math.floor(i / width);
    if ((x >= 4 && x <= 6) || (y >= 4 && y <= 6)) return { x, y };
    return null;
  }).filter((c): c is { x: number; y: number } => c !== null);
}

function diamondCells(radius: number): { x: number; y: number }[] {
  const size = radius * 2 + 1;
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (Math.abs(x - radius) + Math.abs(y - radius) <= radius) cells.push({ x, y });
    }
  }
  return cells;
}

function mixedSectorCells(sector: {
  shape: string;
  offset: { x: number; y: number };
  size: [number, number];
}): { x: number; y: number }[] {
  const [w, h] = sector.size;
  const { x: ox, y: oy } = sector.offset;
  if (sector.shape === 'SQUARE') {
    const out: { x: number; y: number }[] = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        out.push({ x: ox + x, y: oy + y });
      }
    }
    return out;
  }
  // HEXAGON / TRIANGLE：幾何 TODO，先以同尺寸方格塊佔位
  const out: { x: number; y: number }[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      out.push({ x: ox + x, y: oy + y });
    }
  }
  return out;
}

function cellsFromMapLayout(layout: MapLayout): { x: number; y: number }[] {
  switch (layout.type) {
    case 'SQUARE':
      return squareCells(layout);
    case 'CROSS':
      return layout.width === 11 && layout.height === 11 ? defaultCrossCells() : crossCells(layout.width, layout.height);
    case 'DIAMOND':
      return diamondCells(layout.radius);
    case 'TRIANGLE': {
      const { width, height } = layout.placeholder;
      return squareCells({
        type: 'SQUARE',
        width,
        height,
        forbiddenCells: layout.forbiddenCells,
      });
    }
    case 'HEXAGON': {
      const { width, height } = layout.placeholder;
      return squareCells({
        type: 'SQUARE',
        width,
        height,
        forbiddenCells: layout.forbiddenCells,
      });
    }
    case 'MIXED': {
      const all: { x: number; y: number }[] = [];
      for (const s of layout.sectors) {
        all.push(...mixedSectorCells(s));
      }
      return dedupeCells(all);
    }
    default:
      return squareCells({ type: 'SQUARE', width: 8, height: 8 });
  }
}

function initialHintsFromLayout(layout: MapLayout): { x: number; y: number; value: number }[] {
  if (layout.type !== 'SQUARE') return [];
  const pre = layout.prePlaced ?? [];
  return pre.map((p) => ({ x: p.pos[0], y: p.pos[1], value: p.value }));
}

export function buildPlayableLevel(definition: LevelDefinition): PlayableLevel {
  let cells = cellsFromMapLayout(definition.mapLayout);
  cells = dedupeCells(cells);
  const { width, height } = boardBoundsFromDefinition(definition, cells);

  const initialHints = initialHintsFromLayout(definition.mapLayout);

  return {
    id: definition.levelId,
    name: definition.title,
    width,
    height,
    cells,
    definition,
    initialHints,
  };
}
