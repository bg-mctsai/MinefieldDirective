# TimeLimit 公式與估算

## 核心公式

```text
playableCells = width × height - len(forbiddenCells)
timeLimit = round(playableCells × coverageGoal × k)
```

## 設計解讀

- playable 越大、coverage 越高，timeLimit 應該越長。
- forbidden 增加通常代表空間壓力變高，但不代表一定要縮更短秒數；要看章節目標。
- `k` 是章節節奏旋鈕：同章可小幅調整，不建議跨章共用同值。

## 實務建議

- 先用公式算初值，再用章內遞增規則做二次修正。
- 當 playable 跳級（例如 10×10 -> 11×11）時，timeLimit 需要階梯式上調避免體感斷層。
- 若 coverage 同步上升，至少確認 timeLimit 不會反向下降。
