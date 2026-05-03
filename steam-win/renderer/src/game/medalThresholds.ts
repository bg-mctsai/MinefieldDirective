/**
 * 關卡勳章評等：銅／銀／金；以「過關當下火力」（已確定地雷／總格）落在哪一段門檻判定。
 *
 * 規則：
 * - 達銅以下：未過關。
 * - 達銅未達銀：銅。
 * - 達銀未達金：銀。
 * - 達金以上：金（並觸發自動結算）。
 *
 * 設定優先序：levels.json 之 medalThresholds > 全域固定預設值。
 * 預設規則：bronze = 0.60、silver = 0.75、gold = 0.90。
 */

import type { LevelDefinition, MedalThresholds } from '../levelData/types';

export type Medal = 'bronze' | 'silver' | 'gold';

export const MEDAL_RANK: Record<Medal, number> = { bronze: 1, silver: 2, gold: 3 };

const DEFAULT_BRONZE = 0.6;
const DEFAULT_SILVER = 0.75;
const DEFAULT_GOLD = 0.9;

function clamp01Strict(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v <= 0) return 0;
  if (v >= 1) return 1;
  return v;
}

/**
 * 解出門檻（0～1）。若 levels.json 缺欄或欄位不合法，使用上方全域預設（與 coverageGoal 無關）。
 * 後置條件：0 < bronze <= silver <= gold <= 1。
 */
export function resolveMedalThresholds(def: Pick<LevelDefinition, 'coverageGoal' | 'medalThresholds'>): MedalThresholds {
  const raw = def.medalThresholds;
  if (
    raw &&
    Number.isFinite(raw.bronze) &&
    Number.isFinite(raw.silver) &&
    Number.isFinite(raw.gold)
  ) {
    const bronze = clamp01Strict(raw.bronze);
    const silver = clamp01Strict(Math.max(raw.silver, bronze));
    const gold = clamp01Strict(Math.max(raw.gold, silver));
    if (bronze > 0) return { bronze, silver, gold };
  }
  const bronze = DEFAULT_BRONZE;
  const silver = clamp01Strict(DEFAULT_SILVER);
  const gold = clamp01Strict(DEFAULT_GOLD);
  return { bronze, silver, gold };
}

/**
 * 依當下火力比例（0～1 或 0～100，二者皆吃）判牌；不過關回 null。
 */
export function judgeMedal(fillRatioOrPct: number, t: MedalThresholds): Medal | null {
  if (!Number.isFinite(fillRatioOrPct)) return null;
  const ratio = fillRatioOrPct > 1 ? fillRatioOrPct / 100 : fillRatioOrPct;
  if (ratio >= t.gold) return 'gold';
  if (ratio >= t.silver) return 'silver';
  if (ratio >= t.bronze) return 'bronze';
  return null;
}

export function isHigherMedal(a: Medal | null, b: Medal | null): boolean {
  const ra = a ? MEDAL_RANK[a] : 0;
  const rb = b ? MEDAL_RANK[b] : 0;
  return ra > rb;
}

export const MEDAL_LABEL_TC: Record<Medal, string> = {
  bronze: '銅級勳章',
  silver: '銀級勳章',
  gold: '金級勳章',
};
