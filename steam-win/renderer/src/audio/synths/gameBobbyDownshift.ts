import type { SynthModule } from '../synthContract';

/** 波比緊急降碼：短促下滑＋輕確認音 */
const mod: SynthModule = {
  playOn(ctx, bus, params) {
    const from = Number((params as { fromValue?: number } | undefined)?.fromValue ?? 3);
    const to = Number((params as { toValue?: number } | undefined)?.toValue ?? from - 1);
    const t = ctx.currentTime;
    const dropHz = 520 + Math.min(9, Math.max(0, from)) * 28;
    const landHz = 380 + Math.min(9, Math.max(0, to)) * 32;

    const sweep = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweep.type = 'sine';
    sweep.frequency.setValueAtTime(dropHz, t);
    sweep.frequency.exponentialRampToValueAtTime(Math.max(120, landHz), t + 0.14);
    sweepGain.gain.setValueAtTime(0, t);
    sweepGain.gain.linearRampToValueAtTime(0.038, t + 0.02);
    sweepGain.gain.exponentialRampToValueAtTime(0.0006, t + 0.16);
    sweep.connect(sweepGain);
    sweepGain.connect(bus);
    sweep.start(t);
    sweep.stop(t + 0.17);

    const ping = ctx.createOscillator();
    const pingGain = ctx.createGain();
    ping.type = 'triangle';
    ping.frequency.setValueAtTime(landHz * 1.08, t + 0.1);
    ping.frequency.exponentialRampToValueAtTime(landHz * 0.92, t + 0.22);
    pingGain.gain.setValueAtTime(0, t + 0.1);
    pingGain.gain.linearRampToValueAtTime(0.032, t + 0.12);
    pingGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.26);
    ping.connect(pingGain);
    pingGain.connect(bus);
    ping.start(t + 0.1);
    ping.stop(t + 0.27);
  },
};

export default mod;
