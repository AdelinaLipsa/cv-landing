// An original pixel lofi loop, made live with Web Audio. No audio files.
// 8-bit voices (square, triangle) through a warm lowpass, swung drums, vinyl crackle.
// Plays for 10 minutes, then fades out.

import { bus } from "./audioBus";

const BPM = 72;
const BEAT = 60 / BPM;
const STEP = BEAT / 4; // sixteenths
const SWING = 0.18; // push every second sixteenth late
const LENGTH = 10 * 60; // seconds

// Fmaj7, Em7, Dm7, Cmaj7: the lofi staircase. MIDI notes.
const CHORDS = [
  [53, 57, 60, 64],
  [52, 55, 59, 62],
  [50, 53, 57, 60],
  [48, 52, 55, 59],
];
const SCALE = [60, 62, 64, 67, 69, 72, 74, 76]; // C major pentatonic-ish for the lead

const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);

// Deterministic "random" so each bar varies but the loop is repeatable.
const rnd = (n: number) => {
  const x = Math.sin(n * 91.345) * 47453.5453;
  return x - Math.floor(x);
};

export type Lofi = { stop: () => void; ctx: AudioContext };

export function startLofi(onEnd: () => void): Lofi {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 3); // fade in
  const warm = ctx.createBiquadFilter();
  warm.type = "lowpass";
  warm.frequency.value = 1900;
  warm.Q.value = 0.4;
  master.connect(warm).connect(ctx.destination);
  // What the photo's equaliser reads.
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.72;
  // Measured: bass peaks near -45 dB, the snare, lead and harmonics sit around -72 to -88 dB.
  analyser.minDecibels = -100;
  analyser.maxDecibels = -55;
  warm.connect(analyser);
  bus.analyser = analyser;

  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  // Vinyl crackle: sparse clicks over a quiet hiss, looped.
  const crackleBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const cd = crackleBuf.getChannelData(0);
  for (let i = 0; i < cd.length; i++) cd[i] = (Math.random() * 2 - 1) * 0.012 + (Math.random() < 0.0006 ? (Math.random() - 0.5) * 0.7 : 0);
  const crackle = ctx.createBufferSource();
  crackle.buffer = crackleBuf;
  crackle.loop = true;
  const crackleGain = ctx.createGain();
  crackleGain.gain.value = 0.5;
  crackle.connect(crackleGain).connect(master);
  crackle.start();

  const tone = (type: OscillatorType, freq: number, t: number, dur: number, vol: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = (rnd(t) - 0.5) * 14; // tape wobble
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  };

  const hit = (t: number, f: number, dur: number, vol: number, type: BiquadFilterType) => {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const flt = ctx.createBiquadFilter();
    flt.type = type;
    flt.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(flt).connect(g).connect(master);
    s.start(t);
    s.stop(t + dur);
  };

  const kick = (t: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.32);
  };

  const t0 = ctx.currentTime + 0.1;
  let step = 0;

  const schedule = (i: number, t: number) => {
    const bar = Math.floor(i / 16);
    const s = i % 16;
    const chord = CHORDS[bar % 4];
    // Drums: kick on 1 and the "and" of 3, snare on 2 and 4, soft hats on eighths.
    if (s === 0 || s === 10 || (s === 7 && rnd(bar) > 0.6)) kick(t);
    if (s === 4 || s === 12) hit(t, 1800, 0.18, 0.35, "bandpass");
    if (s % 2 === 0) hit(t, 7000, 0.04, s % 4 ? 0.06 : 0.1, "highpass");
    // Chord stabs, triangle, on 1 and a lazy late 3.
    if (s === 0 || s === 9) chord.forEach((n) => tone("triangle", hz(n), t, BEAT * 1.6, 0.05));
    // Bass, square an octave down.
    if (s === 0) tone("square", hz(chord[0] - 12), t, BEAT * 1.4, 0.05);
    if (s === 8) tone("square", hz(chord[1] - 12), t, BEAT * 0.9, 0.04);
    // Lead: sparse pentatonic plinks, different every bar.
    if (bar % 8 >= 2 && s % 2 === 0 && rnd(i) > 0.62) tone("square", hz(SCALE[Math.floor(rnd(i + 7) * SCALE.length)]), t, STEP * 3, 0.025);
  };

  const tick = setInterval(() => {
    const ahead = ctx.currentTime + 0.2;
    while (true) {
      const t = t0 + step * STEP + (step % 2 ? STEP * SWING : 0);
      if (t > ahead) break;
      if (t - t0 < LENGTH) schedule(step, t);
      step++;
    }
    if (ctx.currentTime - t0 > LENGTH) stop();
  }, 50);

  let stopped = false;
  function stop() {
    if (stopped) return;
    stopped = true;
    clearInterval(tick);
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 1.5);
    setTimeout(() => { if (bus.analyser === analyser) bus.analyser = null; ctx.close(); onEnd(); }, 1700);
  }

  return { stop, ctx };
}
