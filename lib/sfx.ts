// Chiptune sound effects for the arcade, synthesised on the fly: no audio files.
// The context is created on the first sound, which always follows a click into a game (the site's audio opt-in).
// Big moments also buzz the phone (Android; iOS Safari has no vibration API). One toggle mutes both, remembered per visitor.
const KEY = "cv-arcade-sound";
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = (() => { try { return localStorage.getItem(KEY) === "off"; } catch { return false; } })();

const out = () => {
  if (muted || typeof window === "undefined") return null;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.18;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
};

// One blip: a wave that slides from `from` to `to` Hz and fades out.
const tone = (from: number, to: number, dur: number, type: OscillatorType = "square", vol = 0.5, delay = 0) => {
  const c = out();
  if (!c || !master) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
};

// White noise through a low-pass that closes: explosions, punches, thuds.
const noise = (dur: number, vol = 0.6, cutoff = 2400, delay = 0) => {
  const c = out();
  if (!c || !master) return;
  const t = c.currentTime + delay;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  src.buffer = buf;
  f.type = "lowpass";
  f.frequency.setValueAtTime(cutoff, t);
  f.frequency.exponentialRampToValueAtTime(80, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
};

const buzz = (pattern: number | number[]) => { if (!muted) try { navigator.vibrate?.(pattern); } catch { } };

const arp = (notes: number[], step: number, type: OscillatorType = "square", vol = 0.35) =>
  notes.forEach((n, i) => tone(n, n, step * 1.6, type, vol, i * step));

// A soft synth pad for the retro computer's startup and shutdown: an original chime in the spirit of the old
// OS startup sounds (not a copy of any of them). Detuned saws through a low-pass that opens, then a long release,
// into a small echo so it blooms. `notes` in Hz, `at` seconds from now.
const pad = (notes: number[], at: number, dur: number, vol = 0.16, open = 2600) => {
  const c = out();
  if (!c || !master) return;
  const t = c.currentTime + at;
  const f = c.createBiquadFilter(), g = c.createGain(), echo = c.createDelay(), fb = c.createGain(), wet = c.createGain();
  f.type = "lowpass";
  f.frequency.setValueAtTime(320, t);
  f.frequency.exponentialRampToValueAtTime(open, t + dur * 0.45);
  f.frequency.exponentialRampToValueAtTime(500, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  echo.delayTime.value = 0.23; fb.gain.value = 0.38; wet.gain.value = 0.45;
  f.connect(g);
  g.connect(master);
  g.connect(echo).connect(fb).connect(echo);
  echo.connect(wet).connect(master);
  for (const n of notes) for (const cents of [-7, 7]) {
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = n;
    o.detune.value = cents;
    o.connect(f);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
};
const bell = (n: number, at: number, vol = 0.22) => { tone(n, n, 1.4, "sine", vol, at); tone(n * 2, n * 2, 0.7, "sine", vol * 0.25, at); };

export const sfx = {
  // Startup: a Dmaj9 swell, a rising sparkle of bells, and a low D to settle on. About four seconds.
  boot: () => {
    pad([146.83, 220, 277.18, 329.63, 369.99], 0, 3.6, 0.14); // D3 A3 C#4 E4 F#4
    [880, 1108.73, 1318.51, 1479.98].forEach((n, i) => bell(n, 0.7 + i * 0.22)); // A5 C#6 E6 F#6
    pad([73.42, 110], 1.6, 2.6, 0.12, 900); // D2 A2 underneath
  },
  // Shutdown: the same colours, falling and closing.
  shutdown: () => {
    [1318.51, 1108.73, 880, 659.25].forEach((n, i) => bell(n, i * 0.18, 0.16));
    pad([146.83, 220, 293.66], 0.2, 2.2, 0.11, 1200);
  },
  // The messenger's "uh-oh": a voice-ish two-note drop, up then down.
  uhoh: () => { tone(380, 420, 0.13, "triangle", 0.55); tone(300, 230, 0.24, "triangle", 0.55, 0.17); },
  laser: () => tone(1400, 380, 0.07, "square", 0.12),
  blast: () => tone(900, 200, 0.09, "square", 0.22),
  charged: () => { tone(220, 1400, 0.18, "sawtooth", 0.3); noise(0.15, 0.25, 4000); },
  jump: () => tone(260, 640, 0.12, "square", 0.25),
  pop: () => { noise(0.18, 0.45, 3000); tone(420, 90, 0.15, "square", 0.2); },
  boom: () => { noise(0.6, 0.8, 1800); tone(160, 30, 0.5, "sawtooth", 0.35); buzz(140); },
  hurt: () => { tone(320, 70, 0.25, "square", 0.35); noise(0.12, 0.3, 1500); buzz(70); },
  tink: () => tone(2200, 1800, 0.05, "triangle", 0.3),
  power: () => arp([523, 659, 784, 1047], 0.05),
  coin: () => arp([988, 1319], 0.06, "square", 0.25),
  wave: () => arp([392, 523, 659], 0.08, "triangle", 0.4),
  warning: () => [0, 0.3, 0.6, 0.9].forEach((d) => { tone(660, 660, 0.14, "square", 0.25, d); tone(440, 440, 0.14, "square", 0.25, d + 0.15); }),
  thud: () => { noise(0.2, 0.5, 600); tone(110, 40, 0.2, "sine", 0.6); buzz(30); },
  punch: () => { noise(0.08, 0.6, 2600); tone(180, 70, 0.08, "square", 0.3); buzz(20); },
  kick: () => { noise(0.12, 0.7, 1600); tone(140, 50, 0.12, "square", 0.35); buzz(35); },
  block: () => { tone(1200, 900, 0.06, "triangle", 0.3); noise(0.05, 0.2, 5000); },
  fireball: () => { tone(200, 520, 0.25, "sawtooth", 0.3); noise(0.3, 0.3, 1200); },
  ko: () => { noise(0.9, 0.7, 1400); tone(300, 40, 0.9, "sawtooth", 0.4); buzz([90, 50, 200]); },
  purr: () => { for (let i = 0; i < 9; i++) noise(0.07, 0.35, 380, i * 0.1); buzz([15, 70, 15, 70, 15, 70, 15]); },
  win: () => { arp([523, 659, 784, 1047, 784, 1047, 1319], 0.09, "square", 0.3); buzz([40, 40, 40, 40, 140]); },
  lose: () => { arp([494, 440, 392, 330, 262], 0.14, "triangle", 0.4); buzz(250); },
};

export const isMuted = () => muted;
export const setMuted = (m: boolean) => {
  muted = m;
  try { localStorage.setItem(KEY, m ? "off" : "on"); } catch { }
  if (m) ctx?.suspend();
};
