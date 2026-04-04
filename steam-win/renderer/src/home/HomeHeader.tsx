import { motion } from 'motion/react';
import { Wifi } from 'lucide-react';
import { HOME_APP_VERSION } from './constants';

export function HomeHeader({ typedTitle }: { typedTitle: string }) {
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
          [電報線就緒] 長官部門來電，依電碼於雷區執行佈雷。
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
        <span className="rounded-lg border border-[#1e293b] bg-[#0f141c] px-3 py-1.5 text-slate-400">
          {HOME_APP_VERSION}
        </span>
        <span className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-bold text-emerald-400">
          <Wifi size={14} className="shrink-0" />
          CONNECTED
        </span>
      </div>
    </motion.header>
  );
}
