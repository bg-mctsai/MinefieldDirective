/**
 * 依序產出第 5～10 章外置地圖（cwd = steam-win）。
 * node scripts/run-gen-ch5-10.mjs
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scripts = [
  'gen-chapter5-7-hex-maps.mjs',
  'gen-chapter8-maps.mjs',
  'gen-chapter9-maps.mjs',
  'gen-chapter10-maps.mjs',
];

for (const s of scripts) {
  const r = spawnSync(process.execPath, [path.join(__dirname, s)], {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
