/**
 * 局內音效：最後 N 秒倒數、放置數字、時盡（Web Audio，無外部音檔）
 */
let audioCtx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

/** 剩餘 s 秒時播一次滴答；數字越小頻率略升 */
export function playCountdownTick(remainingSeconds: number, volume01 = 0.22) {
  if (remainingSeconds <= 0 || volume01 <= 0) return;
  const ctx = ensureCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const peak = 0.038 * Math.min(1, Math.max(0, volume01));
  const urgency = Math.max(0, 11 - Math.min(10, remainingSeconds));
  const freq = 380 + urgency * 42;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq * 1.08, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.92, t + 0.038);

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peak, t + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0007, t + 0.07);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.08);
}

/** 時限歸零當下短促警示 */
export function playTimeUpChirp(volume01 = 0.28) {
  if (volume01 <= 0) return;
  const ctx = ensureCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const peak = 0.045 * Math.min(1, Math.max(0, volume01));

  for (let i = 0; i < 2; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const f0 = i === 0 ? 520 : 310;
    osc.frequency.setValueAtTime(f0, t + i * 0.055);
    gain.gain.setValueAtTime(0, t + i * 0.055);
    gain.gain.linearRampToValueAtTime(peak * 0.9, t + i * 0.055 + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0007, t + i * 0.055 + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t + i * 0.055);
    osc.stop(t + i * 0.055 + 0.11);
  }
}

/** 數字安放到格子上：略帶金屬感的「喀」 */
export function playPlaceNumberSound(value: number, volume01 = 0.26) {
  if (volume01 <= 0) return;
  const ctx = ensureCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const peak = 0.042 * Math.min(1, Math.max(0, volume01));
  const v = Math.min(9, Math.max(0, Math.floor(value)));
  const f = 420 + v * 38;

  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc2.type = 'sine';
  osc.frequency.setValueAtTime(f * 1.12, t);
  osc.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.09);
  osc2.frequency.setValueAtTime(f * 2.02, t);
  osc2.frequency.exponentialRampToValueAtTime(f * 1.4, t + 0.05);

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peak, t + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.1);

  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc2.start(t);
  osc.stop(t + 0.11);
  osc2.stop(t + 0.08);
}
