import { useMemo } from 'react';
import { Award } from 'lucide-react';
import { getAllBestMedals } from '../game/gameProgressStorage';
import { type Medal } from '../game/medalThresholds';

const MEDAL_TONE: Record<Medal, string> = {
  bronze: 'text-amber-700',
  silver: 'text-slate-200',
  gold: 'text-yellow-300',
};

export function ChapterMedalSummary() {
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
    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 p-3">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
        <Award size={12} className="text-amber-300" strokeWidth={2.5} />
        勳章總覽
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-lg border border-yellow-300/35 bg-slate-900/40 px-2 py-2 text-center">
          <div className={`text-lg font-black tabular-nums ${MEDAL_TONE.gold}`}>{totals.gold}</div>
          <div className="text-[10px] font-bold text-slate-500">金勳章</div>
        </div>
        <div className="rounded-lg border border-slate-300/35 bg-slate-900/40 px-2 py-2 text-center">
          <div className={`text-lg font-black tabular-nums ${MEDAL_TONE.silver}`}>{totals.silver}</div>
          <div className="text-[10px] font-bold text-slate-500">銀勳章</div>
        </div>
        <div className="rounded-lg border border-amber-500/35 bg-slate-900/40 px-2 py-2 text-center">
          <div className={`text-lg font-black tabular-nums ${MEDAL_TONE.bronze}`}>{totals.bronze}</div>
          <div className="text-[10px] font-bold text-slate-500">銅勳章</div>
        </div>
      </div>
    </div>
  );
}
