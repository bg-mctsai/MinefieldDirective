import { motion } from 'motion/react';
import { RefreshCw, Wifi } from 'lucide-react';
import { HOME_APP_VERSION } from './constants';

export function HomeHeader({
  typedTitle,
  devReload,
}: {
  typedTitle: string;
  /** 僅開發模式：重讀 `levels.json` */
  devReload?: { onClick: () => void; busy: boolean; hint: string | null };
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="flex flex-col gap-6 border-b border-[#1e293b] pb-8 md:flex-row md:items-end md:justify-between"
    >
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white md:text-4xl">
          {typedTitle}
          <span className="inline-block w-2.5 animate-pulse text-[#F59E0B]">▍</span>
        </h1>
        <p className="mt-2 text-sm text-emerald-400/90 md:text-base">
          [電報線就緒] 長官部門來電，依電報數字於雷區執行佈雷。
        </p>
      </div>
      <div className="flex flex-col items-end gap-2 text-xs md:text-sm">
        <div className="flex flex-wrap items-center justify-end gap-3">
          {devReload && (
            <button
              type="button"
              onClick={devReload.onClick}
              disabled={devReload.busy}
              title="開發用：重新從磁碟載入 levelData/levels.json"
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 font-bold text-amber-400/95 transition-colors hover:border-amber-400/60 hover:bg-amber-500/15 disabled:opacity-50"
            >
              <RefreshCw size={14} className={devReload.busy ? 'animate-spin' : 'shrink-0'} />
              重讀設定
            </button>
          )}
          <span className="rounded-lg border border-[#1e293b] bg-[#0f141c] px-3 py-1.5 text-slate-400">
            {HOME_APP_VERSION}
          </span>
          <span className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-bold text-emerald-400">
            <Wifi size={14} className="shrink-0" />
            CONNECTED
          </span>
        </div>
        {devReload?.hint && (
          <p className="max-w-[18rem] text-right text-[10px] leading-snug text-slate-500 md:max-w-xs">
            {devReload.hint}
          </p>
        )}
      </div>
    </motion.header>
  );
}
