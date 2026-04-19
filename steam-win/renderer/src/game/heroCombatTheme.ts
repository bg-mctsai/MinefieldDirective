/**
 * 戰鬥畫面依幹員切換的 Tailwind class 片段（集中維護，避免全專案硬編碼）
 */
export type HeroCombatThemeId = 'xiaoming' | 'laozhang' | 'ada' | 'bobby' | 'selina';

export function resolveHeroCombatThemeId(heroId: string): HeroCombatThemeId {
  if (heroId === 'laozhang') return 'laozhang';
  if (heroId === 'ada') return 'ada';
  if (heroId === 'bobby') return 'bobby';
  if (heroId === 'selina') return 'selina';
  return 'xiaoming';
}

export interface HeroCombatTheme {
  /** GameView 最外層 */
  root: string;
  /** 狀態訊息條外框 */
  statusBarWrap: string;
  /** 任務進度卡（與 GAME_HEADER_CARD 疊加） */
  headerProgressCard: string;
  /** 返回鈕 hover 邊 */
  headerBackHover: string;
  /** 標題旁任務徽章（SVG `currentColor`） */
  headerMissionMark: string;
  /** 徽章容器：微光／邊，與幹員主色呼應 */
  headerMissionMarkWrap: string;
  /** 下一關主鈕（維持可讀對比，僅微調陰影） */
  headerNextLevel: string;
  /** 長官電報列外框 */
  telegraphWrap: string;
  /** 電報槽選中態 */
  telegraphDigitSelected: string;
  /** 電報槽未選 hover */
  telegraphDigitIdle: string;
}

const XIAOMING: HeroCombatTheme = {
  root: 'bg-slate-950 selection:bg-amber-500/30',
  statusBarWrap: 'border-slate-700/90 bg-slate-900/95',
  headerProgressCard: 'border-slate-800 bg-slate-900',
  headerBackHover: 'hover:border-amber-500/60 hover:text-amber-400',
  headerMissionMark: 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.35)]',
  headerMissionMarkWrap: 'shadow-[0_0_18px_rgba(245,158,11,0.14)] ring-1 ring-amber-500/20',
  headerNextLevel: 'bg-emerald-600 shadow-emerald-900/35 hover:bg-emerald-500',
  telegraphWrap: 'border-slate-800 bg-slate-900',
  telegraphDigitSelected: 'border-amber-400 bg-amber-600 text-white shadow-lg shadow-amber-900/40',
  telegraphDigitIdle: 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-amber-400',
};

/** 戰地測繪：橄欖／森綠色調 */
const LAOZHANG: HeroCombatTheme = {
  root: 'bg-slate-950 selection:bg-emerald-500/30 [background-image:radial-gradient(ellipse_at_35%_0%,rgba(16,185,129,0.09),transparent_52%)]',
  statusBarWrap: 'border-emerald-800/55 bg-slate-900/95 shadow-[0_0_18px_rgba(16,185,129,0.06)]',
  headerProgressCard: 'border-emerald-900/50 bg-slate-900',
  headerBackHover: 'hover:border-emerald-500/55 hover:text-emerald-300',
  headerMissionMark: 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.35)]',
  headerMissionMarkWrap: 'shadow-[0_0_18px_rgba(16,185,129,0.12)] ring-1 ring-emerald-500/20',
  headerNextLevel: 'bg-emerald-600 shadow-emerald-900/35 hover:bg-emerald-500',
  telegraphWrap: 'border-emerald-900/50 bg-slate-900',
  telegraphDigitSelected: 'border-emerald-400 bg-emerald-700 text-white shadow-lg shadow-emerald-950/40',
  telegraphDigitIdle: 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-emerald-300',
};

const ADA: HeroCombatTheme = {
  root: 'bg-slate-950 selection:bg-sky-500/35 [background-image:radial-gradient(ellipse_at_50%_0%,rgba(14,165,233,0.08),transparent_50%)]',
  statusBarWrap: 'border-sky-600/50 bg-slate-900/95 shadow-[0_0_20px_rgba(14,165,233,0.08)]',
  headerProgressCard: 'border-sky-700/60 bg-slate-900 shadow-[0_0_24px_rgba(16,185,129,0.06)]',
  headerBackHover: 'hover:border-sky-400/70 hover:text-sky-300',
  headerMissionMark: 'text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.4)]',
  headerMissionMarkWrap: 'shadow-[0_0_20px_rgba(14,165,233,0.16)] ring-1 ring-sky-400/25',
  headerNextLevel: 'bg-emerald-600 shadow-emerald-900/40 hover:bg-emerald-500',
  telegraphWrap: 'border-sky-700/55 bg-slate-900 shadow-[0_0_18px_rgba(34,211,238,0.07)]',
  telegraphDigitSelected: 'border-sky-400 bg-sky-600 text-white shadow-lg shadow-sky-900/45',
  telegraphDigitIdle: 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-sky-300',
};

/** 搜救：暖金／琥珀 */
const BOBBY: HeroCombatTheme = {
  root: 'bg-slate-950 selection:bg-yellow-500/25 [background-image:radial-gradient(ellipse_at_60%_10%,rgba(234,179,8,0.07),transparent_48%)]',
  statusBarWrap: 'border-amber-800/50 bg-slate-900/95',
  headerProgressCard: 'border-amber-900/45 bg-[#0f1412]',
  headerBackHover: 'hover:border-yellow-500/50 hover:text-yellow-300',
  headerMissionMark: 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.35)]',
  headerMissionMarkWrap: 'shadow-[0_0_18px_rgba(234,179,8,0.12)] ring-1 ring-yellow-400/20',
  headerNextLevel: 'bg-emerald-600 shadow-emerald-900/35 hover:bg-emerald-500',
  telegraphWrap: 'border-amber-900/50 bg-[#0f1412]',
  telegraphDigitSelected: 'border-yellow-400 bg-amber-600 text-white shadow-lg shadow-amber-950/40',
  telegraphDigitIdle: 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-yellow-300',
};

const SELINA: HeroCombatTheme = {
  /** 與其他幹員一致：僅柔光、無斜線網格（避免僅老張畫面出現條紋底） */
  root: 'bg-slate-950 selection:bg-orange-500/35 [background-image:radial-gradient(ellipse_at_80%_20%,rgba(234,88,12,0.12),transparent_45%)]',
  statusBarWrap: 'border-amber-900/50 bg-slate-900/95',
  headerProgressCard: 'border-amber-900/55 bg-[#0f1210]',
  headerBackHover: 'hover:border-orange-500/55 hover:text-orange-300',
  headerMissionMark: 'text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.35)]',
  headerMissionMarkWrap: 'shadow-[0_0_18px_rgba(234,88,12,0.14)] ring-1 ring-orange-400/22',
  headerNextLevel: 'bg-amber-700 shadow-amber-950/40 hover:bg-amber-600',
  telegraphWrap: 'border-amber-900/60 bg-[#0f1210]',
  telegraphDigitSelected: 'border-orange-400 bg-orange-700 text-white shadow-lg shadow-orange-950/50',
  telegraphDigitIdle: 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-800/90 hover:text-orange-300',
};

/** 賽琳娜＝測繪（綠）；老張＝結構／加固（橙）—與職業綁定，非與 id 字面一致 */
export function getHeroCombatTheme(heroId: string): HeroCombatTheme {
  if (heroId === 'laozhang') return SELINA;
  if (heroId === 'ada') return ADA;
  if (heroId === 'bobby') return BOBBY;
  if (heroId === 'selina') return LAOZHANG;
  return XIAOMING;
}
