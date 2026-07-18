#!/usr/bin/env node
/**
 * 遞增 web demo 顯示版本（patch +1）。
 * 用法（repo 根目錄）：node .cursor/skills/commit-push-version/scripts/bump-app-version.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const constantsFile = path.join(repoRoot, 'steam-win/renderer/src/home/constants.ts');

const content = fs.readFileSync(constantsFile, 'utf8');
const match = content.match(/export const HOME_APP_VERSION = '(v(\d+)\.(\d+)\.(\d+))'/);
if (!match) {
  console.error('找不到 HOME_APP_VERSION，預期格式：export const HOME_APP_VERSION = \'v1.0.0\'');
  process.exit(1);
}

const [, current, major, minor, patch] = match;
const next = `v${major}.${minor}.${Number(patch) + 1}`;
const nextContent = content.replace(
  /export const HOME_APP_VERSION = 'v\d+\.\d+\.\d+'/,
  `export const HOME_APP_VERSION = '${next}'`,
);

fs.writeFileSync(constantsFile, nextContent);
console.log(`${current} → ${next}`);
