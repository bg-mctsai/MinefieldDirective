import { missionChapterNodeLayout } from './missionChapterNodePositions';
import type {
  LevelDefinition,
  MissionTacticalBriefingMapPalette,
} from './levelData/types';

export type MissionTacticalRgb = { neon: string; neonSoft: string; warn: string; grid: string };

const PALETTE_ORDER: MissionTacticalBriefingMapPalette[] = [
  'aurora',
  'ember',
  'jade',
  'steel',
  'violet',
  'monsoon',
];

const PALETTES: Record<MissionTacticalBriefingMapPalette, MissionTacticalRgb> = {
  aurora: {
    neon: '#39ff14',
    neonSoft: '#22c55e',
    warn: '#F59E0B',
    grid: '#334155',
  },
  ember: {
    neon: '#fb923c',
    neonSoft: '#ea580c',
    warn: '#fde047',
    grid: '#3f2a24',
  },
  jade: {
    neon: '#34d399',
    neonSoft: '#059669',
    warn: '#a3e635',
    grid: '#1e3a2f',
  },
  steel: {
    neon: '#94a3b8',
    neonSoft: '#64748b',
    warn: '#38bdf8',
    grid: '#2d3748',
  },
  violet: {
    neon: '#c084fc',
    neonSoft: '#7c3aed',
    warn: '#f472b6',
    grid: '#352654',
  },
  monsoon: {
    neon: '#22d3ee',
    neonSoft: '#0891b2',
    warn: '#818cf8',
    grid: '#1e3a4a',
  },
};

function clampPct(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function missionTacticalPaletteKey(
  levelId: number,
  explicit?: MissionTacticalBriefingMapPalette,
): MissionTacticalBriefingMapPalette {
  if (explicit && explicit in PALETTES) return explicit;
  return PALETTE_ORDER[(Math.max(1, levelId) - 1) % PALETTE_ORDER.length]!;
}

export function missionTacticalPaletteRgb(
  levelId: number,
  explicit?: MissionTacticalBriefingMapPalette,
): MissionTacticalRgb {
  return PALETTES[missionTacticalPaletteKey(levelId, explicit)]!;
}

/**
 * 章內某關在戰術圖上的節點中心（%）；企劃可覆寫，否則依章別預設佈局（1～10 章各異）。
 */
export function resolveMissionTacticalNodePositionPct(args: {
  chapter: number;
  stage: number;
  levelId: number;
  override?: { x: number; y: number };
}): { x: number; y: number } {
  const layout = missionChapterNodeLayout(args.chapter);
  const idx = Math.min(layout.length - 1, Math.max(0, args.stage - 1));
  const base = layout[idx]!;
  if (args.override) {
    return {
      x: clampPct(args.override.x, 8, 92),
      y: clampPct(args.override.y, 16, 84),
    };
  }
  /** 預設佈局為企劃定案之散點；未覆寫時不再位移，以免破壞戰術路徑幾何 */
  return { x: base.x, y: base.y };
}

export function missionTacticalBriefingPaletteFromDefinition(
  levelId: number,
  def: LevelDefinition,
): MissionTacticalRgb {
  return missionTacticalPaletteRgb(levelId, def.missionTacticalBriefingMap?.mapPalette);
}
