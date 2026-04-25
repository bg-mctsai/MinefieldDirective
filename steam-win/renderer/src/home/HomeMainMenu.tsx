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
      className="flex flex-col gap-3 lg:col-span-7"
      aria-label="主選單"
    >
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
            <span className="text-xs font-bold text-slate-500">Mission Start · 關卡與地圖</span>
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
            <span className="text-xs font-bold text-slate-500">Hero Gallery</span>
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
            <span className="text-xs font-bold text-slate-500">Settings</span>
          </span>
        </span>
      </motion.button>
    </motion.nav>
  );
}
