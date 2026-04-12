/**
 * 寫入 levels.json 頂層 `_企劃欄位說明`（JSON 不支援 // 註解，故用此物件）。
 * 每個名詞只說明一次；企劃改關卡請編輯同檔的 `levels` 陣列。
 */
export const PLANNER_FIELD_DOCS: Record<string, string> = {
  讀我:
    '下方 levels 為 100 關資料陣列；大地圖幾何可外置於 levelData/maps/{mapRef}.json（見 mapRef）。編輯後請維持合法 JSON。可執行 npm run export-levels-json 驗證並更新頂層 `_企劃欄位說明`。',

  levelId: '關卡編號 1～100；第 N 筆資料應對應關卡 N。',
  chapter: '章節編號 1～10，對應戰役分章（見 docs/world_map_design.md）。',
  title: '關卡標題（介面顯示用）。',
  gridSystem: '地圖系統意圖：SQUARE | HEXAGON | TRIANGLE | MIXED（部分形狀執行時仍可能以方格占位，見技術 TODO）。',
  coverageGoal: '過關覆蓋率目標，0～1（例：0.7 = 70%；1 = 100%）。',
  timeLimit: '時間限制（秒）；須為正整數，全戰役關卡皆計時。',
  initialSeed: '盤面種子字串；用於固定障礙等隨機結果，勿隨意改動除非刻意換盤面。',

  mapRef:
    '可選；地圖幾何外置時填此字串（通常等於 levelId 之字串），對應檔案 levelData/maps/{mapRef}.json，內容為 { "mapLayout": …, "mapTheme"?: 關卡選擇畫面主題文案 }。與關卡內嵌 mapLayout 二擇一；兩者併存時以內嵌 mapLayout 為準。',

  mapLayout: '地圖幾何根物件；必含 type，其餘欄位依 type 擇一填寫（可改寫入外置 maps 檔，見 mapRef）。',
  'mapLayout.type':
    'SQUARE=矩形格網；MIXED=多區塊合併；CROSS=十字；DIAMOND=菱形；TRIANGLE／HEXAGON=特殊（占位時仍可能為方格）。',
  'mapLayout.width': '（type=SQUARE）寬度格數。',
  'mapLayout.height': '（type=SQUARE）高度格數。',
  'mapLayout.forbiddenCells':
    '（type=SQUARE／TRIANGLE／HEXAGON，可選）障礙座標 [[x,y],…]，該格不可部署；HEXAGON 時索引與 placeholder 矩形及畫面蜂巢格一致。',
  'mapLayout.prePlaced': '（type=SQUARE，可選）開局已揭示提示 [{ pos:[x,y], value:數字 }, …]。',
  'mapLayout.sectors': '（type=MIXED）區塊陣列；每項含 id、shape（SQUARE|HEXAGON|TRIANGLE）、offset{x,y}、size[w,h]。',
  'mapLayout.placeholder': '（type=TRIANGLE 或 HEXAGON）暫用方格寬高，待真幾何接線後替換。',

  commands: '玩家手牌／指令池設定。',
  'commands.maxHand': '手牌張數上限（建議 1～5）。',
  'commands.poolType': 'RANDOM=在 weights 的鍵中均等抽選；WEIGHTED=依權重抽選。',
  'commands.weights': '鍵為字串 "1"～"8"；數值為權重（越大越常出現）；可省略或設 0 表示不給該數字。',

  events: '預留欄位：戰場觸發序列尚未實裝，請一律填空陣列 []（勿寫 JAMMING／REINFORCE 等）。',

  chapterEntryBriefing:
    '（執行時注入）長官簡報台詞來源：levelData/chapterEntryBriefings.json 的 byLevelId（key 為 levelId 字串）。勿在 levels.json 重複填寫；同一章可能有多個進場簡報關（例如三角／蜂巢分段以不同 levelId 區分）。',

  forcedMineCells: '可選；固定必雷座標 [[x,y],…]。這些格在整局都視為地雷，若玩家嘗試在該格安放數字會直接造成邏輯衝突。',
  mineBonusTargetCells: '可選；目標地雷座標 [[x,y],…]。當這些格被邏輯「確認為地雷」並自動揭示時，可觸發加秒獎勵。',
  mineBonusSeconds: '可選；每個目標地雷觸發時加秒數（預設 5）。',
  dynamicMinePerMove:
    '可選；true 時每次玩家成功佈署後，在鄰居皆無數字的隨機空格新增一顆廢雷（深海要塞機制）。廢雷佔格、不可再放數字，但不計入鄰格數字的雷數（與企劃「孤立廢雷」一致）。',

  commandSlotReceiveJamming:
    '可選；true 時為信號干擾區：每道待辦電碼 UI 上 1～8 往返輪播；玩家點選一道電報時鎖定當下顯示數字並停止該格輪播，再點格以該數字佈署（見 signalJamming.ts、useMineGame）。',

  commandSlotJammingStepMs:
    '可選；信號干擾時輪播「每換一個數字」的間隔（毫秒）。未填用程式預設；過小／過大會被 clamp（見 resolveSignalJammingStepMs）。',

  blastPoints:
    '可選；引爆危機章節——地圖上的定時炸點陣列。每個炸點含 pos[x,y]、countdownSec（倒數秒數）、defuseBonusSec（解除後加秒；未填預設 0）。歸零前若周圍格子邏輯未確認所有地雷，即觸發爆炸失敗。',
  'blastPoints[].pos': '炸點座標 [x, y]，與 mapLayout 格子索引一致（0-based）。',
  'blastPoints[].countdownSec': '炸點倒數秒數；獨立於主計時器，歸零即輸。',
  'blastPoints[].defuseBonusSec': '可選；解除炸點後加入主計時器的獎勵秒數（未填為 0）。',

  digitOutposts:
    '可選；戰術據點座標 [[x,y],…]（須為可部署格）。每格必須有數字佈署（含開局 prePlaced）；覆蓋率達標仍有據點未填數字則失敗。據點若被邏輯揭示為紅雷或出現動態廢雷佔格亦立即失敗。廢雷生成會排除據點座標。',

  neighborPlacedDigitBonus:
    '可選；本機制唯一開關：僅當設為 true 時啟用，程式不依 chapter／levelId 推斷。true 時實際放下數字 = 電報底數 + 與目標格「邏輯相鄰」且已佈數字之鄰格個數（含開局 prePlaced／提示格）。鄰接規則與盤面 solver 相同。',

  rewards: '通關獎勵／解鎖；可含 unlockCharacterIds、narrativeFlag、todo 等，依遊戲實作進度而定。',
};
