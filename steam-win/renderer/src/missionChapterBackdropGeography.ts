/**
 * 戰術卷宗底圖上的地理位置標註（百分比座標，與關卡節點／路徑同一套 0～100 空間）。
 * 每章 10～15 處為宜；座標應避開主要節點簇與 Boss 區（見 `missionChapterNodePositions`）。
 */

export type MissionBackdropGeographyLabel = {
  x: number;
  y: number;
  text: string;
  align?: 'start' | 'middle' | 'end';
};

const CHAPTER_1: MissionBackdropGeographyLabel[] = [
  { x: 48, y: 7, text: '北境雪線', align: 'middle' },
  { x: 36, y: 14, text: '北廠煙囪群', align: 'middle' },
  { x: 44, y: 26, text: '內陸湖沼帶', align: 'middle' },
  { x: 8, y: 44, text: '西北原始林', align: 'start' },
  { x: 28, y: 34, text: '主工業廓', align: 'middle' },
  { x: 66, y: 38, text: '東麓丘陵帶', align: 'end' },
  { x: 7, y: 70, text: '西濱河洲', align: 'start' },
  { x: 20, y: 70, text: '西岸河網區', align: 'start' },
  { x: 62, y: 46, text: '演訓外環帶', align: 'end' },
  { x: 46, y: 84, text: '南方旱原區', align: 'middle' },
  { x: 86, y: 50, text: '東岸港灣', align: 'end' },
  { x: 90, y: 78, text: '外海島鏈', align: 'end' },
];

/** 第 2 章 巷戰封鎖線 */
const CHAPTER_2: MissionBackdropGeographyLabel[] = [
  { x: 8, y: 68, text: '西巷檢查哨', align: 'start' },
  { x: 30, y: 74, text: '北封路障帶', align: 'middle' },
  { x: 48, y: 64, text: '中央市場廢墟', align: 'middle' },
  { x: 70, y: 58, text: '東幹道缺口', align: 'end' },
  { x: 18, y: 50, text: '南側排水溝', align: 'start' },
  { x: 56, y: 26, text: '屋頂通道網', align: 'middle' },
  { x: 38, y: 40, text: '臨時拒馬區', align: 'middle' },
  { x: 84, y: 54, text: '地下連通口', align: 'end' },
  { x: 24, y: 34, text: '醫療站外圍', align: 'start' },
  { x: 90, y: 34, text: '東塔視界', align: 'end' },
  { x: 14, y: 84, text: '南疏散集結點', align: 'start' },
  { x: 72, y: 20, text: '巷尾封鎖線', align: 'end' },
];

/** 第 3 章 乾谷據點 */
const CHAPTER_3: MissionBackdropGeographyLabel[] = [
  { x: 46, y: 8, text: '北風裂口', align: 'middle' },
  { x: 72, y: 18, text: '東側裸坡', align: 'end' },
  { x: 10, y: 58, text: '乾河床主道', align: 'start' },
  { x: 28, y: 46, text: '沙暴避難棚', align: 'middle' },
  { x: 54, y: 42, text: '廢棄泵房', align: 'middle' },
  { x: 40, y: 58, text: '谷心匯流點', align: 'middle' },
  { x: 8, y: 38, text: '西側裸岩', align: 'start' },
  { x: 62, y: 72, text: '南陰影帶', align: 'end' },
  { x: 86, y: 48, text: '補給空投帶', align: 'end' },
  { x: 34, y: 22, text: '信標殘柱', align: 'middle' },
  { x: 18, y: 78, text: '谷口管制站', align: 'start' },
  { x: 50, y: 30, text: '中央淺溝', align: 'middle' },
];

/** 第 4 章 蜂格前哨（蜂巢地形前導） */
const CHAPTER_4: MissionBackdropGeographyLabel[] = [
  { x: 48, y: 10, text: '北稜觀測所', align: 'middle' },
  { x: 82, y: 28, text: '東脊防火線', align: 'end' },
  { x: 50, y: 52, text: '稜線匯流點', align: 'middle' },
  { x: 10, y: 48, text: '西坡掩體帶', align: 'start' },
  { x: 36, y: 62, text: '鞍部通道', align: 'middle' },
  { x: 68, y: 66, text: '南山斷崖', align: 'end' },
  { x: 22, y: 28, text: '高地蓄水池', align: 'start' },
  { x: 88, y: 50, text: '雷達外罩區', align: 'end' },
  { x: 58, y: 36, text: '迫擊座標點', align: 'middle' },
  { x: 14, y: 72, text: '棱線相接處', align: 'start' },
  { x: 76, y: 18, text: '撤退繩降點', align: 'end' },
  { x: 44, y: 18, text: '主高地峰', align: 'middle' },
];

/** 第 5 章 蜂巢防線 */
const CHAPTER_5: MissionBackdropGeographyLabel[] = [
  { x: 50, y: 10, text: '蜂巢北緣', align: 'middle' },
  { x: 32, y: 28, text: '六角網核心', align: 'start' },
  { x: 68, y: 32, text: '工蜂走道', align: 'end' },
  { x: 44, y: 62, text: '南巢出入口', align: 'middle' },
  { x: 24, y: 48, text: '養殖艙外殼', align: 'start' },
  { x: 76, y: 52, text: '冷卻廊道', align: 'end' },
  { x: 50, y: 42, text: '電網接合區', align: 'middle' },
  { x: 58, y: 22, text: '巢心管制室', align: 'middle' },
  { x: 12, y: 62, text: '廢蠟處理槽', align: 'start' },
  { x: 88, y: 68, text: '東巢擴張帶', align: 'end' },
  { x: 38, y: 76, text: '維修豎井', align: 'start' },
  { x: 84, y: 36, text: '外殼裂縫帶', align: 'end' },
];

/** 第 6 章 深海要塞 */
const CHAPTER_6: MissionBackdropGeographyLabel[] = [
  { x: 50, y: 12, text: '上浮廊道', align: 'middle' },
  { x: 14, y: 52, text: '壓艙門 A', align: 'start' },
  { x: 72, y: 44, text: '聲納盲區', align: 'end' },
  { x: 28, y: 68, text: '維修港池', align: 'start' },
  { x: 86, y: 58, text: '魚雷整備帶', align: 'end' },
  { x: 30, y: 28, text: '指揮隔艙', align: 'start' },
  { x: 8, y: 72, text: '外殼聽音站', align: 'start' },
  { x: 62, y: 70, text: '深海閘門', align: 'end' },
  { x: 22, y: 28, text: '應急氣閘', align: 'start' },
  { x: 78, y: 28, text: '底艙管線', align: 'end' },
  { x: 42, y: 52, text: '潛望塔座', align: 'middle' },
  { x: 54, y: 82, text: '核心反應外殼', align: 'middle' },
];

/** 第 7 章 信號干擾區 */
const CHAPTER_7: MissionBackdropGeographyLabel[] = [
  { x: 50, y: 8, text: '干擾帶北端', align: 'middle' },
  { x: 12, y: 42, text: '頻跳中繼塔', align: 'start' },
  { x: 78, y: 38, text: '假訊號池', align: 'end' },
  { x: 30, y: 58, text: '屏蔽谷', align: 'start' },
  { x: 86, y: 22, text: '電離反射點', align: 'end' },
  { x: 44, y: 24, text: '旁瓣發射井', align: 'middle' },
  { x: 68, y: 58, text: '同步遮蔽區', align: 'end' },
  { x: 18, y: 68, text: '噪訊農場', align: 'start' },
  { x: 88, y: 72, text: '備援天線陣', align: 'end' },
  { x: 36, y: 76, text: '校準靶區', align: 'start' },
  { x: 52, y: 44, text: '指揮鏈斷帶', align: 'middle' },
  { x: 50, y: 30, text: '主干擾源', align: 'middle' },
];

/** 第 8 章 引爆危機 */
const CHAPTER_8: MissionBackdropGeographyLabel[] = [
  { x: 10, y: 58, text: '炸點 A 外圍', align: 'start' },
  { x: 28, y: 42, text: '安全導線管', align: 'middle' },
  { x: 58, y: 42, text: '計時面板背面', align: 'middle' },
  { x: 78, y: 52, text: '次炸點走廊', align: 'end' },
  { x: 22, y: 70, text: '平民疏散巷', align: 'start' },
  { x: 86, y: 68, text: '防爆堤', align: 'end' },
  { x: 44, y: 62, text: '解除工具站', align: 'middle' },
  { x: 50, y: 18, text: '主炸點核心外', align: 'middle' },
  { x: 8, y: 78, text: '消防水線', align: 'start' },
  { x: 70, y: 30, text: '備援斷路器', align: 'end' },
  { x: 18, y: 38, text: '封鎖膠帶線', align: 'start' },
  { x: 90, y: 40, text: '撤退集合點', align: 'end' },
];

/** 第 9 章 鄰焰共振 */
const CHAPTER_9: MissionBackdropGeographyLabel[] = [
  { x: 50, y: 10, text: '共振頻寬走廊', align: 'middle' },
  { x: 10, y: 52, text: '相位節點西', align: 'start' },
  { x: 82, y: 48, text: '耦合天井', align: 'end' },
  { x: 28, y: 36, text: '緩衝隔離牆', align: 'start' },
  { x: 70, y: 62, text: '熱點匯合區', align: 'end' },
  { x: 46, y: 58, text: '鄰格同步站', align: 'middle' },
  { x: 18, y: 28, text: '反相抵消槽', align: 'start' },
  { x: 88, y: 28, text: '主頻錨點', align: 'end' },
  { x: 36, y: 70, text: '次諧波巢', align: 'start' },
  { x: 62, y: 22, text: '實驗防護罩', align: 'middle' },
  { x: 14, y: 78, text: '能量洩洪溝', align: 'start' },
  { x: 52, y: 42, text: '核心共振室', align: 'middle' },
];

/** 第 10 章 終焉防線 */
const CHAPTER_10: MissionBackdropGeographyLabel[] = [
  { x: 50, y: 12, text: '最後城牆外壕', align: 'middle' },
  { x: 18, y: 58, text: '拒馬第二線', align: 'start' },
  { x: 82, y: 56, text: '彈藥底窖', align: 'end' },
  { x: 28, y: 72, text: '平民掩體隧道', align: 'start' },
  { x: 74, y: 38, text: '主砲炮台基座', align: 'end' },
  { x: 12, y: 38, text: '預備陣地', align: 'start' },
  { x: 86, y: 22, text: '指揮碉堡入口', align: 'end' },
  { x: 40, y: 22, text: '後送公路', align: 'middle' },
  { x: 62, y: 70, text: '終局旗桿區', align: 'end' },
  { x: 48, y: 58, text: '星火焰集束點', align: 'middle' },
  { x: 8, y: 72, text: '防線心臟區', align: 'start' },
  { x: 90, y: 72, text: '核心神力障壁', align: 'end' },
];

const BY_CHAPTER: Readonly<Record<number, readonly MissionBackdropGeographyLabel[]>> = {
  1: CHAPTER_1,
  2: CHAPTER_2,
  3: CHAPTER_3,
  4: CHAPTER_4,
  5: CHAPTER_5,
  6: CHAPTER_6,
  7: CHAPTER_7,
  8: CHAPTER_8,
  9: CHAPTER_9,
  10: CHAPTER_10,
};

export function missionBackdropGeographyLabels(chapter: number): readonly MissionBackdropGeographyLabel[] {
  return BY_CHAPTER[chapter] ?? [];
}
