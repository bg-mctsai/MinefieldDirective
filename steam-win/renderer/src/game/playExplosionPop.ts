/** 單顆地雷「啪」一聲：短促低頻脈衝，不依賴外部音檔 */
let audioCtx: AudioContext | null = null;

export function playExplosionPop(stepIndex: number, volume01 = 0.38) {
  if (volume01 <= 0) return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    const ctx = audioCtx;
    if (ctx.state === 'suspended') void ctx.resume();

    const t = ctx.currentTime;
    const peak = 0.055 * Math.min(1, Math.max(0, volume01));
    const base = 95 + (stepIndex % 5) * 18;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(base * 1.4, t);
    osc.frequency.exponentialRampToValueAtTime(base * 0.55, t + 0.045);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0009, t + 0.11);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);

    const noiseDur = 0.055;
    const noiseBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * noiseDur), ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * 0.35;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    const ng = ctx.createGain();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 420 + stepIndex * 40;
    bp.Q.value = 0.65;
    ng.gain.setValueAtTime(0, t);
    ng.gain.linearRampToValueAtTime(peak * 0.85, t + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.0009, t + noiseDur);
    noise.connect(bp);
    bp.connect(ng);
    ng.connect(ctx.destination);
    noise.start(t);
    noise.stop(t + noiseDur);
  } catch {
    /* ignore */
  }
}
