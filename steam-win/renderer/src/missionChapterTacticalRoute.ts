type Pt = { x: number; y: number };

/**
 * 以 Catmull-Rom 風格控制點產生平滑三次貝茲，形成不規則戰術路徑（通過各關卡節點）。
 */
export function buildTacticalRouteSmoothD(points: Pt[], tension = 0.28): string {
  const n = points.length;
  if (n === 0) return '';
  if (n === 1) return `M ${points[0]!.x} ${points[0]!.y}`;
  const t = tension;
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < n - 1; i += 1) {
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    const pm = i > 0 ? points[i - 1]! : p0;
    const pn = i + 2 < n ? points[i + 2]! : p1;
    const c1x = p0.x + (p1.x - pm.x) * t;
    const c1y = p0.y + (p1.y - pm.y) * t;
    const c2x = p1.x - (pn.x - p0.x) * t;
    const c2y = p1.y - (pn.y - p0.y) * t;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p1.x} ${p1.y}`;
  }
  return d;
}
