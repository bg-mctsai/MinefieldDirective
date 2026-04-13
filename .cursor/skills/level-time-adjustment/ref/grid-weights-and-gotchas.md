# Grid / Weights 合法性

## `commands.weights` 鍵上限

| `gridSystem` | 允許數字範圍 | 可用鍵 |
|---|---|---|
| TRIANGLE | 1～3 | `"1"`, `"2"`, `"3"` |
| HEXAGON | 1～6 | `"1"` ... `"6"` |
| SQUARE | 1～8 | `"1"` ... `"8"` |

## 強制規則

- 這是上限，不是必須全開。
- 只要改 `gridSystem` 或 `mapLayout.type`，就要同步修剪超出上限的鍵。
- 不合法的 weights 會讓 `generateHand` 產生無法放置指令，直接破壞可玩性。

## 快速檢查

- 先看關卡最終 `gridSystem`。
- 再比對 `commands.weights` 最大鍵。
- 批次改動時，把這個檢查放進 patch script 的最後一步。
