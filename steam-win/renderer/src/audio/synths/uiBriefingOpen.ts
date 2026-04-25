import type { SynthModule } from '../synthContract';
import { UI_TIMBRE } from './uiTimbre';

/**
 * 行動卷宗展開音：760→520Hz triangle（翻開張力）+ 短帶通白噪（紙張質感）。
 * 能量略高於 hover/confirm，傳遞「打開機密檔案」的儀式感。
 */
const mod: SynthModule = {
  playOn(ctx, bus) {
    const t = ctx.currentTime;

    // 第一段翻頁主體
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(760, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.12);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(UI_TIMBRE.briefing.openPeak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.16);
    osc.connect(g);
    g.connect(bus);
    osc.start(t);
    osc.stop(t + 0.17);

    // 第二段翻頁尾音，讓「開卷」更有層次
    const t2 = t + 0.03;
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(640, t2);
    osc2.frequency.exponentialRampToValueAtTime(430, t2 + 0.1);
    g2.gain.setValueAtTime(0, t2);
    g2.gain.linearRampToValueAtTime(UI_TIMBRE.briefing.openPeak * 0.62, t2 + 0.01);
    g2.gain.exponentialRampToValueAtTime(0.0008, t2 + 0.14);
    osc2.connect(g2);
    g2.connect(bus);
    osc2.start(t2);
    osc2.stop(t2 + 0.15);

    const dur = 0.08;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * 0.4;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2400;
    bp.Q.value = 1.2;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0, t);
    ng.gain.linearRampToValueAtTime(UI_TIMBRE.briefing.openNoisePeak, t + 0.006);
    ng.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    noise.connect(bp);
    bp.connect(ng);
    ng.connect(bus);
    noise.start(t);
    noise.stop(t + dur);
  },
};

export default mod;
