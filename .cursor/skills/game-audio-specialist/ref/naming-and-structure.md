# 命名與資料夾規範

## 推薦檔名格式

`<type>_<system>_<action>_<variant>_<intensity>_<v###>.wav`

- `type`: `sfx`, `bgm`, `vo`, `amb`
- `system`: `ui`, `player`, `enemy`, `weapon`, `env`, `boss`
- `action`: `click`, `fire`, `hit`, `explode`, `alert`, `loop`
- `variant`: `a`, `b`, `c`...
- `intensity`: `soft`, `mid`, `hard`
- `v###`: `v001`, `v002`

範例：
- `sfx_weapon_fire_a_hard_v001.wav`
- `sfx_enemy_hit_b_mid_v003.wav`
- `bgm_boss_phase2_loop_a_mid_v004.wav`

## 推薦目錄結構

```text
audio/
  sfx/
    ui/
    weapon/
    enemy/
    environment/
  bgm/
    chapter01/
    chapter02/
  vo/
    commander/
    system/
  ambience/
    base/
    battlefield/
```

## 實作注意

- 事件 key 與檔名分離：事件穩定、檔名可演進。
- 禁止空白與中文檔名（跨平台工具鏈常出問題）。
- 變體檔必須同前綴，方便程式隨機抽樣。
- 同事件的素材 loudness 要先對齊再上線。
