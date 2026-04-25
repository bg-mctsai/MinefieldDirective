import type { SynthModule } from '../synthContract';
import { UI_TIMBRE } from './uiTimbre';

/**
 * 行動卷宗收起音：反向滑音 + 更短的紙張噪點。
 */
const mod: SynthModule = {
  playOn(ctx, bus) {
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(560, t);
    osc.frequency.exponentialRampToValueAtTime(360, t + 0.085);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(UI_TIMBRE.briefing.closePeak, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.12);
    osc.connect(g);
    g.connect(bus);
    osc.start(t);
    osc.stop(t + 0.13);

    const dur = 0.05;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * 0.3;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1700;
    bp.Q.value = 1.1;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0, t);
    ng.gain.linearRampToValueAtTime(UI_TIMBRE.briefing.closeNoisePeak, t + 0.004);
    ng.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    noise.connect(bp);
    bp.connect(ng);
    ng.connect(bus);
    noise.start(t);
    noise.stop(t + dur);
  },
};

export default mod;

