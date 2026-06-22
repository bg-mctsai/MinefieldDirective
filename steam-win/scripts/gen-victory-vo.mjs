/**
 * 戰場勝利 VO 產生器（純文字 TTS + 裁切靜音 + 無線電後製）
 * 用法：node scripts/gen-victory-vo.mjs
 */
import { execFileSync } from 'child_process';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import ffmpegPath from 'ffmpeg-static';
import { EdgeTTS } from 'node-edge-tts/dist/edge-tts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../renderer/src/assets/audio');
const workDir = join(tmpdir(), `md-victory-vo-${Date.now()}`);
mkdirSync(workDir, { recursive: true });

const voice = 'zh-CN-YunjianNeural';
const lang = 'zh-CN';

/** 渾厚隊長：興奮宣告 → 豪爽大笑 → 拍肩稱讚 */
const segments = [
  { name: 'a', text: '太棒了！我們贏啦！', rate: '+6%', pitch: '-8Hz', pauseAfter: 0.28 },
  { name: 'b', text: '哈！哈哈哈！', rate: '-4%', pitch: '-16Hz', pauseAfter: 0.22 },
  { name: 'c', text: '幹得好，兄弟們！', rate: '-8%', pitch: '-12Hz', pauseAfter: 0 },
];

function runFfmpeg(args) {
  try {
    execFileSync(ffmpegPath, args, { encoding: 'utf8' });
  } catch (e) {
    const msg = String(e.stderr ?? e.stdout ?? e.message);
    if (!args.includes('-f') || !args.includes('null')) throw e;
    if (!/Duration:/.test(msg) && e.status !== 1) throw e;
  }
}

function probeDuration(file) {
  try {
    execFileSync(ffmpegPath, ['-i', file], { encoding: 'utf8' });
  } catch (e) {
    const m = String(e.stderr ?? '').match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
    if (!m) return 0;
    return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  }
  return 0;
}

async function synthSegment(seg) {
  const tts = new EdgeTTS({ voice, lang, rate: seg.rate, pitch: seg.pitch, volume: '+6%' });
  const raw = join(workDir, `${seg.name}_raw.mp3`);
  await tts.ttsPromise(seg.text, raw);
  const trimmed = join(workDir, `${seg.name}_trim.mp3`);
  runFfmpeg([
    '-y',
    '-i',
    raw,
    '-af',
    [
      'silenceremove=stop_periods=-1:stop_duration=0.18:stop_threshold=-42dB',
      'areverse',
      'silenceremove=stop_periods=-1:stop_duration=0.12:stop_threshold=-42dB',
      'areverse',
      'highpass=f=260',
      'lowpass=f=3800',
      'acompressor=threshold=-22dB:ratio=4:attack=5:release=70',
      'volume=1.25',
    ].join(','),
    '-acodec',
    'libmp3lame',
    '-q:a',
    '3',
    trimmed,
  ]);
  const dur = probeDuration(trimmed);
  console.log(`  ${seg.name}: ${seg.text} → ${dur.toFixed(2)}s`);
  return trimmed;
}

async function main() {
  console.log('Synthesizing segments…');
  const processed = [];
  for (const seg of segments) {
    const file = await synthSegment(seg);
    processed.push({ file, pauseAfter: seg.pauseAfter });
  }

  const breath = join(workDir, 'breath.mp3');
  runFfmpeg([
    '-y',
    '-f',
    'lavfi',
    '-i',
    'anoisesrc=d=0.38:c=pink:a=0.016',
    '-af',
    'highpass=f=160,lowpass=f=850,afade=t=in:st=0:d=0.08,afade=t=out:st=0.24:d=0.14,volume=2.0',
    '-acodec',
    'libmp3lame',
    '-q:a',
    '5',
    breath,
  ]);

  const listPath = join(workDir, 'concat.txt');
  const lines = [`file '${breath.replace(/\\/g, '/')}'`];
  for (const p of processed) {
    lines.push(`file '${p.file.replace(/\\/g, '/')}'`);
    if (p.pauseAfter > 0) {
      const silence = join(workDir, `gap_${lines.length}.mp3`);
      runFfmpeg([
        '-y',
        '-f',
        'lavfi',
        '-i',
        `anullsrc=r=24000:cl=mono:d=${p.pauseAfter}`,
        '-acodec',
        'libmp3lame',
        '-q:a',
        '9',
        silence,
      ]);
      lines.push(`file '${silence.replace(/\\/g, '/')}'`);
    }
  }
  writeFileSync(listPath, lines.join('\n'));

  const merged = join(workDir, 'merged.mp3');
  runFfmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-acodec', 'copy', merged]);

  const finalPath = join(outDir, 'vo_combat_victory_we_won.mp3');
  runFfmpeg([
    '-y',
    '-i',
    merged,
    '-af',
    [
      'highpass=f=300',
      'lowpass=f=3400',
      'equalizer=f=200:width_type=o:width=1.3:g=2.8',
      'equalizer=f=950:width_type=o:width=1.4:g=1.0',
      'acompressor=threshold=-18dB:ratio=3.2:attack=8:release=110',
      'alimiter=limit=0.9',
      'afade=t=0.03:st=0:d=0.03',
      'afade=t=0.2:st=0:d=0.2',
    ].join(','),
    '-acodec',
    'libmp3lame',
    '-q:a',
    '3',
    finalPath,
  ]);

  const total = probeDuration(finalPath);
  console.log(`Wrote ${finalPath} (${total.toFixed(2)}s)`);
  rmSync(workDir, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
