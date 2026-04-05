/**
 * 寫入 levels.json 頂層 `_企劃欄位說明`（JSON 不支援 // 註解，故用此物件）。
 * 每個名詞只說明一次；企劃改關卡請編輯同檔的 `levels` 陣列。
 */
export const PLANNER_FIELD_DOCS: Record<string, string> = {
  讀我: '下方 levels 為 100 關資料陣列；編輯後請維持合法 JSON（雙引號、逗號、無註解）。若改動 levelDefinitionsFactory 邏輯，請在專案根執行 npm run export-levels-json 覆寫本檔。',

  levelId: '關卡編號 1～100；第 N 筆資料應對應關卡 N。',
  chapter: '章節編號 1～7，對應戰役分章。',
  title: '關卡標題（介面顯示用）。',
  gridSystem: '地圖系統意圖：SQUARE | HEXAGON | TRIANGLE | MIXED（部分形狀執行時仍可能以方格占位，見技術 TODO）。',
  coverageGoal: '過關覆蓋率目標，0～1（例：0.7 = 70%；1 = 100%）。',
  timeLimit: '時間限制（秒）；0 表示不計時。',
  initialSeed: '盤面種子字串；用於固定障礙等隨機結果，勿隨意改動除非刻意換盤面。',

  mapLayout: '地圖幾何根物件；必含 type，其餘欄位依 type 擇一填寫。',
  'mapLayout.type':
    'SQUARE=矩形格網；MIXED=多區塊合併；CROSS=十字；DIAMOND=菱形；TRIANGLE／HEXAGON=特殊（占位時仍可能為方格）。',
  'mapLayout.width': '（type=SQUARE）寬度格數。',
  'mapLayout.height': '（type=SQUARE）高度格數。',
  'mapLayout.forbiddenCells': '（type=SQUARE，可選）障礙座標 [[x,y],…]，該格不可部署。',
  'mapLayout.prePlaced': '（type=SQUARE，可選）開局已揭示提示 [{ pos:[x,y], value:數字 }, …]。',
  'mapLayout.sectors': '（type=MIXED）區塊陣列；每項含 id、shape（SQUARE|HEXAGON|TRIANGLE）、offset{x,y}、size[w,h]。',
  'mapLayout.placeholder': '（type=TRIANGLE 或 HEXAGON）暫用方格寬高，待真幾何接線後替換。',

  commands: '玩家手牌／指令池設定。',
  'commands.maxHand': '手牌張數上限（建議 1～5）。',
  'commands.poolType': 'RANDOM=在 weights 的鍵中均等抽選；WEIGHTED=依權重抽選。',
  'commands.weights': '鍵為字串 "1"～"8"；數值為權重（越大越常出現）；可省略或設 0 表示不給該數字。',

  events: '觸發事件序列（條件＋效果）；遊戲端可能尚未全實作，可先填企劃稿。',
  'events.trigger': 'PROGRESS=依覆蓋率進度觸發；TIME_LEFT=依剩餘秒數觸發。',
  'events.threshold': 'PROGRESS 時為 0～1 比例；TIME_LEFT 時為「剩餘秒數」門檻（例：60=剩 60 秒時觸發）。',
  'events.type': 'SANDSTORM／JAMMING／EMP 等附 duration（秒）；REINFORCE 為鎖定格數，附 count。',
  'events.duration': '（非 REINFORCE）事件持續秒數。',
  'events.count': '（type=REINFORCE）隨機鎖定空格數量。',

  chapterEntryBriefing:
    '可選；各章第一關常用。進入關卡時顯示的長官簡報台詞（長官發電報、士兵依數字佈雷之世界觀），字串陣列（建議 2～5 句）。執行 npm run export-levels-json 時會自舊版 levels.json 合併保留此欄。',

  mapCloudOverlay:
    '可選；沙塵暴視覺效果：多條不規則橫向沙帶從兩側交替飄入飄出（僅畫面、不擋點擊）。第 21～30 關預設啟用。',
  'mapCloudOverlay.periodSec': '沙帶移動速度基準（秒）；值愈大移動愈慢（建議 10～22；預設 18）。',
  'mapCloudOverlay.opacity': '0～1，沙帶通過時的濃度；愈高格子愈不清楚（建議 0.45～0.70；預設 0.52）。',
  'mapCloudOverlay.blurPx': '柔邊模糊強度 px（建議 32～56；愈大愈霧；預設 44）。',

  rewards: '通關獎勵／解鎖；可含 unlockCharacterIds、narrativeFlag、todo 等，依遊戲實作進度而定。',
};
