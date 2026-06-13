import type { LevelDefinition } from '../levelData/types';

/**
 * 本關「特色玩法」短標籤（與企劃 docs/world_map_design.md 用語對齊，供頂欄與指南旁顯示）。
 * — 通訊恢復：mineBonusTargetCells（斷線封鎖章，邏輯確認雷 +秒）
 * — 定時炸點：blastPoints
 * — 鄰焰共振：neighborPlacedDigitBonus（熱力迴聲）
 * — 信號輪播：commandSlotReceiveJamming（電報數字輪播至鎖定）
 * — 廢雷暗流：dynamicMinePerMove（佈署後隨機廢雷，不計入鄰格數）
 * （三角／蜂巢等地圖拓撲不列入特色標籤；levels.json 之 events 未實裝，不顯示。）
 */

export type MechanicFeatureBadge = { key: string; label: string };

export function levelMechanicFeatureBadges(def: LevelDefinition): MechanicFeatureBadge[] {
  const out: MechanicFeatureBadge[] = [];
  if ((def.mineBonusTargetCells?.length ?? 0) > 0) {
    out.push({ key: 'comm-relay', label: '通訊恢復' });
  }
  if ((def.digitOutposts?.length ?? 0) > 0) {
    out.push({ key: 'digit-outposts', label: '戰術據點' });
  }
  if ((def.blastPoints?.length ?? 0) > 0) out.push({ key: 'blast-points', label: '定時炸點' });
  if (def.neighborPlacedDigitBonus) out.push({ key: 'neighbor-bonus', label: '鄰焰共振' });
  if (def.commandSlotReceiveJamming) out.push({ key: 'cmd-jamming', label: '信號輪播' });
  if (def.dynamicMinePerMove) out.push({ key: 'dynamic-mine', label: '廢雷暗流' });
  return out;
}

export function LevelMechanicFeatureBadges({ definition }: { definition: LevelDefinition }) {
  const items = levelMechanicFeatureBadges(definition);
  if (items.length === 0) return null;
  return (
    <div className="flex max-w-[min(100vw-10rem,22rem)] flex-wrap items-center justify-end gap-1 sm:max-w-md">
      {items.map(({ key, label }) => (
        <span
          key={key}
          title={`本關特色：${label}（詳見戰略指南）`}
          className="inline-flex shrink-0 rounded-md border border-sky-800/80 bg-sky-950/50 px-1.5 py-0.5 text-[10px] font-black leading-tight tracking-wide text-sky-300/95 sm:text-[11px]"
        >
          {label}
        </span>
      ))}
    </div>
  );
}
