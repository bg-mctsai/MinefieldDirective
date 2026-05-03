/**
 * 章節「行動卷宗」卡片
 * - 牛皮紙紋背景 + 內網格 + 釘裝邊
 * - 「展開卷宗」僅切換內文顯示；「進入作戰地圖」才開戰術選關
 */
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Map as MapIcon } from 'lucide-react';
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
  collapsed,
  pending,
  onEnterMap,
  delaySec,
}: {
  chapter: number;
  headline: string;
  blurb: string;
  rowsCount: number;
  isHint: boolean;
  /** 整章已通關：預設縮略列、顯示紅章；展開後仍可看故事 */
  collapsed: boolean;
  /** 正在切入作戰地圖過場 */
  pending: boolean;
  onEnterMap: () => void;
  delaySec: number;
}) {
  const [storyOpen, setStoryOpen] = useState(() => isHint);
  useEffect(() => {
    if (isHint) setStoryOpen(true);
  }, [isHint]);
  const compact = collapsed && !storyOpen;

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: pending ? 1.012 : 1,
      }}
      transition={{ delay: delaySec, duration: 0.22 }}
      className="w-full"
    >
      <div
        className={`group relative flex w-full items-stretch justify-between gap-3 overflow-hidden rounded-2xl border-double border-[3px] pl-4 pr-3 text-left transition-[border-color,transform,box-shadow] sm:gap-4 sm:pl-6 sm:pr-4 ${
          compact ? 'py-3 sm:py-3.5' : 'py-4 sm:py-5'
        } ${
          pending
            ? 'border-[#F59E0B] shadow-[0_18px_44px_rgba(245,158,11,0.25)]'
            : 'border-[#3a2f1a] shadow-[0_8px_28px_rgba(0,0,0,0.32)] hover:border-[#F59E0B]/75 hover:shadow-[0_14px_40px_rgba(245,158,11,0.16)]'
        } focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F59E0B]/50 focus-within:ring-offset-2 focus-within:ring-offset-[#0a0d12]`}
        style={PAPER_BG}
      >
        <span className="pointer-events-none absolute inset-y-2 left-1.5 w-1 rounded-full bg-[#F59E0B]/30" />
        <span className="pointer-events-none absolute left-2.5 top-3 h-1.5 w-1.5 rounded-full bg-[#F59E0B]/60" />
        <span className="pointer-events-none absolute bottom-3 left-2.5 h-1.5 w-1.5 rounded-full bg-[#F59E0B]/60" />

        <div
          className={`relative flex min-w-0 flex-1 flex-col pl-3 ${compact ? 'gap-1' : 'gap-2'} ${
            collapsed ? 'pr-[4.75rem] sm:pr-[5.25rem]' : 'pr-1'
          }`}
        >
          {collapsed ? (
            <div
              className="pointer-events-none absolute right-1 top-1/2 z-[1] -translate-y-1/2 select-none sm:right-2"
              aria-hidden
            >
              <div
                className="ops-stamp-wobble rounded-sm border-[2.5px] border-red-600/85 bg-red-950/40 px-2 py-1 text-center shadow-[0_0_14px_rgba(220,38,38,0.35),inset_0_0_12px_rgba(127,29,29,0.2)]"
                style={{ textShadow: '0 0 5px rgba(220,38,38,0.5)' }}
              >
                <p className="text-xs font-black leading-none tracking-[0.06em] text-red-200 sm:text-[13px]">已結卷</p>
                <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.24em] text-red-500/85">CONFIRMED</p>
              </div>
            </div>
          ) : null}

          <div className="flex min-w-0 items-baseline gap-2">
            <span className="shrink-0 text-[11px] font-black tabular-nums tracking-tight text-[#F59E0B]/90 sm:text-xs">
              卷 {String(chapter).padStart(2, '0')}
            </span>
            <span className="min-w-0 truncate text-base font-black tracking-tight text-white sm:text-lg" title={headline}>
              {headline}
            </span>
          </div>

          {storyOpen ? (
            <div className="mt-1 rounded-xl border border-white/[0.06] bg-black/25 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-3.5 sm:py-3">
              <p className="whitespace-pre-line text-xs leading-relaxed text-slate-200/95 sm:text-sm">{blurb}</p>
            </div>
          ) : null}

          <div className="mt-2 flex flex-col gap-2.5 border-t border-white/[0.06] pt-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="flex min-w-0 flex-wrap items-stretch gap-2">
              <button
                type="button"
                onClick={() => {
                  emit('ui.select.change');
                  setStoryOpen((v) => !v);
                }}
                className="rounded-xl border border-slate-600/70 bg-slate-950/50 px-3 py-2 text-[11px] font-bold text-slate-300 shadow-sm transition-colors hover:border-[#F59E0B]/50 hover:bg-slate-900/80 hover:text-[#F59E0B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0f14] active:scale-[0.99] sm:px-3.5 sm:text-xs"
              >
                {storyOpen ? '收合卷宗' : '展開卷宗'}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  emit('ui.select.change');
                  onEnterMap();
                }}
                className="inline-flex min-h-[2.25rem] flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-[#FCD34D] via-[#F59E0B] to-[#D97706] px-3.5 py-2 text-[11px] font-black tracking-wide text-[#1c1003] shadow-[0_4px_18px_rgba(245,158,11,0.35),inset_0_1px_0_rgba(255,255,255,0.38)] transition-[transform,filter,box-shadow] hover:brightness-105 hover:shadow-[0_6px_24px_rgba(245,158,11,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0f14] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55 sm:flex-initial sm:min-w-[9.5rem] sm:px-4 sm:text-xs"
              >
                <MapIcon size={15} strokeWidth={2.5} className="shrink-0 opacity-90" aria-hidden />
                進入作戰地圖
              </button>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 sm:justify-end sm:text-xs">
              <span className="tabular-nums text-slate-500">共 {rowsCount} 道戰區</span>
              {isHint ? (
                <span className="rounded-md border border-[#F59E0B]/50 bg-[#F59E0B]/12 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#F59E0B]">
                  進行中
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
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
          <span className="text-[10px] font-bold tracking-wide text-slate-600">
            卷 {String(chapter).padStart(2, '0')} · 封存
          </span>
          <span className="truncate text-base font-black text-slate-500 sm:text-lg" title={headline}>
            {headline}
          </span>
          <p className="whitespace-pre-line text-xs leading-relaxed text-slate-600 sm:text-sm">{blurb}</p>
          <div className="text-[11px] text-slate-600 sm:text-xs">卷 {String(chapter).padStart(2, '0')} · 尚未列入行動表</div>
        </div>
      </div>
    </motion.li>
  );
}
