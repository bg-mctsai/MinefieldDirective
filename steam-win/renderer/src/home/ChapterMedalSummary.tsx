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
    chip: string;
    chipText: string;
    count: string;
  }
> = {
  gold: {
    chip: 'border-yellow-400/55 bg-gradient-to-br from-yellow-700/95 via-amber-400/90 to-yellow-200 shadow-[0_0_10px_rgba(253,224,71,0.28)]',
    chipText: 'text-yellow-950',
    count: 'text-yellow-200',
  },
  silver: {
    chip: 'border-slate-300/50 bg-gradient-to-br from-slate-700 via-slate-300 to-slate-100 shadow-[0_0_8px_rgba(226,232,240,0.18)]',
    chipText: 'text-slate-900',
    count: 'text-slate-100',
  },
  bronze: {
    chip: 'border-amber-600/55 bg-gradient-to-br from-amber-900 via-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.22)]',
    chipText: 'text-amber-950',
    count: 'text-amber-300',
  },
};

function medalTooltip(medal: Medal, count: number): string {
  const tier = MEDAL_FULL[medal];
  if (count <= 0) return `${tier}評級：0 關 — 尚無關卡以該評級作為最佳成績`;
  return `${tier}評級：${count} 關 — 各關最佳火力達 ${tier} 門檻`;
}

function TierRankChip({ medal }: { medal: Medal }) {
  const style = TIER_STYLE[medal];
  return (
    <span
      className={`inline-flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-[3px] border text-[9px] font-black leading-none sm:h-5 sm:w-5 sm:rounded sm:text-[10px] ${style.chip} ${style.chipText}`}
      aria-hidden
    >
      {MEDAL_LABEL[medal]}
    </span>
  );
}

function TierStat({ medal, count }: { medal: Medal; count: number }) {
  const style = TIER_STYLE[medal];
  const dimmed = count <= 0;
  return (
    <div
      title={medalTooltip(medal, count)}
      className={`flex items-center gap-1 px-1 sm:gap-1.5 sm:px-1.5 ${dimmed ? 'opacity-40' : ''}`}
      aria-label={`${MEDAL_FULL[medal]} ${count} 關`}
    >
      <TierRankChip medal={medal} />
      <span className={`text-sm font-black tabular-nums leading-none sm:text-base ${style.count}`}>
        {count}
      </span>
    </div>
  );
}

/** 首頁戰役卡右上：火力評級戰術讀數（無 PNG 徽章，與作戰 HUD 語彙一致） */
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
      <div className="rounded-lg border border-slate-600/45 bg-slate-950/75 px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_16px_rgba(0,0,0,0.25)] sm:rounded-xl sm:px-2.5">
        <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:text-[10px]">
          火力評級
        </div>
        <div className="flex items-center divide-x divide-slate-600/35">
          {MEDAL_ORDER.map((medal) => (
            <TierStat key={medal} medal={medal} count={totals[medal]} />
          ))}
        </div>
      </div>
    </div>
  );
}
