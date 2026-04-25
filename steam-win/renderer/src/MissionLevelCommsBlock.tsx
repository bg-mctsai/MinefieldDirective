import { memo, useMemo } from 'react';

const TACTICAL_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

function tacticalLetter(levelId: number, chapter: number, stage: number): string {
  const seed = (levelId * 7919 + chapter * 9973 + stage * 293) >>> 0;
  return TACTICAL_LETTERS[seed % TACTICAL_LETTERS.length]!;
}

/** 依關卡／章節固定：介面不重骰、存檔前後一致 */
export function formatMissionChannelCode(levelId: number, chapter: number, stage: number): string {
  const pad = String(stage).padStart(2, '0');
  if (stage >= 10) return `BOSS-${pad}`;
  return `#${pad}-${tacticalLetter(levelId, chapter, stage)}`;
}

function ChannelWaveBars({
  live,
  variant,
}: {
  live: boolean;
  variant: 'locked' | 'clearedTape' | 'tape';
}) {
  const heights = [3, 5, 4, 6, 3, 5];
  const dead =
    variant === 'locked'
      ? 'bg-slate-600/55'
      : variant === 'clearedTape'
        ? 'bg-[#F59E0B]/22'
        : 'bg-[#F59E0B]/22';
  const liveCls =
    variant === 'locked'
      ? 'bg-emerald-500/55 mission-wave-bar'
      : variant === 'clearedTape'
        ? 'bg-[#F59E0B] mission-wave-bar'
        : 'bg-[#F59E0B] mission-wave-bar';

  return (
    <span className="inline-flex h-3.5 items-end gap-px" aria-hidden>
      {heights.map((px, i) => (
        <span
          key={i}
          className={`w-[2px] max-w-[2px] rounded-[1px] ${live ? liveCls : dead}`}
          style={{
            height: px,
            animationDelay: live ? `${i * 0.11}s` : undefined,
          }}
        />
      ))}
    </span>
  );
}

export type MissionLevelCommsBlockProps = {
  stage: number;
  levelId: number;
  chapter: number;
  cleared: boolean;
  locked?: boolean;
  /** 章末第 10 槽：警示外框 */
  isBossStage: boolean;
  /** 橫幅列略加寬 */
  relaxed?: boolean;
  /** 章內下一個可接關卡（未完成）— 頻道微脈衝 */
  inProgress?: boolean;
};

export const MissionLevelCommsBlock = memo(function MissionLevelCommsBlock({
  stage,
  locked = false,
  cleared,
  isBossStage,
  relaxed = false,
  inProgress = false,
}: MissionLevelCommsBlockProps) {
  const ch = useMemo(() => String(stage).padStart(2, '0'), [stage]);
  const live = !locked && !cleared;

  const sizePad =
    relaxed ? 'min-w-[5.95rem] px-2 py-1.25 sm:min-w-[6.35rem]' : 'min-w-[5.2rem] px-1.5 py-1 sm:min-w-[5.55rem]';

  const tunePulse = inProgress && !locked && !cleared ? 'mission-ch-tune-pulse' : '';
  const bossTapeEdge = isBossStage && !locked && !cleared ? 'mission-boss-tape-edge' : '';

  let shell = '';
  let scanCls = '';
  let waveVariant: 'locked' | 'clearedTape' | 'tape' = 'tape';
  /** 括號 [] */
  let bracketTone = '';
  /** CH.xx 本體 */
  let chTone = '';
  /** 章末外框有動態斜紋：內層須不透明，否則半透明底 + 動畫背景會讓字體像糊／碎格 */
  const bossInnerOpaque =
    'border-2 border-[#F59E0B]/50 bg-[#07090e] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_0_0_1px_rgba(245,158,11,0.06)]';

  if (locked) {
    shell =
      'border border-slate-700 bg-[#06080d]/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';
    scanCls = 'mission-comms-scanlines';
    waveVariant = 'locked';
    bracketTone = 'text-slate-600';
    chTone = 'text-slate-500';
  } else if (cleared) {
    /** 與「返回卷宗」按鈕同色：邊 50% 琥珀、底 10% 琥珀、字主色 */
    shell = isBossStage
      ? bossInnerOpaque
      : 'border-2 border-[#F59E0B]/50 bg-[#F59E0B]/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]';
    scanCls = 'mission-comms-scanlines-tape';
    waveVariant = 'clearedTape';
    bracketTone = 'text-[#F59E0B]/80';
    chTone = 'text-[#F59E0B]';
  } else if (isBossStage) {
    shell = bossInnerOpaque;
    scanCls = 'mission-comms-scanlines-tape';
    waveVariant = 'tape';
    bracketTone = 'text-[#F59E0B]/80';
    chTone = 'text-[#F59E0B]';
  } else {
    shell =
      'border-2 border-[#F59E0B]/50 bg-[#F59E0B]/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]';
    scanCls = 'mission-comms-scanlines-tape';
    waveVariant = 'tape';
    bracketTone = 'text-[#F59E0B]/80';
    chTone = 'text-[#F59E0B]';
  }

  const inner = (
    <div
      className={`relative overflow-hidden rounded-md ${sizePad} ${shell} ${tunePulse} ${bossTapeEdge}`}
    >
      <div className={`pointer-events-none absolute inset-0 z-[2] ${scanCls}`} aria-hidden />
      <div className="relative z-[3] flex items-center gap-1.5">
        <span className="inline-flex items-baseline font-mono text-[10px] font-black leading-none tracking-tight sm:text-[11px]">
          <span className={bracketTone}>{'['}</span>
          <span className={`px-0.5 ${chTone}`}>CH.{ch}</span>
          <span className={bracketTone}>{']'}</span>
        </span>
        <ChannelWaveBars live={live} variant={waveVariant} />
      </div>
    </div>
  );

  if (!isBossStage) return inner;

  return (
    <div className="relative overflow-hidden rounded-lg p-[2px] mission-boss-hazard-stripes">
      <div className="relative z-[1] overflow-hidden rounded-[5px]">{inner}</div>
    </div>
  );
});
