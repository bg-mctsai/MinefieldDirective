import { motion } from 'motion/react';
import { RefreshCw, Wifi } from 'lucide-react';
import { HomeBrandLogo } from './HomeBrandLogo';
import { HOME_APP_VERSION } from './constants';

export function HomeHeader({
  devReload,
}: {
  /** 僅開發模式：重讀 `levels.json` 與外置 `maps/*.json` */
  devReload?: { onClick: () => void; busy: boolean; hint: string | null };
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative flex flex-col gap-1.5 border-b border-[#1e293b] pb-1.5 md:pb-2"
    >
      <div className="absolute right-0 top-0 z-20 flex flex-col items-end gap-2.5 text-sm md:text-base">
        <div className="flex flex-wrap items-center justify-end gap-3">
          {devReload && (
            <button
              type="button"
              onClick={devReload.onClick}
              disabled={devReload.busy}
              title="開發用：重新從磁碟載入 levelData/levels.json 與 levelData/maps/*.json"
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 font-bold text-amber-400/95 transition-colors hover:border-amber-400/60 hover:bg-amber-500/15 disabled:opacity-50"
            >
              <RefreshCw size={14} className={devReload.busy ? 'animate-spin' : 'shrink-0'} />
              重讀設定
            </button>
          )}
          <span className="rounded-lg border border-[#1e293b] bg-[#0f141c] px-3 py-1.5 font-bold text-slate-200">
            {HOME_APP_VERSION}
          </span>
          <span className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-bold text-emerald-400">
            <Wifi size={14} className="shrink-0" />
            CONNECTED
          </span>
        </div>
        {devReload?.hint && (
          <p className="max-w-[18rem] text-right text-xs leading-snug text-slate-300 md:max-w-xs md:text-sm">
            {devReload.hint}
          </p>
        )}
      </div>

      <div className="flex justify-center -mb-2 md:-mb-3">
        <HomeBrandLogo />
      </div>

      <div className="pointer-events-none relative h-px overflow-hidden rounded-full bg-slate-800/70">
        <span className="absolute inset-y-0 left-[-25%] w-1/4 animate-[scanline_2.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent shadow-[0_0_16px_rgba(56,189,248,0.55)]" />
      </div>

    </motion.header>
  );
}
