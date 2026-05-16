import { motion } from 'motion/react';
import { ChevronRight, Flag, X } from 'lucide-react';
import { MissionLevelCommsBlock } from './MissionLevelCommsBlock';
import type { Level } from './gameLogic';

export type MissionLevelTacticalDockedBriefProps = {
  onClose: () => void;
  level: Level;
  /** 章內關次 1～8 */
  stage: number;
  unlocked: boolean;
  cleared: boolean;
  inProgress: boolean;
  isBossStage: boolean;
  cta: string;
  /** 僅戰場名／主題，不含 CH / 頻道前綴 */
  heading: string;
  onStart: () => void;
};

/** 戰術地圖浮動關卡卡：精簡資訊、小版面（細節進場內再看） */
export function MissionLevelTacticalDockedBrief({
  onClose,
  level,
  stage,
  unlocked,
  cleared,
  inProgress,
  isBossStage,
  cta,
  heading,
  onStart,
}: MissionLevelTacticalDockedBriefProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18 }}
      data-mission-docked-brief="1"
      className="relative z-10 w-full overflow-hidden rounded-lg border border-emerald-500/30 bg-[#050a08]/95 py-2 pl-2.5 pr-2 shadow-[0_8px_28px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(16,185,129,0.08)] backdrop-blur-md sm:py-2.5 sm:pl-3 sm:pr-2.5"
      role="region"
      aria-label="關卡摘要"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-1 top-1 rounded p-0.5 text-slate-500 hover:bg-white/5 hover:text-slate-200"
        aria-label="關閉摘要"
      >
        <X size={13} strokeWidth={2.25} />
      </button>

      <div className="flex flex-col gap-1.5 pr-5">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <MissionLevelCommsBlock
              stage={stage}
              cleared={cleared}
              locked={!unlocked}
              isBossStage={isBossStage}
              relaxed={isBossStage}
              inProgress={inProgress}
              compact
            />
            {cleared ? (
              <span className="inline-flex items-center gap-0.5 rounded border border-emerald-500/50 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300/95">
                <Flag size={10} strokeWidth={2.5} />
                已完成
              </span>
            ) : null}
          </div>
          {unlocked ? (
            <button
              type="button"
              onClick={() => {
                onStart();
                onClose();
              }}
              className="mission-docked-cta-breathe inline-flex shrink-0 items-center gap-0.5 rounded-md border border-[#FF9F1C]/70 bg-[#FF9F1C]/12 px-2.5 py-1.5 text-xs font-black text-[#fdba74] transition-colors hover:bg-[#FF9F1C]/22"
            >
              <span>{cta}</span>
              <ChevronRight size={14} strokeWidth={2.5} aria-hidden />
            </button>
          ) : (
            <p className="shrink-0 text-xs font-bold text-slate-400">未解鎖</p>
          )}
        </div>
        <h2 className="min-w-0 text-base font-black leading-snug tracking-tight text-emerald-100 sm:text-lg">
          {heading}
        </h2>
      </div>
    </motion.div>
  );
}
