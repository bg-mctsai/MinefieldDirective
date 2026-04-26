import { motion } from 'motion/react';
import { Crosshair, Settings, Users } from 'lucide-react';
import { useState } from 'react';
import { HOME_MENU_BTN_CLASS } from './constants';
import type { HomeNavigate } from './types';

export function HomeMainMenu({
  onNavigate,
  onMenuHover,
  onOpenSettings,
}: {
  onNavigate: (to: HomeNavigate) => void;
  onMenuHover: () => void;
  onOpenSettings: () => void;
}) {
  const [activeMenu, setActiveMenu] = useState<HomeNavigate | 'settings' | null>(null);
  const getMenuClass = (menu: HomeNavigate | 'settings') =>
    `${HOME_MENU_BTN_CLASS} ${
      activeMenu === menu
        ? '!border-[#F59E0B] !shadow-[0_0_24px_rgba(245,158,11,0.35)] -translate-y-0.5'
        : ''
    }`;

  return (
    <motion.nav
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.12, duration: 0.45 }}
      className="flex flex-col gap-3 lg:col-span-4"
      aria-label="主選單"
    >
      {/* 填滿左欄上方視覺：戰術選單台（與按鈕同欄；版面用 lg:items-start 頂對齊） */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800/85 bg-gradient-to-br from-[#101722]/95 via-[#0c1018]/95 to-[#080b10]/95 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:px-5 lg:py-4">
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 -left-4 h-24 w-40 rounded-full bg-cyan-500/8 blur-2xl" />
        <div className="relative border-l-2 border-emerald-500/35 pl-3 lg:pl-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-400/95">
                Tactical Route Matrix
              </p>
              <p className="mt-1 text-xs font-bold text-slate-400">主選單 · 指揮連線就緒</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-md border border-cyan-500/20 bg-cyan-500/5 px-2 py-1">
              <span className="flex gap-1.5" aria-hidden>
                <span className="home-menu-led-dot size-1.5 rounded-full bg-emerald-400" />
                <span className="home-menu-led-dot size-1.5 rounded-full bg-cyan-400" />
                <span className="home-menu-led-dot size-1.5 rounded-full bg-amber-400" />
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-300/85">
                Sync
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 font-mono text-[10px] text-slate-600">
            <span className="text-emerald-600/90">0xA4F2</span>
            <span className="text-slate-700">│</span>
            <span>CMD-LINK // BASE-07</span>
            <span className="text-slate-700">│</span>
            <span className="text-cyan-700/90">ROUTE-A</span>
          </div>
          <div className="mt-2 h-px w-full bg-gradient-to-r from-emerald-500/25 via-slate-700/50 to-transparent" />
          <svg className="mt-2 h-9 w-full text-emerald-500/35" viewBox="0 0 280 36" preserveAspectRatio="none" aria-hidden>
            <path
              d="M0 22 L28 12 L56 24 L84 8 L112 26 L140 14 L168 28 L196 10 L224 22 L252 16 L280 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
            />
            <line x1="0" y1="30" x2="280" y2="30" stroke="currentColor" strokeOpacity="0.5" strokeWidth="0.75" />
            {Array.from({ length: 12 }, (_, i) => (
              <line
                key={i}
                x1={12 + i * 23}
                y1="30"
                x2={12 + i * 23}
                y2={i % 4 === 0 ? 22 : 26}
                stroke="currentColor"
                strokeOpacity="0.45"
                strokeWidth="0.75"
              />
            ))}
          </svg>
        </div>
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.985 }}
        onMouseEnter={() => {
          onMenuHover();
          setActiveMenu('mission');
        }}
        onMouseLeave={() => setActiveMenu(null)}
        onFocus={() => setActiveMenu('mission')}
        onBlur={() => setActiveMenu(null)}
        onClick={() => onNavigate('mission')}
        className={getMenuClass('mission')}
      >
        <span className="flex items-center gap-3">
          <Crosshair className="text-[#F59E0B]" size={22} />
          <span>
            <span className="block text-lg text-[#F59E0B]">[ 開始行動 ]</span>
            <span className="text-sm font-bold text-slate-500">Mission Start · 關卡與地圖</span>
          </span>
        </span>
      </motion.button>

      <motion.button
        type="button"
        whileTap={{ scale: 0.985 }}
        onMouseEnter={() => {
          onMenuHover();
          setActiveMenu('hero');
        }}
        onMouseLeave={() => setActiveMenu(null)}
        onFocus={() => setActiveMenu('hero')}
        onBlur={() => setActiveMenu(null)}
        onClick={() => onNavigate('hero')}
        className={getMenuClass('hero')}
      >
        <span className="flex items-center gap-3">
          <Users className="text-slate-400 group-hover:text-[#F59E0B]" size={22} />
          <span>
            <span className="block text-lg">[ 角色整備 ]</span>
            <span className="text-sm font-bold text-slate-500">Hero Gallery</span>
          </span>
        </span>
      </motion.button>

      <motion.button
        type="button"
        whileTap={{ scale: 0.985 }}
        onMouseEnter={() => {
          onMenuHover();
          setActiveMenu('settings');
        }}
        onMouseLeave={() => setActiveMenu(null)}
        onFocus={() => setActiveMenu('settings')}
        onBlur={() => setActiveMenu(null)}
        onClick={onOpenSettings}
        className={getMenuClass('settings')}
      >
        <span className="flex items-center gap-3">
          <Settings className="text-slate-400 group-hover:text-[#F59E0B]" size={22} />
          <span>
            <span className="block text-lg">[ 系統設定 ]</span>
            <span className="text-sm font-bold text-slate-500">Settings</span>
          </span>
        </span>
      </motion.button>
    </motion.nav>
  );
}
