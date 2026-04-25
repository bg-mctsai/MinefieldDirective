/**
 * 章節「行動卷宗」卡片
 * - 牛皮紙紋背景 + 內網格 + 釘裝邊
 * - 右上 CONFIDENTIAL 印章
 * - 上欄：章節標題與描述；下欄：標籤條（戰區編號、進度提示）
 */
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { emit } from './audio/AudioEngine';

const PAPER_BG: React.CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(245,236,210,0.04) 0%, rgba(245,158,11,0.05) 38%, rgba(15,20,28,0.95) 100%), repeating-linear-gradient(0deg, rgba(245,158,11,0.04) 0px, rgba(245,158,11,0.04) 1px, transparent 1px, transparent 18px), repeating-linear-gradient(90deg, rgba(245,158,11,0.03) 0px, rgba(245,158,11,0.03) 1px, transparent 1px, transparent 18px)',
};

export function BriefingFolderCard({
  chapter,
  headline,
  blurb,
  rowsCount,
  isHint,
  pending,
  onClick,
  delaySec,
}: {
  chapter: number;
  headline: string;
  blurb: string;
  rowsCount: number;
  isHint: boolean;
  /** 是否為「正在拉開」狀態：放大、提亮、稍微外推 */
  pending: boolean;
  onClick: () => void;
  delaySec: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: pending ? 1.015 : 1,
      }}
      transition={{ delay: delaySec, duration: 0.22 }}
      className="w-full"
    >
      <button
        type="button"
        onClick={() => {
          // 行動卷宗使用與地圖選擇同一顆選取音
          emit('ui.select.change');
          onClick();
        }}
        aria-label={`開啟「${headline}」戰區卷宗`}
        title={`開啟「${headline}」戰區卷宗`}
        className={`group relative flex w-full items-stretch justify-between gap-3 overflow-hidden rounded-2xl border-double border-[3px] py-3.5 pl-4 pr-3 text-left transition-[border-color,transform,box-shadow] sm:gap-4 sm:py-4 sm:pl-6 sm:pr-4 ${
          pending
            ? 'border-[#F59E0B] shadow-[0_18px_44px_rgba(245,158,11,0.25)]'
            : 'border-[#3a2f1a] shadow-[0_8px_28px_rgba(0,0,0,0.32)] hover:border-[#F59E0B]/80 hover:shadow-[0_14px_40px_rgba(245,158,11,0.18)]'
        } active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]/75 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0d12]`}
        style={PAPER_BG}
      >
        {/* 左側裝訂釘條 */}
        <span className="pointer-events-none absolute inset-y-2 left-1.5 w-1 rounded-full bg-[#F59E0B]/30" />
        <span className="pointer-events-none absolute left-2.5 top-3 h-1.5 w-1.5 rounded-full bg-[#F59E0B]/60" />
        <span className="pointer-events-none absolute bottom-3 left-2.5 h-1.5 w-1.5 rounded-full bg-[#F59E0B]/60" />

        {/* 右上 CONFIDENTIAL 印章 */}
        <span
          className="pointer-events-none absolute right-3 top-2 select-none rounded-md border-[2.5px] border-red-500/60 px-1.5 py-[1px] font-mono text-[8px] font-black uppercase tracking-[0.32em] text-red-500/80 ops-stamp-wobble"
          style={{ textShadow: '0 0 4px rgba(239,68,68,0.35)' }}
        >
          CONFIDENTIAL
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 pl-3 pr-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
            BRIEFING FOLDER · CH-{String(chapter).padStart(2, '0')}
          </span>
          <span className="truncate text-base font-black tracking-tight text-white sm:text-lg" title={headline}>
            {headline}
          </span>
          <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">{blurb}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400 sm:text-xs">
            <span className="font-bold text-[#F59E0B]/95">展開卷宗</span>
            <span className="text-slate-600">·</span>
            <span>共 {rowsCount} 道戰區</span>
            {isHint ? (
              <span className="rounded border border-[#F59E0B]/55 bg-[#F59E0B]/15 px-1.5 py-0.5 text-[10px] font-black text-[#F59E0B]">
                進行中
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center justify-center border-l border-[#3a2f1a]/80 pl-2 sm:pl-3">
          <ChevronRight
            className="text-[#F59E0B]/70 transition-colors group-hover:text-[#F59E0B] group-focus-visible:text-[#F59E0B]"
            size={22}
            strokeWidth={2.25}
            aria-hidden
          />
        </div>
      </button>
    </motion.li>
  );
}

/** 鎖住的章節（無資料時）使用的灰色卷宗樣式 */
export function BriefingFolderLocked({
  chapter,
  headline,
  blurb,
  delaySec,
}: {
  chapter: number;
  headline: string;
  blurb: string;
  delaySec: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delaySec, duration: 0.22 }}
      className="w-full"
    >
      <div
        className="relative flex w-full cursor-not-allowed items-stretch justify-between gap-3 overflow-hidden rounded-2xl border-2 border-dashed border-slate-700 bg-[#0f141c]/95 py-3.5 pl-4 pr-3 opacity-60 sm:gap-4 sm:py-4 sm:pl-6 sm:pr-4"
        aria-disabled
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-600">
            FOLDER SEALED · CH-{String(chapter).padStart(2, '0')}
          </span>
          <span className="truncate text-base font-black text-slate-500 sm:text-lg" title={headline}>
            {headline}
          </span>
          <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">{blurb}</p>
          <div className="text-[11px] text-slate-600 sm:text-xs">第 {chapter} 章 · 尚未列入行動表</div>
        </div>
      </div>
    </motion.li>
  );
}
