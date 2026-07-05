import { useMemo } from 'react';
import { getAllBestMedals } from '../game/gameProgressStorage';
import { type Medal } from '../game/medalThresholds';

const MEDAL_ORDER: Medal[] = ['gold', 'silver', 'bronze'];

const MEDAL_LABEL: Record<Medal, string> = {
  gold: '金',
  silver: '銀',
  bronze: '銅',
};

const MEDAL_FULL: Record<Medal, string> = {
  gold: '金級',
  silver: '銀級',
  bronze: '銅級',
};

const TIER_STYLE: Record<
  Medal,
  {
    /** 圓幣金屬漸層（徑向打光） */
    coin: string;
    /** 描邊光圈色 */
    ring: string;
    /** 壓字色（幣面凹刻） */
    emboss: string;
    /** 數字色 */
    count: string;
  }
> = {
  gold: {
    coin: 'radial-gradient(circle at 34% 28%, #fef3c7 0%, #fcd34d 38%, #f59e0b 68%, #b45309 100%)',
    ring: 'rgba(253,224,71,0.55)',
    emboss: 'text-amber-950/70',
    count: 'text-amber-100',
  },
  silver: {
    coin: 'radial-gradient(circle at 34% 28%, #ffffff 0%, #e2e8f0 42%, #cbd5e1 68%, #64748b 100%)',
    ring: 'rgba(226,232,240,0.5)',
    emboss: 'text-slate-800/70',
    count: 'text-slate-100',
  },
  bronze: {
    coin: 'radial-gradient(circle at 34% 28%, #fde7c8 0%, #f0a24b 40%, #c2701c 70%, #7c3f0f 100%)',
    ring: 'rgba(234,140,60,0.5)',
    emboss: 'text-orange-950/70',
    count: 'text-orange-200',
  },
};

function medalTooltip(medal: Medal, count: number): string {
  const tier = MEDAL_FULL[medal];
  if (count <= 0) return `${tier}評級：0 關 — 尚無關卡以該評級作為最佳成績`;
  return `${tier}評級：${count} 關 — 各關最佳火力達 ${tier} 門檻`;
}

function MedalCoin({ medal }: { medal: Medal }) {
  const style = TIER_STYLE[medal];
  return (
    <span
      className="relative inline-flex h-[1.35rem] w-[1.35rem] shrink-0 items-center justify-center rounded-full"
      style={{
        background: style.coin,
        boxShadow: `inset 0 1px 1.5px rgba(255,255,255,0.6), inset 0 -2px 3px rgba(0,0,0,0.45), 0 0 0 1px ${style.ring}, 0 1px 3px rgba(0,0,0,0.55)`,
      }}
      aria-hidden
    >
      <span className={`text-[10px] font-black leading-none ${style.emboss}`}>
        {MEDAL_LABEL[medal]}
      </span>
    </span>
  );
}

function TierStat({ medal, count }: { medal: Medal; count: number }) {
  const style = TIER_STYLE[medal];
  const dimmed = count <= 0;
  return (
    <div
      title={medalTooltip(medal, count)}
      className={`flex items-center gap-1.5 ${dimmed ? 'opacity-35 saturate-50' : ''}`}
      aria-label={`${MEDAL_FULL[medal]} ${count} 關`}
    >
      <MedalCoin medal={medal} />
      <span className={`text-base font-black tabular-nums leading-none sm:text-lg ${style.count}`}>
        {count}
      </span>
    </div>
  );
}

/** 首頁戰役卡右上：火力評級戰術讀數（圓形獎章幣，與作戰 HUD 語彙一致） */
export function ChapterMedalSummary({ className }: { className?: string } = {}) {
  const totals = useMemo(() => {
    const bestMap = getAllBestMedals();
    const medals: Record<Medal, number> = { bronze: 0, silver: 0, gold: 0 };
    for (const m of Object.values(bestMap)) {
      medals[m] += 1;
    }
    return medals;
  }, []);

  const total = totals.gold + totals.silver + totals.bronze;
  if (total <= 0) return null;

  return (
    <div className={['shrink-0', className].filter(Boolean).join(' ')}>
      <div className="relative overflow-hidden rounded-xl border border-slate-700/40 bg-gradient-to-b from-slate-900/80 to-slate-950/85 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_18px_rgba(0,0,0,0.3)]">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="h-2.5 w-0.5 rounded-full bg-[#F59E0B]/80" aria-hidden />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            火力評級
          </span>
        </div>
        <div className="flex items-center gap-3">
          {MEDAL_ORDER.map((medal) => (
            <TierStat key={medal} medal={medal} count={totals[medal]} />
          ))}
        </div>
      </div>
    </div>
  );
}
