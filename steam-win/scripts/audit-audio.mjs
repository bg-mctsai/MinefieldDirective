#!/usr/bin/env node
/**
 * 音效審計：
 * - `blocked`:  非 `renderer/src/audio/**` 的檔案直接 `createOscillator` / `new AudioContext`
 * - `needs-fix`: 直接呼叫舊 shim API（playHoverBeep / playTimeUpChirp / ...）
 * - `missing`:  程式出現的 emit('x') 未在 catalog 中定義
 * - `orphan`:   catalog 定義但全專案零呼叫
 *
 * 輸出：
 * - stdout 摘要
 * - `steam-win/audio-audit-report.json`
 *
 * 退出碼：
 * - `--strict` 時，若 blocked > 0 或 missing > 0 則回傳 1
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = join(ROOT, 'renderer', 'src');
const AUDIO_DIR = join(SRC, 'audio');
const CATALOG_PATH = join(AUDIO_DIR, 'audioEventCatalog.ts');
const REPORT_PATH = join(ROOT, 'audio-audit-report.json');

const LEGACY_APIS = [
  'playHoverBeep',
  'playMissionEnterConfirmBeep',
  'playCountdownTick',
  'playTimeUpChirp',
  'playPlaceNumberSound',
  'playExplosionPop',
];

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
      out.push(...(await walk(p)));
    } else if (/\.(ts|tsx|js|mjs)$/.test(ent.name)) {
      out.push(p);
    }
  }
  return out;
}

async function parseCatalogKeys() {
  const src = await readFile(CATALOG_PATH, 'utf8');
  const body = src.split('AUDIO_EVENT_CATALOG')[1] ?? '';
  const keyRe = /['"]([a-z0-9]+\.[a-z0-9]+\.[a-zA-Z0-9]+)['"]\s*:\s*\{/g;
  const keys = new Set();
  let m;
  while ((m = keyRe.exec(body))) keys.add(m[1]);
  return keys;
}

function isInAudioDir(file) {
  const rel = relative(AUDIO_DIR, file);
  return !rel.startsWith('..') && !rel.startsWith('/') && !rel.startsWith('\\');
}

async function main() {
  const files = await walk(SRC);
  const catalogKeys = await parseCatalogKeys();

  const blocked = [];
  const needsFix = [];
  const missing = [];
  const usedKeys = new Set();

  const emitRe = /\b(?:emit|startLoop|stopLoop)\(\s*['"]([a-z0-9]+\.[a-z0-9]+\.[a-zA-Z0-9]+)['"]/g;
  const legacyRe = new RegExp(`\\b(${LEGACY_APIS.join('|')})\\s*\\(`, 'g');
  const rawRe = /\b(createOscillator|new\s+AudioContext|webkitAudioContext|createBufferSource)\b/;

  for (const file of files) {
    const text = await readFile(file, 'utf8');
    const relPath = relative(ROOT, file).replace(/\\/g, '/');

    // emit 使用
    let m;
    while ((m = emitRe.exec(text))) {
      const key = m[1];
      usedKeys.add(key);
      if (!catalogKeys.has(key)) {
        missing.push({ file: relPath, key });
      }
    }
    emitRe.lastIndex = 0;

    // 在 audio/** 內，只要字串字面量出現 catalog key 亦視為使用（BGM map 常數）
    if (isInAudioDir(file) && file !== CATALOG_PATH) {
      for (const key of catalogKeys) {
        const re = new RegExp(`['"\`]${key.replace(/\./g, '\\.')}['"\`]`);
        if (re.test(text)) usedKeys.add(key);
      }
    }

    // legacy API 呼叫
    while ((m = legacyRe.exec(text))) {
      // 忽略定義處：shim 檔自己的 export
      if (/^\s*export\s+function\s+/m.test(text.slice(Math.max(0, m.index - 40), m.index))) {
        continue;
      }
      needsFix.push({ file: relPath, api: m[1] });
    }
    legacyRe.lastIndex = 0;

    // 直接使用原生音訊 API 而且不在 audio/**
    if (!isInAudioDir(file) && rawRe.test(text)) {
      // 排除 shim 檔（已被識別為 needs-fix 目標）
      if (!/^\s*\/\*\*[\s\S]*?@deprecated/m.test(text)) {
        blocked.push({ file: relPath });
      }
    }
  }

  const orphan = [];
  for (const k of catalogKeys) {
    if (!usedKeys.has(k)) orphan.push({ key: k });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      blocked: blocked.length,
      needsFix: needsFix.length,
      missing: missing.length,
      orphan: orphan.length,
      catalogKeys: catalogKeys.size,
      usedKeys: usedKeys.size,
    },
    blocked,
    needsFix,
    missing,
    orphan,
  };

  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  const lines = [];
  lines.push('音效審計報表');
  lines.push('─'.repeat(48));
  lines.push(`catalog keys : ${catalogKeys.size}`);
  lines.push(`used keys    : ${usedKeys.size}`);
  lines.push(`blocked      : ${blocked.length}`);
  lines.push(`needs-fix    : ${needsFix.length}`);
  lines.push(`missing      : ${missing.length}`);
  lines.push(`orphan       : ${orphan.length}`);
  lines.push('─'.repeat(48));
  if (blocked.length) {
    lines.push('[BLOCKED] 非 audio/** 仍直接使用 Web Audio 原生 API：');
    for (const b of blocked) lines.push(`  - ${b.file}`);
  }
  if (needsFix.length) {
    lines.push('[NEEDS-FIX] 仍呼叫舊 shim API：');
    for (const n of needsFix) lines.push(`  - ${n.file} :: ${n.api}`);
  }
  if (missing.length) {
    lines.push('[MISSING] emit 的 key 未在 catalog：');
    for (const m2 of missing) lines.push(`  - ${m2.file} :: ${m2.key}`);
  }
  if (orphan.length) {
    lines.push('[ORPHAN] catalog 有定義但零呼叫：');
    for (const o of orphan) lines.push(`  - ${o.key}`);
  }
  lines.push('');
  lines.push(`report: ${relative(ROOT, REPORT_PATH).replace(/\\/g, '/')}`);

  console.log(lines.join('\n'));

  if (process.argv.includes('--strict')) {
    if (blocked.length > 0 || missing.length > 0) process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
