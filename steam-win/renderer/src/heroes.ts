/** 工兵動態台詞觸發類型 */
export type HeroBarrageTrigger =
  | 'opening'
  | 'lastTen'
  | 'idle'
  | 'good'
  | 'bad'
  | 'victory';

export type HeroBarrageLines = Record<HeroBarrageTrigger, string[]>;

export type HeroPersonalItemIcon = 'note' | 'tag' | 'photo' | 'compass';

export interface HeroPersonalItem {
  label: string;
  icon: HeroPersonalItemIcon;
}

/** 整備檔案與對局 HUD 共用：技能名短、詳情可放 tooltip 或檔案內文 */
export interface HeroCombatSkill {
  name: string;
  detail: string;
  /** 對局 HUD／整備：圖示鍵，見 `game/heroSkillHudIcons.tsx` */
  hudIcon?: 'mails' | 'activity';
}

export interface HeroDef {
  id: string;
  name: string;
  role: string;
  skillName?: string;
  skillDetail?: string;
  /** 若填寫則整備／HUD 優先使用（可多段被動）；與 skillName 二擇一時以此為準 */
  combatSkills?: HeroCombatSkill[];
  /** 作戰地圖幹員條：不寫機制數值，僅職能／氣氛一句 */
  missionMapHook?: string;
  /** 首頁 Hero Spotlight 隨機切換的引言池 */
  lines: string[];
  /** 軍事檔案：呼號（CODENAME） */
  codename?: string;
  /** 軍事檔案：序號 */
  serialNo?: string;
  /** 軍事檔案：背景描述（1～2 段） */
  background?: string[];
  /** 軍事檔案：專長標籤 */
  specialties?: string[];
  /** 軍事檔案：私人小物件（icon + 標籤），用於 Dossier「PERSONAL EFFECTS」段 */
  personalItems?: HeroPersonalItem[];
  /** 戰鬥內動態台詞：六種觸發各 ≥ 2 句 */
  barrage?: HeroBarrageLines;
  /** 作戰地圖關卡預覽：依 levelId 一句戰術台詞（key 為字串化的 levelId） */
  missionBriefByLevelId?: Record<string, string>;
  /** 無專屬句時輪播（建議固定 5 句，供作戰地圖幹員條輪播滿檔） */
  missionBriefFallback: string[];
}

export const HEROES: HeroDef[] = [
  {
    id: 'xiaoming',
    name: '小明',
    role: '新兵',
    skillName: '無',
    skillDetail: '全靠運氣。',
    codename: 'ROOKIE-07',
    serialNo: 'SN-MD-0001',
    background: [
      '入伍第一天就被丟進雷區模擬，教官只丟一句「錯一格全線連鎖」——他至今還搞不清楚自己怎麼活下來的。',
      '檔案註記：運氣指數偏高，紀律指數勉強及格；長官評語：「先別死就好。」',
    ],
    specialties: ['基礎電碼', '邊角先猜', '深呼吸'],
    personalItems: [
      { label: '幸運符（塑膠）', icon: 'tag' },
      { label: '被翻爛的入伍守則', icon: 'note' },
      { label: '家鄉地圖殘片', icon: 'compass' },
    ],
    lines: [
      '我、我這步應該……對吧？',
      '運氣也是實力……大概。',
      '先看邊角，教官是這樣吼的。',
    ],
    missionBriefByLevelId: {
      '5': '長廊像電報線，拉直了就不會自己打結。',
      '1': '第一戰別炫技，照表操課。',
    },
    missionBriefFallback: [
      '這關我沒必殺技，能活著走完就好。',
      '邊角先壓住，中腹才不會亂。',
      '數字對上之前，先跟雷區賭個小運氣。',
      '每一步都當複誦口令：想清楚再踩。',
      '慌的時候先吐一口氣，表還在就不算輸。',
    ],
    barrage: {
      opening: [
        '電報來了……我、我照讀喔！',
        '一格一格來，這不是演習……吧？',
      ],
      lastTen: [
        '十秒！先下最有把握那格！',
        '時間要沒了，別再想太久！',
      ],
      idle: [
        '時間不等人，我也會怕啊。',
        '電碼擱著會涼，快動。',
      ],
      good: [
        '欸？這格居然對了！',
        '可以可以，繼續混下去。',
      ],
      bad: [
        '完了完了……下一格救一下！',
        '炸了！我下次先看鄰格！',
      ],
      victory: [
        '任務完成……我還活著！',
        '這次運氣站我這邊，撤退！',
      ],
    },
  },
  {
    id: 'ada',
    name: '艾達',
    role: '電信專家',
    missionMapHook:
      '與戰場訊號、長官電報最熟——雜訊裡撈座標、干擾裡咬節拍都是她的日常。',
    combatSkills: [
      {
        name: '多路併收',
        hudIcon: 'mails',
        detail: '同時四道待辦電碼（4 選 2），每回合從中選兩格佈署。',
      },
      {
        name: '雜訊緩讀',
        hudIcon: 'activity',
        detail: '信號干擾區內，電報數字輪播間隔延長一倍，較易鎖定讀值。',
      },
    ],
    codename: 'CIPHER-03',
    serialNo: 'SN-MD-0003',
    background: [
      '後門與雜訊在她眼里只是同一種語法；三秒內能把亂流濾成座標。',
      '檔案註記：咖啡因血壓、螢幕反光過敏，戰場上比誰都冷靜。',
    ],
    specialties: ['雜訊過濾', '機率推估', '即時電路維修'],
    personalItems: [
      { label: '客製化烙鐵筆', icon: 'tag' },
      { label: '電路板書籤', icon: 'note' },
      { label: '匿名節點相片', icon: 'photo' },
    ],
    lines: [
      '雜訊一濾，雷在哪就清楚。',
      '給我一秒，風險圖就出來。',
    ],
    missionBriefByLevelId: {
      '5': '狹長地形：多一封電報，多一條退路。',
    },
    missionBriefFallback: [
      '把雜訊當敵人，濾掉就只剩座標。',
      '機率收斂前，別急著下第二手。',
      '這張圖我解析完了，跟我走。',
      '時序對了，雜訊也會變成背景音。',
      '交叉驗證兩條假設，別單押一條波形。',
    ],
    barrage: {
      opening: [
        '訊號收齊，開始解。',
        '把節奏交給我，你只要按下去。',
      ],
      lastTen: [
        '剩十秒。先處理機率最高那格。',
        '時序緊了，跟著我的節拍。',
      ],
      idle: [
        '邏輯收斂中，下一步別亂。',
        '畫面停太久了，做個決定。',
      ],
      good: [
        '參數對上了，繼續推。',
        '收斂得很乾淨，不錯。',
      ],
      bad: [
        '參數崩了，重算！',
        '推論偏差。馬上修正鄰格。',
      ],
      victory: [
        '結果輸出：任務達標。',
        '所有座標歸零，收工。',
      ],
    },
  },
  {
    id: 'selina',
    name: '賽琳娜',
    role: '戰地測繪師',
    skillName: '地形直覺',
    skillDetail: '閱讀等高線與隘口習慣成反射；雷區裡先找「地形騙人」的邊界。',
    codename: 'SURVEY-12',
    serialNo: 'SN-MD-0002',
    background: [
      '她畫過的戰區地圖比新兵吃過的便當還多；閉眼能想起哪個坡會把人視線帶偏。',
      '檔案註記：話少、筆尖快，最討厭別人跟她賭「感覺」。',
    ],
    specialties: ['等高線判讀', '隘口優先', '風向與視線死角'],
    personalItems: [
      { label: '捲爛的防水圖筒', icon: 'compass' },
      { label: '退色測距繩', icon: 'tag' },
      { label: '戰區風景照（背面有座標）', icon: 'photo' },
    ],
    lines: [
      '地形不會說謊，說謊的是你的眼。',
      '先看坡向，再看雷。',
    ],
    missionBriefByLevelId: {
      '5': '長廊是陷阱地形：兩端一收，中段就不會亂飄。',
    },
    missionBriefFallback: [
      '把盤面當成等高線：先找脊線與谷線。',
      '別直著衝，地形會把你帶去錯格。',
      '邊界格先鎖，中央就不會騙你。',
      '中段最愛騙視線：抬頭一回頭就換一個錯覺。',
      '把「看起來順眼」拿掉，留下最醜的那條線。',
    ],
    barrage: {
      opening: [
        '地圖在腦里，先看輪廓。',
        '我畫過這種隘口，別急。',
      ],
      lastTen: [
        '十秒，先救地形最硬那段。',
        '收尾前別亂切線，會斷層。',
      ],
      idle: [
        '停太久，等高線會糊掉。',
        '下一步要對上稜線，不是情緒。',
      ],
      good: [
        '這格落在稜上，漂亮。',
        '視角對了，雷就藏不住。',
      ],
      bad: [
        '你被坡影騙了，重畫。',
        '這步像走斷崖，撤回。',
      ],
      victory: [
        '線收乾淨，地形成。',
        '這盤圖我簽名了。',
      ],
    },
  },
  {
    id: 'bobby',
    name: '波比',
    role: '搜救犬訓練員',
    skillName: '靈敏嗅覺',
    skillDetail: '人類漏掉的「氣味線索」他先聞到：先標可疑鄰格，再交給邏輯收尾。',
    codename: 'K9-RESC-09',
    serialNo: 'SN-MD-0004',
    background: [
      '狗鼻子信得過，人嘴說的反而要驗證；雷區裡他先聽風向，再聽直覺。',
      '檔案註記：對動物有耐心，對犯錯的人沒耐心。',
    ],
    specialties: ['氣味線索', '鄰格優先嗅', '戰場搜救節奏'],
    personalItems: [
      { label: '磨損的哨子', icon: 'tag' },
      { label: '犬用護爪膏（小罐）', icon: 'note' },
      { label: '任務合照：狗比人上鏡', icon: 'photo' },
    ],
    lines: [
      '先聞可疑格，再談帥氣操作。',
      '你的腦子會騙你，鼻子比較誠實。',
    ],
    missionBriefByLevelId: {
      '5': '長廊最會藏「味道」：先掃兩端。',
    },
    missionBriefFallback: [
      '鄰格有異味就先標，別硬猜。',
      '線索不夠就換一排聞。',
      '我帶狗，你帶腦，分工。',
      '風向一改，同一格也要重新聞一遍。',
      '標完可疑格就交給腦袋收尾，別跟鼻子講道理。',
    ],
    barrage: {
      opening: [
        '先掃一圈，別急著下主菜。',
        '我聞到不對勁的鄰格了。',
      ],
      lastTen: [
        '十秒，先咬最可疑那格。',
        '時間緊，先跟線索走。',
      ],
      idle: [
        '停太久，線索會散掉。',
        '下一步，換一條氣味線。',
      ],
      good: [
        '這格味道對了，繼續。',
        '標得準，像狗一樣可靠。',
      ],
      bad: [
        '你無視線索了，重聞。',
        '這步錯味，撤回。',
      ],
      victory: [
        '搜救成功，收隊。',
        '線索全對，回去給狗加肉。',
      ],
    },
  },
  {
    id: 'laozhang',
    name: '老張',
    role: '結構工程師',
    skillName: '加固模組',
    skillDetail: '錯誤發生時可抵銷一次爆炸並移除出錯的雷。每關限一次。',
    codename: 'STRUCT-01',
    serialNo: 'SN-MD-0005',
    background: [
      '鋼筋混凝土與連鎖反應在他眼里同一套結構語言；比起平板，他更信「撐住一瞬」的工法。',
      '檔案註記：嘴硬、手快，從沒讓線在他面前整段塌掉。',
    ],
    specialties: ['應急加固', '連鎖阻斷', '帶隊節奏'],
    personalItems: [
      { label: '應力計算尺', icon: 'tag' },
      { label: '現場素描本', icon: 'note' },
      { label: '舊工地安全帽貼紙', icon: 'photo' },
    ],
    lines: [
      '結構鬆一格，全線跟著晃。',
      '先撐住連鎖，再談漂亮。',
    ],
    missionBriefByLevelId: {
      '5': '長廊最會把人逼急；先加固最危險那段。',
    },
    missionBriefFallback: [
      '這種盤面，先活著走完再談漂亮。',
      '後手留好，炸一次不致命。',
      '別跟雷區講道理，跟它講結構。',
      '壓力集中在外框時，中央往往只是假象。',
      '錯一次還能撐，同錯兩次就是設計問題。',
    ],
    barrage: {
      opening: [
        '別慌，我先把你的節奏撐住。',
        '深呼吸。第一格，慢慢來。',
      ],
      lastTen: [
        '剩十秒，做你最有把握那步。',
        '時間咬到後頸了，撐住。',
      ],
      idle: [
        '慢一拍，不要折在這。',
        '想清楚再動，但別想到天黑。',
      ],
      good: [
        '穩，就這樣。',
        '這手像灌漿，實在。',
      ],
      bad: [
        '炸了，自己站起來。',
        '別再失手，這條線我幫你撐一次。',
      ],
      victory: [
        '結構沒塌，任務算你的。',
        '全線收斂，回基地。',
      ],
    },
  },
];

const LEGACY_HERO_ID: Record<string, string> = {
  recruit: 'xiaoming',
  ellie: 'ada',
  buck: 'laozhang',
};

const STORAGE_KEY = 'md:selectedHero';

/** 長官電報同時待辦道數（每回合仍從中選 2 道執行）：一般幹員 3；艾達 4。 */
export function telegraphHandSlotCount(heroId: string): number {
  return heroId === 'ada' ? 4 : 3;
}

export function getStoredHeroId(): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    const mapped = v ? (LEGACY_HERO_ID[v] ?? v) : null;
    if (mapped && HEROES.some((h) => h.id === mapped)) return mapped;
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

export function getHeroDef(id: string): HeroDef {
  return HEROES.find((h) => h.id === id) ?? HEROES[0];
}

/** 整備／對局右上角技能列（老張另有「加固模組」專屬 UI，不經此列） */
export function getHeroCombatSkills(hero: HeroDef): HeroCombatSkill[] {
  if (hero.combatSkills && hero.combatSkills.length > 0) return hero.combatSkills;
  if (hero.skillName) {
    const label = hero.skillName.trim();
    if (label === '無') return [];
    return [{ name: hero.skillName, detail: hero.skillDetail ?? '' }];
  }
  return [];
}

/** 作戰地圖：依目前幹員與預覽關卡 id 解析一句戰術台詞 */
export function resolveMissionBriefLine(heroId: string, levelId: number): string {
  const hero = getHeroDef(heroId);
  const specific = hero.missionBriefByLevelId?.[String(levelId)];
  if (specific) return specific;
  const fb = hero.missionBriefFallback;
  if (!fb.length) return '準備好了就出擊。';
  return fb[Math.abs(levelId) % fb.length];
}

const MISSION_BRIEF_CAROUSEL_MIN = 5;
const MISSION_BRIEF_CAROUSEL_MAX = 5;

/**
 * 作戰地圖幹員條：輪播用 5 句（關卡專屬句優先，其餘接 fallback／檔案引言，去重；不足才補位）。
 */
export function resolveMissionBriefCarouselLines(heroId: string, levelId: number): string[] {
  const hero = getHeroDef(heroId);
  const pool: string[] = [];
  const pushUnique = (s: string | undefined) => {
    const t = s?.trim();
    if (!t || pool.includes(t)) return;
    pool.push(t);
  };

  pushUnique(hero.missionBriefByLevelId?.[String(levelId)]);
  for (const s of hero.missionBriefFallback) pushUnique(s);
  for (const s of hero.lines ?? []) pushUnique(s);

  for (const pad of ['準備好了就出擊。', '待命：接獲命令後出擊。', '一格一格，照程序走。']) {
    if (pool.length >= MISSION_BRIEF_CAROUSEL_MIN) break;
    pushUnique(pad);
  }
  let padIdx = 0;
  while (pool.length < MISSION_BRIEF_CAROUSEL_MIN) {
    padIdx += 1;
    pool.push(`（待命 ${padIdx}）`);
  }

  return pool.slice(0, MISSION_BRIEF_CAROUSEL_MAX);
}
