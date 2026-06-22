/**
 * 從使用者提供的勝利 VO 裁掉「呼……哈哈！」段落。
 * 保留：哈……太棒了！我們贏啦！！ + 幹得好，兄弟們。
 */
import { execFileSync } from 'child_process';
import ffmpeg from 'ffmpeg-static';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src =
  process.argv[2] ?? 'c:/Users/mingc/Downloads/4f484a76_1782136474_af047e6b_1.mp3';
const out = join(__dirname, '../renderer/src/assets/audio/vo_combat_victory_we_won.mp3');

/** silencedetect 對齊：第一段結束 / 笑聲段 / 收尾句起點 */
const CUT = {
  part1Start: 0.22,
  part1End: 2.38,
  part2Start: 4.91,
  part2End: 5.9,
  crossfadeSec: 0.06,
};

const filterComplex = [
  `[0:a]atrim=start=${CUT.part1Start}:end=${CUT.part1End},asetpts=PTS-STARTPTS,afade=t=out:st=${(CUT.part1End - CUT.part1Start - 0.04).toFixed(3)}:d=0.04[a1]`,
  `[0:a]atrim=start=${CUT.part2Start}:end=${CUT.part2End},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.03[a2]`,
  `[a1][a2]acrossfade=d=${CUT.crossfadeSec}:c1=tri:c2=tri,highpass=f=260,lowpass=f=3800,acompressor=threshold=-20dB:ratio=3:attack=8:release=100,alimiter=limit=0.92[out]`,
].join(';');

execFileSync(
  ffmpeg,
  ['-y', '-i', src, '-filter_complex', filterComplex, '-map', '[out]', '-acodec', 'libmp3lame', '-q:a', '3', out],
  { stdio: 'inherit' },
);

console.log('Wrote', out);
