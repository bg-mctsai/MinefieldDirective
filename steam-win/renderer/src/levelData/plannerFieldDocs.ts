/**
 * 寫入 levels.json 頂層 `_企劃欄位說明`（JSON 不支援 // 註解，故用此物件）。
 * 每個名詞只說明一次；企劃改關卡請編輯同檔的 `levels` 陣列。
 */
export const PLANNER_FIELD_DOCS: Record<string, string> = {
  讀我:
    '下方 levels 為關卡陣列（目前 80 筆）。大地圖幾何與戰場短名請以外置 levelData/maps/{mapRef}.json 為準（mapRef 與檔名一致，如 3_2）。levels 內勿再填 gridSystem（由 mapLayout.type 於載入時推導）。改地圖格數摘要可跑 node scripts/patch-map-grid-stats.mjs；幾何／炸點等約束可跑 node scripts/validate-map-constraints.mjs；npm run export-levels-json 會以本物件覆寫此說明區（並驗證關卡筆數，須與腳本設定一致）。編輯後請維持合法 JSON。',

  levelId: '關卡編號 1～80；第 N 筆資料應對應關卡 N。',
  chapter: '章節編號 1～10，對應戰役分章（見 docs/world_map_design.md）。',
  title:
    '可選；未填時介面名稱優先使用外置 maps 的 mapTheme，再退回「關卡 N」。多數關卡與第一章相同可不寫 title。',
  gridSystem:
    '勿寫在 levels。執行期由 hydrateLevelMaps 依 mapLayout.type 推導：HEXAGON／MIXED 同名；SQUARE／CROSS／DIAMOND → SQUARE。若殘留舊欄位且與推導不符，node scripts/validate-map-constraints.mjs 會報錯。',
  coverageGoal:
    '過關覆蓋率目標（企劃／平衡用），0～1（例：0.7 = 70%；1 = 100%）。與 HUD「火力」、勳章門檻無強制連動；未填 medalThresholds 時勳章門檻為銅 0.60、銀 0.75、金 0.90。',
  medalThresholds:
    '可選；逐關自訂三段勳章火力門檻（皆 0～1，對應 HUD 火力百分比）。需為物件 { bronze, silver, gold }。規則：達銅後玩家可主動撤離領牌；達金自動結算；時間歸零一律失敗。建議 0 < bronze ≤ silver ≤ gold ≤ 1。',
  'medalThresholds.bronze': '銅級勳章火力門檻 0～1。',
  'medalThresholds.silver': '銀級勳章火力門檻 0～1。建議比銅高約 0.05～0.15。',
  'medalThresholds.gold':
    '金級勳章火力門檻 0～1。達此值對局自動結算；建議比銀高約 0.05～0.15。受 forbiddenCells 影響時請避免逼近 1.0。',
  timeLimit: '時間限制（秒）；須為正整數，全戰役關卡皆計時。',
  initialSeed: '盤面種子字串；用於固定障礙等隨機結果，勿隨意改動除非刻意換盤面。',

  mapRef:
    '可選；外置地圖時填「章節_關卡」（與 levelKey 相同，如 1_1、10_8），對應 levelData/maps/{mapRef}.json。檔案典型結構：mapLayout（必填）、mapTheme（可選）、gridStats（可選，僅企劃標註）。與關卡內嵌 mapLayout 二擇一；併存時以內嵌為準。',

  '（外置地圖）mapTheme':
    '可選；寫在 maps/*.json。極短戰場名，供關卡選擇列與戰情簡報標題（建議約 2～5 字）。',

  '（外置地圖）gridStats':
    '可選；寫在 maps/*.json，執行期忽略。totalCells／forbiddenCellCount／playableCells 供企劃速覽；改動 mapLayout 後可執行 node scripts/patch-map-grid-stats.mjs 重算。',

  mapLayout: '地圖幾何根物件；必含 type，其餘欄位依 type 擇一填寫（可改寫入外置 maps 檔，見 mapRef）。',
  'mapLayout.type':
    'SQUARE=矩形格網；MIXED=多區塊合併；CROSS=十字；DIAMOND=菱形；HEXAGON=蜂巢占位矩形（畫面為六角格）。',
  'mapLayout.width': '（type=SQUARE）寬度格數。',
  'mapLayout.height': '（type=SQUARE）高度格數。',
  'mapLayout.forbiddenCells':
    '（type=SQUARE／HEXAGON，可選）障礙座標 [[x,y],…]，該格不可部署；HEXAGON 時索引與 placeholder 矩形及畫面蜂巢格一致。',
  'mapLayout.prePlaced': '（type=SQUARE，可選）開局已揭示提示 [{ pos:[x,y], value:數字 }, …]。',
  'mapLayout.sectors': '（type=MIXED）區塊陣列；每項含 id、shape（SQUARE|HEXAGON）、offset{x,y}、size[w,h]。',
  'mapLayout.placeholder': '（type=HEXAGON）暫用方格寬高，與畫面蜂巢索引一致。',

  commands: '玩家手牌／指令池設定（長官電報；標準 3 選 2）。',
  'commands.maxHand':
    '同時待辦電碼欄位數；請一律填 3（3 選 2：每回合從中選 2 道佈署）。角色艾達時執行期可為 4（4 選 2），由程式 heroes.telegraphHandSlotCount 覆寫，企劃 JSON 仍填 3 即可。',
  'commands.poolType': 'RANDOM=在 weights 的鍵中均等抽選；WEIGHTED=依權重抽選。',
  'commands.weights': '鍵為字串 "1"～"8"；數值為權重（越大越常出現）；可省略或設 0 表示不給該數字。',

  events: '預留欄位：戰場觸發序列尚未實裝，請一律填空陣列 []（勿寫 JAMMING／REINFORCE 等）。',

  chapterEntryBriefing:
    '（執行時相容舊欄位）單段長官簡報；新資料請改填 levelData/chapterEntryBriefings.json 的 byLevelId。舊字串陣列會視為 levelBriefing。',
  chapterEntryTone:
    '（執行時注入）章節情緒定調；來源為 levelData/chapterEntryBriefings.json 的 byLevelId[levelId].chapterTone。',
  levelEntryBriefing:
    '（執行時注入）本關執行簡報；來源為 levelData/chapterEntryBriefings.json 的 byLevelId[levelId].levelBriefing。',
  entryBriefingEnabled:
    '可選；預設 true。進場長官簡報總開關。設為 false 時，即使 chapterEntryBriefings.json 有本關精準 byLevelId 台詞也不顯示。',
  levelEntryBriefingFallbackToChapterStart:
    '可選；預設 true。僅章首戰：byLevelId 未命中本關 levelId 時是否讀同章章首鍵（x1）簡報。非章首戰不繼承章首台詞；章內其他關要顯示進場簡報請在 chapterEntryBriefings.json 寫該關 levelId。false 時章首戰也不做章首鍵回退。',

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

  rewards: '通關敘事／企劃標記；可含 narrativeFlag、todo 等。幹員解鎖：levelData/heroUnlockByChapter.json。',

  missionTacticalBriefingMap:
    '可選；作戰地圖（章內六角戰術圖）視覺。可覆寫該關節點在圖上的位置（百分比）與底圖色票；未填時節點採程式預設「軍事散點」十點佈局（左下起點→中央稜線→右側哨所→上緣分散→頂端目標），色票仍依 levelId 輪替。',
  'missionTacticalBriefingMap.nodePositionPct':
    '可選；{ x, y } 為節點中心在戰術圖上的百分比座標（0～100，原點左上），覆寫該章預設佈局（第 1～10 章見程式 missionChapterNodePositions）。',
  'missionTacticalBriefingMap.mapPalette':
    '可選；底圖與路徑色票：aurora | ember | jade | steel | violet | monsoon；未填則依 levelId 在六種預設間輪替。',

  missionTacticalTerrainAsset:
    '作戰地圖衛星／點陣「全畫面底圖」：（1）關卡專屬：renderer/src/assets/mission-tactical-level-{兩位數 levelId}.png，有則優先。（2）章節預設：assets/mission-tactical-chapter-maps/mission-tactical-chapter-{NN}.png；第 1 章可為 mission-tactical-chapter-01-bootcamp.png；建置時 glob 收錄，缺檔章節用 mission-tactical-satellite-base.png。無須在 levels.json 填欄位。',
};
