export interface HeroDef {
  id: string;
  name: string;
  role: string;
  skillName?: string;
  skillDetail?: string;
  lines: string[];
}

export const HEROES: HeroDef[] = [
  {
    id: 'recruit',
    name: '新兵',
    role: '工兵（預設）',
    lines: [
      '電報碼譯錯一格，全線都可能連鎖炸飛。',
      '先看邊角，再推中腹。',
      '長官電報照做，雷區才不會失控。',
    ],
  },
  {
    id: 'ellie',
    name: '艾莉',
    role: '工程師',
    skillName: '邏輯掃描',
    skillDetail: '標記盤面上最安全或必放雷的一格。冷卻 3 回合。',
    lines: [
      '電報雜訊一濾掉，雷在哪裡就清楚。',
      '給我一秒，我就能把風險畫出來。',
    ],
  },
  {
    id: 'buck',
    name: '巴克',
    role: '老兵',
    skillName: '緊急拆除',
    skillDetail: '錯誤發生時可抵銷一次爆炸並移除出錯的雷。每關限一次。',
    lines: [
      '慌戰場一分，就多賠上一命。',
      '電報照抄也會失手，後手得自己留。',
    ],
  },
];

const STORAGE_KEY = 'md:selectedHero';

export function getStoredHeroId(): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && HEROES.some((h) => h.id === v)) return v;
  } catch {
    /* ignore */
  }
  return HEROES[0].id;
}

export function setStoredHeroId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
