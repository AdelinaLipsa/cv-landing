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

// An overdriven electric guitar. Each string is a real plucked-string model (Karplus-Strong: a burst of noise
// recirculating through a delay line one period long, averaged each pass so the highs die first), rendered once
// into a buffer and cached. The chord then goes through an amp: a pre-gain, a soft-clip curve, and a speaker-cabinet
// filter (a mid bump, the fizz rolled off). Strings sound a few ms apart, like a downstroke.
const plucks = new Map<number, AudioBuffer>();
const pluck = (c: AudioContext, hz: number) => {
  let buf = plucks.get(hz);
  if (buf) return buf;
  const sr = c.sampleRate, n = Math.ceil(sr * 2.2), N = Math.round(sr / hz);
  buf = c.createBuffer(1, n, sr);
  const out = buf.getChannelData(0), line = new Float32Array(N);
  for (let i = 0; i < N; i++) line[i] = Math.random() * 2 - 1; // the pick: a burst of noise
  for (let i = 0, k = 0; i < n; i++, k = (k + 1) % N) {
    const y = line[k];
    out[i] = y;
    line[k] = 0.996 * 0.5 * (y + line[(k + 1) % N]); // averaged each lap: the highs die first, like a real string
  }
  plucks.set(hz, buf);
  return buf;
};
let curve: Float32Array<ArrayBuffer> | null = null;
const strum = (notes: number[], at = 0, dur = 1.8, vol = 0.5) => {
  const c = out();
  if (!c || !master) return;
  if (!curve) { curve = new Float32Array(2048); for (let i = 0; i < 2048; i++) { const x = i / 1024 - 1; curve[i] = (3 + 12) * x * 0.35 / (Math.PI + 12 * Math.abs(x)); } }
  const t = c.currentTime + at;
  const pre = c.createGain(), drive = c.createWaveShaper(), mid = c.createBiquadFilter(), cab = c.createBiquadFilter(), low = c.createBiquadFilter(), g = c.createGain();
  pre.gain.value = 9;
  drive.curve = curve; drive.oversample = "4x";
  low.type = "highpass"; low.frequency.value = 70;
  mid.type = "peaking"; mid.frequency.value = 900; mid.Q.value = 0.8; mid.gain.value = 5;
  cab.type = "lowpass"; cab.frequency.value = 3600; cab.Q.value = 0.7;
  g.gain.setValueAtTime(vol, t);
  g.gain.setValueAtTime(vol, t + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  pre.connect(drive).connect(low).connect(mid).connect(cab).connect(g).connect(master);
  notes.forEach((n, i) => {
    const src = c.createBufferSource();
    src.buffer = pluck(c, n);
    src.connect(pre);
    src.start(t + i * 0.014);
    src.stop(t + dur + 0.05);
  });
};

// A short recorded clip, fetched and decoded once, played through the same mute.
const clips = new Map<string, Promise<AudioBuffer | null>>();
const sample = (url: string, vol = 4) => {
  const c = out(), m = master;
  if (!c || !m) return;
  let p = clips.get(url);
  if (!p) { p = fetch(url).then((r) => r.arrayBuffer()).then((b) => c.decodeAudioData(b)).catch(() => null); clips.set(url, p); }
  void p.then((b) => {
    if (!b || muted) return;
    const src = c.createBufferSource(), g = c.createGain();
    src.buffer = b; g.gain.value = vol; // the master is set quiet for blips; a voice needs it back up
    src.connect(g).connect(m);
    src.start();
  });
};

export const sfx = {
  // Clicking her: "Hello…"
  hello: () => sample("/sfx/hello.mp3"),
  // Call inside a click: Safari and Chrome only start (or resume) audio from the gesture's own call stack.
  wake: () => { out(); },
  // The red Strat in her room: an E5 power chord, then a quick A5 answer.
  riff: () => { strum([82.41, 123.47, 164.81]); strum([110, 164.81, 220], 0.38, 1.5, 0.42); strum([123.47, 185, 246.94], 0.62, 2, 0.45); }, // E5, A5, B5
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
  // A cat's purr: low rumbling noise pulsed ~26 times a second by the larynx, in two breaths (a stronger out, a softer in).
  purr: () => {
    const c = out();
    if (!c || !master) return;
    const t = c.currentTime, dur = 3.2;
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), lp = c.createBiquadFilter(), pulse = c.createGain(), lfo = c.createOscillator(), depth = c.createGain(), breath = c.createGain();
    src.buffer = buf;
    lp.type = "lowpass"; lp.frequency.value = 340; lp.Q.value = 1.4;
    lfo.type = "sawtooth"; lfo.frequency.value = 26; depth.gain.value = 0.5; pulse.gain.value = 0.5; // gain swings 0..1, 26 Hz
    lfo.connect(depth).connect(pulse.gain);
    breath.gain.setValueAtTime(0.0001, t);
    for (const [at, peak, len] of [[0, 1.6, 1.1], [1.2, 0.9, 0.8], [2.05, 1.5, 1.05]] as const) { // out, in, out
      breath.gain.exponentialRampToValueAtTime(peak, t + at + 0.18);
      breath.gain.exponentialRampToValueAtTime(0.05, t + at + len);
    }
    breath.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(lp).connect(pulse).connect(breath).connect(master);
    src.start(t); lfo.start(t); src.stop(t + dur); lfo.stop(t + dur);
    buzz([15, 70, 15, 70, 15, 70, 15]);
  },
  // The window at the end: the pigeon's two-part coo, a sip of hot chocolate, wings off the sill, a bike bell.
  coo: () => { tone(340, 300, 0.2, "sine", 0.45); tone(310, 255, 0.5, "sine", 0.5, 0.24); tone(620, 520, 0.5, "sine", 0.06, 0.24); },
  sip: () => { noise(0.32, 0.22, 900); noise(0.18, 0.16, 1500, 0.4); },
  flap: () => [0, 0.07, 0.14, 0.21, 0.3].forEach((d) => noise(0.05, 0.3, 3200, d)),
  bikeBell: () => { bell(2093, 0, 0.16); bell(2093, 0.16, 0.16); },
  win: () => { arp([523, 659, 784, 1047, 784, 1047, 1319], 0.09, "square", 0.3); buzz([40, 40, 40, 40, 140]); },
  lose: () => { arp([494, 440, 392, 330, 262], 0.14, "triangle", 0.4); buzz(250); },
};

export const isMuted = () => muted;
export const setMuted = (m: boolean) => {
  muted = m;
  try { localStorage.setItem(KEY, m ? "off" : "on"); } catch { }
  if (m) ctx?.suspend();
};
