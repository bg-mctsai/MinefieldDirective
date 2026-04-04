# 🧩 混合地形邏輯規範 (Mixed Grid Logic)

## 1. 節點定義 (Node Structure)
每個格子（不論形狀）都是一個物件：
```json
{
  "id": "node_101",
  "shape": "HEXAGON", 
  "position": { "x": 100, "y": 200 }, // 畫布上的絕對座標
  "neighbors": ["node_100", "node_102", "node_square_50"], // 鄰居 ID 清單
  "content": {
    "hasMine": false,
    "isRevealed": true,
    "targetNumber": 3 // 判定邏輯：這 3 顆雷必須出現在 neighbors 清單中
  }
}