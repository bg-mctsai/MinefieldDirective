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
    missionMapHook:
      '頭盔護目鏡上總映著一線異界藍光——他還在學怎麼不把害怕寫在臉上，但手已經敢跟著電報走。',
    codename: '白紙',
    serialNo: 'SN-MD-0001',
    background: [
      '家鄉那一批裡最後一個還能入伍的年輕人；頭盔邊緣磕缺、護目鏡常映出遠方裂隙的冷藍。臉上土灰擦不乾淨，眼神卻一天比一天不躲。',
      '口袋裡是一張被汗浸得發黃的全家福——錯一格全線連鎖的演習夜裡，他靠指緣摩挲相紙邊角撐過去。檔案註記：運氣偏高、紀律勉強；長官評語先別死，他自己補一句：「別讓照片變遺物。」',
    ],
    specialties: ['基礎電碼', '邊角先猜', '深呼吸'],
    personalItems: [
      { label: '略損的戰術頭盔', icon: 'tag' },
      { label: '汗漬發黃的全家福', icon: 'photo' },
      { label: '被翻爛的入伍守則', icon: 'note' },
    ],
    lines: [
      '我、我這步應該……對吧？',
      '看一眼全家福……好，呼吸完了，繼續讀碼。',
      '護目鏡裡那道藍光還在，代表後面的人還在等。',
    ],
    missionBriefByLevelId: {
      '5': '長廊像電報線，拉直了就不會自己打結。',
      '1': '第一戰別炫技，照表操課。',
    },
    missionBriefFallback: [
      '這關我沒必殺技，能活著把相紙帶回去就好。',
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
        '任務完成……我還活著，照片也還在口袋裡。',
        '這次運氣站我這邊，撤退！',
      ],
    },
  },
  {
    id: 'ada',
    name: '艾達',
    role: '電信專家',
    missionMapHook:
      '長年盯星火密碼讓她習慣用頻譜看世界——雜訊裡撈座標、在空間壓力異常前先一步起雞皮疙瘩的是儀器與直覺，不是幻聽。',
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
    codename: '幽靈頻率',
    serialNo: 'SN-MD-0003',
    background: [
      '第一次異界衝擊時她在台站裡；爆炸的相位餘波削過前庭，之後她只信頻譜上看得見的證據。長年解讀星火信號讓視界習慣「網格與波形」——不是什麼浪漫超能，是職業病與創傷疊在一起的專注。',
      '她能比旁人早半步察覺空間裡不對勁的能量壓力——那是儀器曲線與噬星者掠食前緣對齊後的讀數，不是聽見怪物說話。檔案註記：咖啡因血壓、螢幕反光過敏；戰場上比誰都冷靜。',
    ],
    specialties: ['雜訊過濾', '頻譜判讀', '即時電路維修'],
    personalItems: [
      { label: '半透電碼投影鏡片', icon: 'tag' },
      { label: '星火密碼解讀筆記', icon: 'note' },
      { label: '衝擊當日殘存的頻譜截圖', icon: 'photo' },
    ],
    lines: [
      '雜訊一濾，雷在哪就清楚。',
      '曲線一歪我就知道該繃緊——不是直覺，是讀數。',
    ],
    missionBriefByLevelId: {
      '5': '狹長地形：多一封電報，多一條退路。',
    },
    missionBriefFallback: [
      '把雜訊當敵人，濾掉就只剩座標。',
      '機率收斂前，別急著下第二手。',
      '這張圖我解析完了，跟我走。',
      '時序對了，雜訊也會變成背景音。',
      '頻段一抖就不是幻聽，是前線在付帳——交叉驗證兩條假設再下手。',
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
    skillDetail: '全息投影在腕上鋪出三角／六角網格；先找「地形騙人」的邊界，再把隊友腳步從扭曲空間邊緣拉回來。',
    missionMapHook:
      '頂尖地理學家出身——裂隙把地貌撕成錯覺時，她腦內的座標網比紙本地圖可靠。',
    codename: '地圖師',
    serialNo: 'SN-MD-0002',
    background: [
      '學界報告上她的名字還在，人卻只在戰區出沒。全息投影儀在腕上旋出三角與蜂巢格，口袋塞滿不同地形的偵測標——她習慣用座標替隊友踩雷。',
      '裂隙周邊的空間陷阱會拐人視線；她最恨「感覺對了」這種賭法。檔案註記：話少、筆尖快；誰踩進扭曲帶，她就用下一個標把誰拽回來。',
    ],
    specialties: ['全息格網', '隘口優先', '扭曲區判讀'],
    personalItems: [
      { label: '腕掛全息投影儀', icon: 'compass' },
      { label: '戰術口袋用偵測標', icon: 'tag' },
      { label: '戰區風景照（背面有座標）', icon: 'photo' },
    ],
    lines: [
      '地形不會說謊，說謊的是你的眼。',
      '網格亮起來了——跟我走，別踩進空間騙你的那一格。',
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
    skillDetail: '搭檔搜救犬「巴克」：超音波輔聽、背上是緊急備用地雷包；人類漏掉的氣味線索牠先聞到，先標可疑鄰格再交邏輯。',
    missionMapHook:
      '廢墟那次是巴克把他刨出來的——之後不用多話，一個眼神就能對上同一格座標。',
    codename: '雙子',
    serialNo: 'SN-MD-0004',
    background: [
      '制服磨得發白，膝肘補丁一層疊一層。巴克耳上掛著機械助聽器，專抓異界邊緣漏過來的超音波；背上小雷包不是帥，是怕斷線時沒得補。',
      '廢墟搜救夜裡，是巴克先刨到他。之後雷區裡不必講大道理——人指方向，狗給答案。檔案註記：對動物有耐心，對犯錯的人沒耐心。',
    ],
    specialties: ['氣味線索', '超音波輔聽', '戰場搜救節奏'],
    personalItems: [
      { label: '巴克用機械助聽耳罩', icon: 'tag' },
      { label: '犬背緊急備用地雷包', icon: 'note' },
      { label: '廢墟搜救後的任務合照', icon: 'photo' },
    ],
    lines: [
      '先聞可疑格，再談帥氣操作。',
      '巴克看我一眼我就懂——這格先標。',
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
        '巴克耳朵豎了——那幾格先標。',
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
    missionMapHook:
      '甲面上噬星者抓過的痕與焊補邊緣一樣清楚——乾谷據點他曾澆過最後一車漿，也親眼看裂隙把它啃穿。',
    codename: '城牆',
    serialNo: 'SN-MD-0005',
    background: [
      '鋼筋混凝土與連鎖反應在他眼里同一套語言；戰壕裡會默默遞根菸、話少的那種可靠。他穿最重的甲不是炫，是算過：多扛一瞬，後面就少賠一條命。',
      '乾谷據點有他親手澆的樑。異界推進那夜，梁斷人沒全撤——他記得是誰的名字沒回來。從此他嘴更硬、手更快：線不能在他面前整段塌。',
    ],
    specialties: ['應急加固', '連鎖阻斷', '帶隊節奏'],
    personalItems: [
      { label: '甲面焊補痕對照素描', icon: 'note' },
      { label: '應力計算尺', icon: 'tag' },
      { label: '乾谷工地舊安全帽貼紙', icon: 'photo' },
    ],
    lines: [
      '結構鬆一格，全線跟著晃。',
      '先撐住連鎖，再談漂亮——我背得起，你們別搶著塌。',
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
