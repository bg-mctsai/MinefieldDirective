# 外置 JSON 契約與驗證

## map 檔契約

```json
{
  "mapLayout": { "...": "..." },
  "mapTheme": "關卡選擇畫面一句主題"
}
```

- `mapTheme` 會被注入到 `LevelDefinition.mapTheme` 並顯示在關卡卡片。
- `mapLayout` 若與 `levels.json` 內嵌同時存在，以內嵌為準，避免雙源維護。

## 座標合法性（硬性）

- `digitOutposts[]`：必須在邊界內，且不可落在 `forbiddenCells`。
- `blastPoints[].pos`：同上。
- `forcedMineCells[]`：同上。
- TRIANGLE/HEXAGON 以 `placeholder.width/height` 為有效邊界。

## 驗證命令

```bash
cd steam-win
node scripts/validate-map-constraints.mjs
```

- 若需依 playable × coverage 回寫秒數可用 `--write-times`，但會重寫 41～99 的 `timeLimit`（L100 保留）。
