import { useMemo } from 'react';
import { getAllBestMedals } from '../game/gameProgressStorage';
import { type Medal } from '../game/medalThresholds';
import hexGold from '../assets/mission-hex-badges/hex-gold.png';
import hexSilver from '../assets/mission-hex-badges/hex-silver.png';
import hexBronze from '../assets/mission-hex-badges/hex-bronze.png';

const MEDAL_TONE: Record<Medal, string> = {
  bronze: 'text-amber-400/95',
  silver: 'text-slate-50',
  gold: 'text-amber-200',
};

const MEDAL_HEX: Record<Medal, string> = {
  gold: hexGold,
  silver: hexSilver,
  bronze: hexBronze,
};

const MEDAL_LABEL: Record<Medal, string> = {
  gold: '金勳章',
  silver: '銀勳章',
  bronze: '銅勳章',
};

function medalTooltip(medal: Medal, count: number): string {
  const name = MEDAL_LABEL[medal];
  if (count <= 0) return `${name}：0 關 — 尚無關卡以該評級作為最佳成績`;
  return `${name}：${count} 關 — 各關最佳成績達「${name.replace('勳章', '')}級」門檻`;
}

const MEDAL_GLOW: Record<Medal, string> = {
  gold: 'drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]',
  silver: 'drop-shadow-[0_0_8px_rgba(226,232,240,0.25)]',
  bronze: 'drop-shadow-[0_0_8px_rgba(251,146,60,0.35)]',
};

function MedalHexBadge({ medal }: { medal: Medal }) {
  return (
    <img
      src={MEDAL_HEX[medal]}
      alt=""
      className={`h-9 w-9 object-contain sm:h-10 sm:w-10 ${MEDAL_GLOW[medal]}`}
      draggable={false}
    />
  );
}

/** 首頁戰役卡右上：緊湊勳章帶（不占高、仍保留儀表質感） */
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
      <div className="rounded-xl border border-slate-500/40 bg-gradient-to-b from-slate-800/95 via-[#0b1018] to-slate-950/95 px-1 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_2px_14px_rgba(0,0,0,0.4)] ring-1 ring-amber-500/15 sm:px-1.5 sm:py-1.5">
        <div className="flex items-stretch divide-x divide-slate-600/35">
          {(['gold', 'silver', 'bronze'] as const).map((medal) => (
            <div
              key={medal}
              title={medalTooltip(medal, totals[medal])}
              className="flex min-w-[2.35rem] flex-col items-center justify-center gap-0.5 px-1 sm:min-w-[2.65rem] sm:px-1.5"
              aria-label={`${MEDAL_LABEL[medal]} ${totals[medal]} 枚`}
            >
              <MedalHexBadge medal={medal} />
              <div
                className={`text-sm font-black tabular-nums leading-none sm:text-base ${MEDAL_TONE[medal]}`}
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.75)' }}
              >
                {totals[medal]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
