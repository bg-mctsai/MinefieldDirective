import type { SynthModule } from '../synthContract';
import { UI_TIMBRE } from './uiTimbre';

const mod: SynthModule = {
  playOn(ctx, bus) {
    const t = ctx.currentTime;
    // tone A: 主確認音
    const oscA = ctx.createOscillator();
    const gainA = ctx.createGain();
    oscA.type = 'triangle';
    oscA.frequency.setValueAtTime(880, t);
    oscA.frequency.exponentialRampToValueAtTime(740, t + 0.09);
    gainA.gain.setValueAtTime(0, t);
    gainA.gain.linearRampToValueAtTime(UI_TIMBRE.confirm.toneAPeak, t + 0.008);
    gainA.gain.exponentialRampToValueAtTime(0.0008, t + 0.115);
    oscA.connect(gainA);
    gainA.connect(bus);
    oscA.start(t);
    oscA.stop(t + 0.12);

    // tone B: 大三度，讓「確認成功」更明確
    const t2 = t + 0.035;
    const oscB = ctx.createOscillator();
    const gainB = ctx.createGain();
    oscB.type = 'sine';
    oscB.frequency.setValueAtTime(1174, t2);
    oscB.frequency.exponentialRampToValueAtTime(988, t2 + 0.07);
    gainB.gain.setValueAtTime(0, t2);
    gainB.gain.linearRampToValueAtTime(UI_TIMBRE.confirm.toneBPeak, t2 + 0.006);
    gainB.gain.exponentialRampToValueAtTime(0.0008, t2 + 0.09);
    oscB.connect(gainB);
    gainB.connect(bus);
    oscB.start(t2);
    oscB.stop(t2 + 0.095);
  },
};

export default mod;
