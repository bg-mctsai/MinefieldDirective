import { GAME_FIXED } from './gameFixedMessages';

export type HeroGameStatusKey = keyof typeof GAME_FIXED.gameStatus;
export type HeroVictoryStatusKey = keyof typeof GAME_FIXED.victoryStatus;

const HERO_GAME_STATUS_LINES: Record<string, Partial<Record<HeroGameStatusKey, string[]>>> = {
  xiaoming: {
    initTelegraph: ['電報來了……先點數字再點格，我、我跟著走。'],
    timeUpExplosion: ['時限到！陣上還有縫——先撤，照片還在就不算輸。'],
    blastPointExplosion: ['炸點斷線了……我下次先看鄰格再下！'],
    digitOutpostIncomplete: ['覆蓋夠了，據點還空著。下一盤一格格填，別讓人白等。'],
    digitOutpostRevealedAsMine: ['據點怎麼變雷了？！那格只能填數字啊……'],
    jammingSelectTelegraphFirst: ['干擾在跳……先鎖一道電碼，抓到讀值再點格！'],
  },
  ada: {
    initTelegraph: ['頻道開了。先鎖一道電碼，座標跟著走。'],
    timeUpExplosion: ['時基歸零，陣面有漏。撤離頻道——下一輪重校。'],
    blastPointExplosion: ['炸點斷線，周邊沒讀通。退回上一假設重算。'],
    digitOutpostIncomplete: ['覆蓋率達標，據點還沒寫滿。收斂完再談撤。'],
    digitOutpostRevealedAsMine: ['據點被推成雷——邏輯上這格只能佈數字。'],
    jammingSelectTelegraphFirst: ['先選電碼對準當下讀值；窗口一過，雜訊會騙你。'],
  },
  selina: {
    initTelegraph: ['格網展開。先點電碼，再落格——別靠眼緣賭。'],
    timeUpExplosion: ['時限斷在稜線上。先退安全等高，下盤再封。'],
    blastPointExplosion: ['炸點周邊沒讀通，等高線斷了。重畫這一段。'],
    digitOutpostIncomplete: ['火力夠了，據點還空。像漏標的峰，下一盤補齊。'],
    digitOutpostRevealedAsMine: ['據點格被推成雷——地形上這裡只能是數字。'],
    jammingSelectTelegraphFirst: ['干擾帶在晃。先鎖電碼，讀值對上再踩格。'],
  },
  bobby: {
    initTelegraph: ['巴克在聞了。你選電碼，我們一起標可疑格。'],
    timeUpExplosion: ['時間到！跟氣味線往外拉——別黏在雷前！'],
    blastPointExplosion: ['炸點斷了，周圍味道全亂。重聞一輪再下。'],
    digitOutpostIncomplete: ['覆蓋夠，據點還沒填滿。狗鼻子說那幾格還在叫。'],
    digitOutpostRevealedAsMine: ['據點變雷？這格只能填數字，巴克也不同意。'],
    jammingSelectTelegraphFirst: ['雜訊太吵。先選一道電碼，讀穩了再帶狗下格。'],
  },
  laozhang: {
    initTelegraph: ['收到。先穩一道電碼，結構我幫你盯著。'],
    timeUpExplosion: ['時限到，陣上還有縫。先撤——這條線改天再澆實。'],
    blastPointExplosion: ['炸點斷線，周邊沒撐住。別灰心，重排先後。'],
    digitOutpostIncomplete: ['覆蓋夠了，據點還沒灌漿。下一盤一個一個填滿。'],
    digitOutpostRevealedAsMine: ['據點被推成雷。那格只能佈數字，結構不允許例外。'],
    jammingSelectTelegraphFirst: ['先點一道電碼對讀值，再下格。急不得，也拖不得。'],
    buckEmergencySaved: ['加固擋住了。還有一次，下一手收乾淨。'],
  },
  tungsten: {
    initTelegraph: ['指令接收。電碼鎖定後，執行佈雷序列。'],
    timeUpExplosion: ['時限歸零。未覆蓋區域失效。撤回待機點。'],
    blastPointExplosion: ['炸點承載斷裂。周邊格未達標，連鎖啟動。'],
    digitOutpostIncomplete: ['覆蓋率達標。據點節點仍空——任務未完成。'],
    digitOutpostRevealedAsMine: ['據點格判定為雷。邏輯衝突：該格僅允許數字。'],
    jammingSelectTelegraphFirst: ['干擾輪播中。先鎖電碼讀值，再執行落格。'],
  },
  claire: {
    initTelegraph: ['生命網格已對齊。選電碼，再下格——跟線，不跟慌。'],
    timeUpExplosion: ['時限到了，盤面還在發燒。先撤、穩呼吸——下一手跟網格走。'],
    blastPointExplosion: ['炸點周邊讀數斷了，毒性前緣在逼近。退後重接。'],
    digitOutpostIncomplete: ['覆蓋夠了，據點生命訊號還弱。下一盤逐格寫滿。'],
    digitOutpostRevealedAsMine: ['據點被推成雷——這格在網格上只能是數字。'],
    jammingSelectTelegraphFirst: ['干擾在跳。先鎖電碼，讀值對準再點格。'],
  },
};

const HERO_VICTORY_STATUS_LINES: Record<string, Partial<Record<HeroVictoryStatusKey, string[]>>> = {
  xiaoming: {
    plain: ['任務完成……我還活著，撤退！'],
    withTimeBonus: ['目標雷確認，+{seconds} 秒——這次運氣站我這邊，任務達成。'],
  },
  ada: {
    plain: ['結果輸出：任務達標。收工。'],
    withTimeBonus: ['目標雷確認，+{seconds} 秒；全頻段歸零，任務達成。'],
  },
  selina: {
    plain: ['線收乾淨，地形成。這盤我簽名了。'],
    withTimeBonus: ['目標雷 +{seconds} 秒；格網收斂，任務達成。'],
  },
  bobby: {
    plain: ['搜救成功，收隊。回去給巴克加肉。'],
    withTimeBonus: ['目標雷 +{seconds} 秒；線索全對，任務達成。'],
  },
  laozhang: {
    plain: ['結構沒塌，任務算你的。全線收斂。'],
    withTimeBonus: ['目標雷 +{seconds} 秒；佈雷完成，這線撐住了。'],
  },
  tungsten: {
    plain: ['佈雷序列完成。撤回待機。'],
    withTimeBonus: ['目標雷 +{seconds} 秒；覆蓋達標，任務終止。'],
  },
  claire: {
    plain: ['網格歸靜，任務達成。辛苦了。'],
    withTimeBonus: ['目標雷 +{seconds} 秒；佈雷完成，生命讀數回落。'],
  },
};

function pickFromPool(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)]!;
}

/** 對局狀態列：優先幹員專屬池，否則 fallback 至 gameFixedMessages.json */
export function pickHeroGameStatusLine(heroId: string, key: HeroGameStatusKey): string {
  const pool = HERO_GAME_STATUS_LINES[heroId]?.[key];
  if (pool && pool.length > 0) return pickFromPool(pool);
  return GAME_FIXED.gameStatus[key];
}

export function pickHeroVictoryStatusLine(heroId: string, key: HeroVictoryStatusKey): string {
  const pool = HERO_VICTORY_STATUS_LINES[heroId]?.[key];
  if (pool && pool.length > 0) return pickFromPool(pool);
  return GAME_FIXED.victoryStatus[key];
}
