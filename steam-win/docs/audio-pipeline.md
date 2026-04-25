# 音訊管線規範（純合成 + 完整管線骨架）

## 概念圖

```text
 emit(eventKey, params)
        │
        ▼
  AudioEngine (單例 ctx)
        │
        ├──► synths/<synthId>   （動態 import；命中 cache）
        │        │
        │        ▼
        │   連到 busNode（ui/sfx/vo/bgm）
        │
        ▼
  bus.input (GainNode)  ── userGain × duckMul
        │
        ▼
  MasterBus (GainNode)
        │
        ▼
  Limiter (DynamicsCompressor)
        │
        ▼
  ctx.destination
```

## 核心規則

- 所有音效必須透過 `emit('<key>', params?)`，嚴禁再直接 `new AudioContext` / `createOscillator`。
- 合成器只能 `connect` 到 engine 傳入的 `busNode`，不可接 `ctx.destination`。
- 事件一律登記於 [renderer/src/audio/audioEventCatalog.ts](../renderer/src/audio/audioEventCatalog.ts)。
- 使用者設定一律走 `home/homeSettingsStorage.ts`，播放端不要讀 localStorage。

## 事件命名

格式：`<domain>.<scene|system>.<action>`

- `domain`：`ui` / `vo` / `game` / `bgm`
- `scene|system`：UI 區塊、關卡系統、或章節別名
- `action`：短動詞；避免中文、空白與破折號

範例：`ui.menu.hover`、`game.mine.explode`、`bgm.combat.loop`

## Bus 分配

| bus | 典型事件 | 預設 gain |
|-----|----------|----------|
| `ui` | hover / click / confirm | 0.9 |
| `sfx` | 戰鬥、爆炸、倒數 | 1.0 |
| `vo` | 電報、語音 | 1.0 |
| `bgm` | 場景循環 | 0.55 |
| `master` | 全域 | 0.7 |

## Ducking

- catalog 的 `duck` 欄位會在事件觸發時自動壓制指定 bus。
- 多重 duck 取 `min(gainMul)`，避免多事件時總音量被擊穿。
- 需要非事件型 duck（例如對話框開啟）時使用 [useAudioDuck](../renderer/src/audio/useAudioDuck.ts)。

## 新增事件流程

1. 在 `audioEventCatalog.ts` 的 `AUDIO_EVENT_CATALOG` 加 entry。
2. 在 `AudioEventParamsMap` 加對應 params 型別（無參數用 `void`）。
3. 在 `audio/synths/<synthId>.ts` 實作 `SynthModule`（只能接 `busNode`）。
4. 在 `AudioEngine.ts` 的 `SYNTH_LOADERS` 註冊動態 import。
5. 呼叫點使用 `emit('your.event.key', params)`。
6. 跑 `node scripts/audit-audio.mjs` 確認 0 missing / 0 blocked。

## BGM 掛載

使用 [useBgmChannel](../renderer/src/audio/useBgmChannel.ts)：

```tsx
useBgmChannel('base');    // Home
useBgmChannel('mission'); // 作戰地圖
useBgmChannel('combat');  // 對局
```

- 切換場景時會自動淡出舊 BGM、淡入新 BGM。
- 離開遊戲或要強制靜音：`AudioEngine.stopAllLoops()`.

## 設定

- `HomeSettings.buses`：`master / ui / sfx / vo / bgm`，0~1。
- `applyAudioBusSettings(buses)` 一次同步到 engine。
- 舊 `md:masterVolume` 會自動遷移到 `md:audioBuses.master`，只遷一次。

## 稽核腳本

```bash
node scripts/audit-audio.mjs            # 產出報表
node scripts/audit-audio.mjs --strict   # blocked/missing > 0 時退出碼 1
```

報表位置：`steam-win/audio-audit-report.json`

| 類別 | 意義 |
|-----|------|
| `blocked` | 非 `audio/**` 仍直接用 Web Audio 原生 API |
| `needs-fix` | 仍呼叫舊 shim（`playHoverBeep` 等）|
| `missing` | `emit('x')` 的 key 未登記在 catalog |
| `orphan` | catalog 已定義卻沒任何呼叫點 |

## 未來接真素材的替換路徑（不改 API）

1. 在 `audio/synths/<synthId>.ts` 改為 `AudioBufferSourceNode` 播檔；
2. 首次 `playOn` 時 lazy fetch + decode，之後 cache `AudioBuffer`；
3. catalog 的 eventKey 與 params 不動，呼叫端完全無感。

## 反例（禁止）

- 直接在 component 裡 `new AudioContext()`：請用 engine。
- 在 catalog 以外「硬寫」事件 key 字串並包裝新 emitter：請登記到 catalog 再用。
- BGM 自行用 `setInterval` 合成：請加進 `audio/synths/` 並在 catalog `loop: true`。
