import type { FirepowerDigitWeightMode } from './game/mineCombatVisual';
import type { HeroSkillHudIconId } from './game/heroSkillHudIcons';
import { isHeroIdUnlocked, getEffectiveUnlockedHeroIds } from './game/heroUnlockedStorage';

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
  /** 對局 HUD／整備：圖示鍵，見 `game/heroSkillHudIcons.tsx`（全技能唯一） */
  hudIcon?: HeroSkillHudIconId;
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
        '電報來了……先點數字、再點格，手指別滑……',
        '一格一格來——護目鏡外藍光又閃了，照表讀，別亂。',
      ],
      lastTen: [
        '十秒了欸……快把退路弄開，別堵在雷前面！',
        '倒數在咬人——挑最有把握那格，快！',
      ],
      idle: [
        '時間不等人啊……我也會怕欸。',
        '電碼擱太久會涼，動一下嘛。',
      ],
      good: [
        '欸？這格居然對了！',
        '可以可以，先這樣混下去。',
      ],
      bad: [
        '完了完了……下一格救一下！',
        '炸了！我下次先把鄰格看清！',
      ],
      victory: [
        '收工……我還活著，照片也在口袋裡。',
        '這次運氣站我這邊，撤！',
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
        hudIcon: 'filter',
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
      // 第 1 章：演習帶／標準流程（卷宗戰術頻道輪播）
      '1': '頻段穩定——先把校準走一遍，急只會把雜訊當成訊號。',
      '2': '演習也是戰：電碼對上再踩座標，別讓手指跑在腦子前面。',
      '3': '這章還允許你犯錯；把錯誤留在波形以外的地方。',
      '4': '讀數重複三次不丟人，第三次還賭運氣才丟人。',
      '5': '狹長地形：多一封電報，多一條退路。',
      '6': '節點一格一格亮；我跟曲線，你跟我的節拍。',
      '7': '倒數不隱形，它寫在時基上——對準再下手。',
      '8': '封鎖線最後一關：頻譜乾了，你才敢押。',
      // 第 2 章：東向走廊
      '9': '東向長廊像同軸纜：中段一扭，兩頭訊號一起糊。',
      '10': '先鎖走廊兩端的參考點，中央就不敢騙你。',
      '11': '拉距離不拉頻寬；一格一格塞容量才紮實。',
      '12': '這裡最愛「看起來順」的假峰值：切帶寬，濾掉它。',
      '13': '藍光閃一下不是演出，是相位在叫你讀表。',
      '14': '收中段的時候別分心聽雜音，聽時鐘。',
      '15': '把撤退路徑也算進電報；頻道另一頭還有人睡不著。',
      '16': '關口：把峰值壓下去，讓真正的訊號浮上來。',
      // 第 3 章：鋸齒防線
      '17': '鋸齒盤面是多路反射；別盯一顆齒就忘整條邊。',
      '18': '左右都要守頻寬；漏一側，另一側曲線會裝沒事。',
      '19': '中間最暖也最騙人；冷暖交界才是雜訊湧進口。',
      '20': '多層雷帶像疊頻；上層乾淨不代表底層沒暗流。',
      '21': '節奏放慢半拍不是懦，是給邏輯養數據。',
      '22': '全景掃一輪再下刀；單點放大會把噪點當特徵。',
      '23': '扛反撲前先量相位；敵動你也動，訊號就跟不上。',
      '24': '防線收口：讓每顆假齒都被數學咬死。',
      // 第 4 章：右翼包抄
      '25': '包抄是同時兩條鏈路：一條牽制、一條收斂，別只用一條腦迴路。',
      '26': '右翼先壓制，左路才有空窗濾雜訊。',
      '27': '前沿不是衝鋒線，是觀測線；讀清楚再佈雷。',
      '28': '火力引導靠座標不靠氣勢；氣勢會讓波形失真。',
      '29': '中段交叉驗證：兩個假設打架時，站第三方頻率上看。',
      '30': '牽制帶夠寬，主攻才不會被自己人的噪訊淹沒。',
      '31': '別讓包抄變圍觀；每一步都要能在頻譜上畫線。',
      '32': '把邊界當門檻——跨過去就沒有藉口頻道。',
      // 第 5 章：斷線封鎖
      '33': '斷線北向糊成一片。校準一條鏈路，等於掐斷另一條——頻寬不夠兩全。',
      '34': '廊道兩側方波大面積死寂。別漂移，對齊節點；時基在用秒換命。',
      '35': '兩路求救同時進線，頻寬只夠並一條。選吧。沒選到的那路，會安靜。',
      '36': '十字口阻抗在飆。一格鬆，後方呼號全反射。紅筆別抖——抖了曲線就糊。',
      '37': '據點亮了，撤離底線在塌。窄帶裡擠進非任務頻段——信噪比已經危險。',
      '38': '切六角殘陣。別單點賭座標，兩側交叉驗證；死線在咬時基。',
      '39': '補給週期斷了，頻譜缺電。節點送來的不是數據，是最後一次對時。',
      '40': '核心鎖死。你圈下的這條盾，是另外四段沉默換來的——頻譜不會安慰你。',
      // 第 6 章：深海要塞
      '41': '雙錨自激。密碼鋼印有重疊——不是巧合，有人動過我的後台。',
      '42': '廢雷補入變快。地形代碼在外送我們的脈衝——有人在轉發座標。',
      '43': '縱深被假信號塞滿。級聯放大在用廢物佔格，想把艙底頻寬噎死。',
      '44': '錨 A、錨 B 在打架。信任焊縫斷了。懷疑我可以——先把讀數對上。',
      '45': '跳頻在中繼點自激。抓住這段頻譜，逼源頭露形。',
      '46': '兩點拉力到頂。這不是噬星者手法，是人類工兵——對方很懂你的節奏。',
      '47': '深度佈雷不是堆料。每下一步廢雷咬死一格——濾偽峰，別跟雜訊跑。',
      '48': '雙峰疊成主峰。洩密終端鎖定了：前方深醫艙。把座標釘死。',
      // 第 7 章：雜訊審判
      '49': '審訊帶天線自激，電碼在跳。監聽台開著——先鎖讀值再下格。',
      '50': '假峰值掃過來。別信第一個數，那是給審判席看的煙霧。',
      '51': '雙波疊影裡有密鑰殘段。幫我把清白波形釘出來——要能自證。',
      '52': '電磁陣在餵假指令。每一手都要在頻譜上站得住。',
      '53': '干擾錐到頂，廢雷混進來。別讓雜訊替你簽字認罪。',
      '54': '磁暴環收口。據點空了，筆就落下——先填節點，再談辯護。',
      '55': '稜鏡把訊號折成謊。兩側交叉驗證，別讓假碼寫進我的檔案。',
      '56': '密鑰最後一截在這。錯一格，這間監聽室就沒有出口。',
      // 第 8 章：無名代價
      '57': '第一顆定時雷在走。頻道外有人等排程表——先對時基，再談他們是誰。',
      '58': '單核引爆倒數。爆心底下是礦區帳篷——先拆引信窗口，情緒之後算。',
      '59': '兩顆同時跳。頻寬只夠先救一條——你選哪顆的時基。',
      '60': '壓折帶在塌。「可控損失」是他們的標籤；我只看還活著的呼號有幾路。',
      '61': '工炸區。他們催快，礦道呼號還在——手別快過腦，快會濾錯峰。',
      '62': '三炸鎖同一命脈。排錯順序，帳上記名——先算級聯，再按。',
      '63': '峽口有噬星者壓迫，背後有人推按鈕。你只跟讀數，不跟推手。',
      '64': '最後十秒，礦道裡還有呼號。排完這一輪——回頭會把時基打亂。',
      // 第 9 章：血色共振
      '65': '鄰焰共振對齊了。相鄰佈雷會波形疊加——把能量往地底推，別散。',
      '66': '地下空腔很大。在這兒疊加，回音會放大峰值——對準再點燃。',
      '67': '干擾跳得很兇。別追跳動的數；在脈衝最亂的交界鎖真峰。',
      '68': '地殼不穩，共振一響就跟塌方賽跑。節奏穩住——亂了相位就斷。',
      '69': '逆流反撲。交錯佈署，用疊加火網把廊道焊成一條連續頻帶。',
      '70': '屍骨巢在自激。殘能很吵——穩住節拍，用數學壓峰值。',
      '71': '讀數在發燙，鏈路過載臨界。撐住校準，前面就是最後一條管線。',
      '72': '地底核心。把鄰焰連成不中斷的疊加鏈——給洞穴一個乾淨的收斂。',
      // 第 10 章：終焉沙盤
      '73': '終柵網啟動。這是我最後一次幫你校準——鄰格一個都別漏。',
      '74': '方格與六角在解體。裂隙在拉時基——把真信號釘死，別跟引力跑。',
      '75': '通訊節點被廢雷吞。搶秒；那是別人用穩定劑換來的窗口。',
      '76': '據點反撲。外層還有人擋著——數字寫滿，別讓外線白耗。',
      '77': '防護罩讀數見底。每一次共振都是對深淵的反向脈衝——繼續壓。',
      '78': '跳變看似停了——其實把頻譜燒黑了。別閉眼賭反射，重濾，找殘峰。',
      '79': '沙盤只剩焦點。錨點訊號在裂隙邊閃——跟線走，快。',
      '80': '最終核心。最後一手：把終柵頻率壓下去。座標歸零，接大家回來。',
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
        '頻道通了，開搞。',
        '節奏交給我，你只管按。',
      ],
      lastTen: [
        '剩十秒！先把退路弄好，再收。',
        '時基在收——快清撤退道，不然準備走。',
      ],
      idle: [
        '我在對頻啦，別亂戳。',
        '卡太久欸，快決定。',
      ],
      good: [
        '對上了，繼續推。',
        '漂亮，這波很乾。',
      ],
      bad: [
        '讀數爆了，重來！',
        '算錯了——鄰格快修。',
      ],
      victory: [
        '搞定，收工。',
        '座標歸零，下班。',
      ],
    },
  },
  {
    id: 'selina',
    name: '賽琳娜',
    role: '戰地測繪師',
    skillName: '格網倍乘',
    skillDetail:
      '盤面當格網看：每一顆已確定的雷，火力％裡單獨計加權。數「你已放下的數字」有幾格與它緊鄰——0 或 1 格當 1；從第 2 格緊鄰起是 2，之後每多一格緊鄰就再 ×2，單顆雷加權上限 8。',
    combatSkills: [
      {
        name: '格網倍乘',
        hudIcon: 'grid',
        detail:
          '每顆已確定的雷：幾格已佈數字與它緊鄰，加權 0～1 格→1；2 格→2，每再多一格 ×2（4、8…），封頂 8。',
      },
    ],
    missionMapHook:
      '頂尖地理學家出身——裂隙把地貌撕成錯覺時，她腦內的座標網比紙本地圖可靠；格網上多向讀數交會處，她寧可畫滿註記也不漏一格。',
    codename: '地圖師',
    serialNo: 'SN-MD-0002',
    background: [
      '學界報告上她的名字還在，人卻只在戰區出沒。全息投影儀在腕上旋出方格與蜂巢格，口袋塞滿不同地形的偵測標——她習慣用座標替隊友踩雷。',
      '裂隙周邊的空間陷阱會拐人視線；她最恨「感覺對了」這種賭法。參謀台把她的格網倍乘寫進火力公式：同一雷旁邊每多一格已佈數字，權重就沿 1→2→4→8… 乘上去，單顆封頂 8，直到格網讀數收斂。檔案註記：話少、筆尖快；誰踩進扭曲帶，她就用下一個標把誰拽回來。',
    ],
    specialties: ['全息格網', '格網倍乘', '扭曲區判讀'],
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
        '地圖在我腦裡了，先看外框。',
        '這種隘口我畫過，別急啦。',
      ],
      lastTen: [
        '十秒！沿安全邊退一格，別卡在怪地方。',
        '來不及繞了——走最短的撤！',
      ],
      idle: [
        '停太久，等高線要糊了欸。',
        '下一步對稜線，別跟情緒走。',
      ],
      good: [
        '這格在稜上，漂亮。',
        '角度對了，雷藏不住。',
      ],
      bad: [
        '被坡影騙了欸，重畫。',
        '這步像踩斷崖，回去。',
      ],
      victory: [
        '線收乾淨，收工。',
        '這盤我簽了。',
      ],
    },
  },
  {
    id: 'bobby',
    name: '波比',
    role: '搜救犬訓練員',
    combatSkills: [
      {
        name: '嗅線標記',
        hudIcon: 'footprints',
        detail:
          '同一組電報的第二手：選定長官電報後，會在上一手鄰格亮起「放當前電碼不會爆」的空格（已揭雷格不亮）。',
      },
      {
        name: '緊急降碼',
        hudIcon: 'arrow-down',
        detail:
          '本關僅 2 次：若此手落點會邏輯爆炸，自動改放數字 −1；若降碼後仍衝突則照常引爆並照樣扣次。',
      },
    ],
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
        '先繞一圈啦，別急著下。',
        '巴克耳朵豎了——那幾格先標。',
      ],
      lastTen: [
        '十秒！巴克在催——弄完這手就往外撤！',
        '尾巴快燒到了，跟味道走，別黏在雷前！',
      ],
      idle: [
        '再拖，味道會散掉欸。',
        '換條線聞，下一份。',
      ],
      good: [
        '味道對了，繼續。',
        '標得準，狗都點頭。',
      ],
      bad: [
        '你無視味道了欸，重聞。',
        '錯味，退回。',
      ],
      victory: [
        '搜救成功，收隊。',
        '線索全對，回去給巴克加肉。',
      ],
    },
  },
  {
    id: 'laozhang',
    name: '老張',
    role: '結構工程師',
    skillName: '壓箱電碼',
    skillDetail: '先選電碼，再點專屬壓箱槽壓箱；選中後可連續點格使用（最多 3 次），可隨時再壓新電碼。',
    missionMapHook:
      '甲面上噬星者抓過的痕與焊補邊緣一樣清楚——乾谷據點他曾澆過最後一車漿，也親眼看裂隙把它啃穿。',
    codename: '城牆',
    serialNo: 'SN-MD-0005',
    background: [
      '鋼筋混凝土與連鎖反應在他眼里同一套語言；戰壕裡會默默遞根菸、話少的那種可靠。他穿最重的甲不是炫，是算過：多扛一瞬，後面就少賠一條命。',
      '乾谷據點有他親手澆的樑。異界推進那夜，梁斷人沒全撤——他記得是誰的名字沒回來。從此他嘴更硬、手更快：線不能在他面前整段塌。',
    ],
    specialties: ['壓箱電碼', '連鎖阻斷', '帶隊節奏'],
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
        '別慌，我幫你穩節奏。',
        '吸一口，第一格慢慢來。',
      ],
      lastTen: [
        '剩十秒，把路弄開——撐不住就撤，別戀戰。',
        '時間在咬人：下最有把握那格，準備撤。',
      ],
      idle: [
        '慢一拍，別折在這。',
        '想清楚再動，也別想半天。',
      ],
      good: [
        '穩，就這樣。',
        '這手實在，像灌好漿。',
      ],
      bad: [
        '炸了，自己站起來。',
        '別再失手，這條線我再撐你一次。',
      ],
      victory: [
        '沒塌，功勞算你的。',
        '收好了，回基地。',
      ],
    },
  },
  {
    id: 'tungsten',
    name: '堡壘-09',
    role: '重裝自律戰鬥體',
    skillName: '加固模組',
    skillDetail: '每關 2 次：放錯不爆，該格改算火力（亮橙火力字，數值計入火力％）。',
    barrage: {
      opening: ['指令接收。加固模組待命。', '結構弱點掃描完成。執行。'],
      lastTen: ['剩餘十秒。優先穩定連鎖。', '時限逼近。收斂序列。'],
      idle: ['待命中。', '承載餘量計算中。'],
      good: ['落格有效。', '結構穩定。'],
      bad: ['連鎖觸發。加固介入。', '錯格已轉火力。'],
      victory: ['序列完成。撤回待機。', '佈雷達標。終止。'],
    },
    missionMapHook:
      '工業深處挖出來的自律機體——相位奇點在核心留下的不是人性，是只計算破壞效率的金屬邏輯。',
    codename: '鎢鋼',
    serialNo: 'SNSN-MD-0008',
    background: [
      '第一次異界衝擊時，它是這座工業城市深處的挖掘機器人。相位波摧毀了它所有的操作員，並在其核心留下了一個不穩定的「自我意識」奇點。它在廢墟中自我重組，將挖掘鑽頭改造成戰鬥機械臂，並用被擊毀的裝甲板修補軀幹。',
      '鎢鋼不再服務於人類，只執行自我優化的指令。它的職業病是：在任何環境下都會先分析地形的結構弱點；戰場上，它是比任何噬星者更冷酷、更具破壞力的純粹金屬堡壘。',
    ],
    specialties: ['結構弱點掃描', '廢墟自組', '重裝壓制'],
    personalItems: [
      { label: '改裝戰鬥鑽頭臂', icon: 'tag' },
      { label: '自拼裝甲板補強塊', icon: 'note' },
      { label: '核心奇點穩定讀數殘片', icon: 'photo' },
    ],
    lines: [
      '標定：頂板弱點、主受力線。執行。',
      '操作員離線。優化路徑：持續。',
      '障礙＝冗餘結構。移除。',
    ],
    missionBriefFallback: [
      '先畫結構力流，再下第一格。',
      '弱點在接縫與轉折，不在「看起來空」的那格。',
      '金屬不賭運氣，只算承載餘量。',
      '把盤面當樑：哪裡先斷，就先封哪裡。',
      '噬星者會叫；它不會，只會把路清乾淨。',
    ],
  },
  {
    id: 'claire',
    name: '克萊兒',
    role: '靈能醫療兵',
    skillName: '生命鏈結',
    skillDetail:
      '已佈指令數字彼此邏輯相鄰時，每對相鄰 +2 火力（方格四向／六角六邊；不同組合可重複累加；圍成環時閉合邊亦計）。',
    combatSkills: [
      {
        name: '生命鏈結',
        hudIcon: 'link',
        detail:
          '每對邏輯相鄰的已佈數字 +2 火力（方格四向、六角六邊）。例：3–4→+2；3–4–4→+4；3–4–4–5→+6；圍環再加閉合邊（如 3–5）→+8。',
      },
    ],
    missionMapHook:
      '野戰醫院實習夜被相位餘波撕開掩體後，她的視界多了一層生命能量的網格——冷靜得像儀器，痛卻全算在自己身上。',
    codename: '精神鏈接（Psi-Link）',
    serialNo: 'SNSN-MD-0013',
    background: [
      '第一次異界衝擊時，她是在前線野戰醫院實習的醫學生。爆炸的相位餘波擊穿了醫療站的掩體，在生死一瞬，她潛在的靈能天賦被徹底激發。她活了下來，但從此視界中多了一層「生命能量結構」——這不是什麼溫柔的神蹟，而是職業病與創傷疊在一起的專注。',
      '她能比旁人早半步察覺空間裡不對勁的生命力波動——那是儀器曲線與噬星者掠食前緣對齊後的生命毒性讀數，不是聽見怪物說話。檔案註記：過度共情導致的精神疲勞、螢幕反光過敏；戰場上比誰都冷靜。',
    ],
    specialties: ['生命場讀取', '生命鏈結', '野戰急救', '毒性前緣預警'],
    personalItems: [
      { label: '左眼光學靈能鏈路 HUD', icon: 'tag' },
      { label: '臂掛生體地形投影腕甲', icon: 'compass' },
      { label: '野戰醫院實習胸章（燒痕）', icon: 'photo' },
    ],
    lines: [
      '生命訊號在歪——不是幻聽，是讀數先到了。',
      '我先穩住你的「結構」，你再下決定。',
      '共情會累，但冷靜能救更多人。',
    ],
    missionBriefFallback: [
      '感覺盤面在「發燒」時，先當成毒性前緣在逼近。',
      '邊角往往最先漏生命訊號；別被中央騙走注意力。',
      '一步一格，像清創：乾淨了再縫。',
      '慌的時候看我腕上的網格——跟線走，不跟情緒走。',
      '噬星者靠近時，網格會先抖；信網格，別信運氣。',
    ],
    barrage: {
      opening: [
        '網格對好了。先選電碼，跟線走。',
        '盤面溫度正常——開始解。',
      ],
      lastTen: [
        '十秒。毒性前緣在逼近——先清退路。',
        '時限咬人了。穩住讀數，準備撤。',
      ],
      idle: [
        '慌會讓網格歪。看腕上，選下一格。',
        '停太久，訊號要散——動一下。',
      ],
      good: [
        '讀數回落了，繼續。',
        '這格乾淨，再縫下一針。',
      ],
      bad: [
        '讀數斷了，退後重接。',
        '毒性逼近——換格，別跟慌。',
      ],
      victory: [
        '網格靜了，收工。辛苦了。',
        '佈雷完成，讀數歸平。',
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

/** 幹員切換時由 `setStoredHeroId` 廣播；對局 UI 訂閱以同步頭像／主題 */
export const HERO_CHANGED_EVENT = 'md:hero-changed';

/** 長官電報同時待辦道數（每回合仍從中選 2 道執行）：一般幹員 3；艾達 4。 */
export function telegraphHandSlotCount(heroId: string): number {
  return heroId === 'ada' ? 4 : 3;
}

/** 火力％分子：每顆已揭示雷依「幾格已佈數字與其邏輯相鄰」加權；賽琳娜格網倍乘（n≤1→1，n≥2→min(2^(n−1),8)），其餘 min(n,2) 封頂。 */
export function heroFirepowerDigitWeightMode(heroId: string): FirepowerDigitWeightMode {
  return heroId === 'selina' ? 'convergenceExp' : 'capTwo';
}

/** 克萊兒生命鏈結：每對相鄰已佈數字額外計入火力的加值；其餘幹員為 0。 */
export function heroFirepowerDigitLinkPerEdge(heroId: string): number {
  return heroId === 'claire' ? 2 : 0;
}

function readRawMappedSelectedId(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    const mapped = v ? (LEGACY_HERO_ID[v] ?? v) : null;
    if (mapped && HEROES.some((h) => h.id === mapped)) return mapped;
  } catch {
    /* ignore */
  }
  return null;
}

export function getStoredHeroId(): string {
  const unlocked = new Set(getEffectiveUnlockedHeroIds());
  const raw = readRawMappedSelectedId();
  const firstAvailable = HEROES.find((h) => unlocked.has(h.id))?.id ?? HEROES[0].id;
  const pick = raw != null && unlocked.has(raw) ? raw : firstAvailable;
  if (raw != null && pick !== raw) {
    try {
      localStorage.setItem(STORAGE_KEY, pick);
    } catch {
      /* ignore */
    }
  }
  return pick;
}

export function setStoredHeroId(id: string) {
  if (!isHeroIdUnlocked(id)) return;
  try {
    localStorage.setItem(STORAGE_KEY, id);
    window.dispatchEvent(new CustomEvent(HERO_CHANGED_EVENT, { detail: { id } }));
  } catch {
    /* ignore */
  }
}

export function getHeroDef(id: string): HeroDef {
  return HEROES.find((h) => h.id === id) ?? HEROES[0];
}

/** 整備／對局右上角技能列（老張另有「壓箱槽」、堡壘-09 另有「加固模組」專屬 UI，不經此列） */
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
