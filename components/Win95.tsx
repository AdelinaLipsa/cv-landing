"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { jobs, ventures } from "@/content/cv";
import { unlock } from "@/lib/achievements";
import { sfx } from "@/lib/sfx";
import { useCalm } from "@/lib/useCalm";
import { flag, newBoard, reveal, type Board } from "@/lib/mines";
import s from "./Win95.module.css";
import Solitaire from "./Solitaire";

// The retro computer boots: a Windows 95 desktop with her CV as files, Solitaire, Minesweeper renamed Scope Mines,
// and a Recycle Bin full of what this site deleted. Start → Shut Down ends on the famous orange line.
type App = "readme" | "career" | "saints" | "mines" | "solitaire" | "bin";
type Win = { id: App; x: number; y: number; z: number };

// Tiny pixel icons, drawn from maps like the arcade sprites. Letters pick colours from PAL.
const PAL: Record<string, string> = { k: "#000", w: "#fff", g: "#c0c0c0", d: "#808080", y: "#ffd700", b: "#000080", c: "#00a0a0", r: "#c00000", l: "#5fd0ff", o: "#ff8000" };
const ICONS: Record<App, string[]> = {
  readme: ["kkkkkkkk..", "kwwwwwwkk.", "kwkkkkwwkk", "kwwwwwwwwk", "kwkkkkkkwk", "kwwwwwwwwk", "kwkkkkkkwk", "kwwwwwwwwk", "kwkkkkwwwk", "kkkkkkkkkk"],
  career: ["kkkkkkkk..", "kwwwwwwkk.", "kwbbbbwwkk", "kwwwwwwwwk", "kwbbbbbbwk", "kwwwwwwwwk", "kwbbbbbbwk", "kwwwwwwwwk", "kwbbbwwwwk", "kkkkkkkkkk"],
  saints: ["kkkkkkkkkk", "kllllllllk", "kllllyylk.", "klllllllk.", "kllcclllk.", "klcccclllk", "kcccccccck", "kcccccccck", "kcccccccck", "kkkkkkkkkk"],
  mines: ["gggggggggg", "gwwwwwwwwd", "gwg.k.gggd", "gwgkkkkggd", "gw.kwkk.gd", "gwgkkkkggd", "gwg.k.gggd", "gwggggggd.", "gwggggggd.", "dddddddddd"],
  solitaire: ["..kkkkkk..", ".kwwwwwwk.", "kwrwwwkkwk", "kwrrwkwwwk", "kwwrwkkkwk", "kkkkkkwwwk", "kwbbbbkkwk", "kwbbbbkwwk", "kwbbbbkkk.", "kkkkkkk..."],
  bin: ["..kkkkkk..", ".kggggggk.", "kkkkkkkkkk", ".kwgwgwgk.", ".kwgwgwgk.", ".kwgwgwgk.", ".kwgwgwgk.", ".kwgwgwgk.", ".kwgwgwgk.", "..kkkkkk.."],
};
const Icon = ({ app, size = 32 }: { app: App; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden="true">
    {ICONS[app].flatMap((row, y) => [...row].map((c, x) => (PAL[c] ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={PAL[c]} /> : null)))}
  </svg>
);

const NAMES: Record<App, string> = { readme: "README.txt", career: "Career.txt", saints: "Ruined_Saints.bmp", mines: "Scope Mines", solitaire: "Solitaire", bin: "Recycle Bin" };
const TITLES: Record<App, string> = { readme: "README.txt - Notepad", career: "Career.txt - Notepad", saints: "Ruined_Saints.bmp - Paint", mines: "Scope Mines", solitaire: "Solitaire", bin: "Recycle Bin" };
const DESKTOP: App[] = ["readme", "career", "saints", "mines", "solitaire", "bin"];

function Readme() {
  return (
    <pre className={s.notepad}>{`Hi, it's Adelina. You booted my old computer.

This is roughly where it started: modding Windows, and breaking it
in high school, and emulating the Nintendo and
Game Boy games I couldn't get.

Have a look around.
  Career.txt         the short version of my CV
  Ruined_Saints.bmp  my streetwear label
  Solitaire          the real one. Win it.
  Scope Mines        Minesweeper, except every
                     mine is a scope change

Don't open the Recycle Bin.
(You will.)`}</pre>
  );
}

function Career() {
  const pad = Math.max(...jobs.map((j) => j.dates.length));
  return <pre className={s.notepad}>{`CAREER.TXT\n==========\n\n${jobs.map((j) => `${j.dates.padEnd(pad)}  ${j.short}\n${" ".repeat(pad)}  ${j.company}`).join("\n\n")}\n\nThe full story is on the Career tab.`}</pre>;
}

function Saints() {
  const v = ventures[0];
  return (
    <div className={s.paint}>
      <video src="/media/ruined-saints.mp4" poster="/media/ruined-saints.jpg" autoPlay muted loop playsInline aria-label={`${v.name}: the PRAY? gate, then the site’s hero`} />
      <p>{v.name}: {v.note}</p>
    </div>
  );
}

const BIN = [
  { name: "halloween-theme.css", note: "Dripping green titles. Removed by popular demand (mine)." },
  { name: "arcade-hd/", note: "2,031 lines of 3D. The pixels were better." },
  { name: "tinted-pill-button.png", note: "We don’t talk about the tinted pill." },
];
function Bin() {
  return (
    <div className={s.bin}>
      <ul>{BIN.map((f) => <li key={f.name}><b>{f.name}</b><span>{f.note}</span></li>)}</ul>
      <div className={s.binBar}><button type="button" className={s.btn} disabled title="Some things stay deleted">Restore</button><span>{BIN.length} object(s)</span></div>
    </div>
  );
}

function Mines() {
  const [b, setB] = useState<Board>(newBoard());
  useEffect(() => { if (b.state === "won") unlock("mines"); }, [b.state]);
  const left = b.mines - b.cells.filter((c) => c.flag).length;
  const face = b.state === "won" ? "😎" : b.state === "lost" ? "😵" : "🙂";
  return (
    <div className={s.mines}>
      <div className={s.minesBar}>
        <span className={s.lcd}>{String(Math.max(left, 0)).padStart(3, "0")}</span>
        <button type="button" className={`${s.btn} ${s.face}`} onClick={() => setB(newBoard())} aria-label="New game">{face}</button>
        <span className={s.lcd}>{b.state === "won" ? "WIN" : b.state === "lost" ? "OOP" : "SCP"}</span>
      </div>
      <div className={s.grid} style={{ gridTemplateColumns: `repeat(${b.w}, 22px)` }} onContextMenu={(e) => e.preventDefault()}>
        {b.cells.map((c, i) => (
          <button
            key={i}
            type="button"
            className={s.cell}
            data-open={c.open || undefined}
            data-n={c.open && !c.mine ? c.near : undefined}
            onClick={() => setB((x) => reveal(x, i))}
            onContextMenu={() => setB((x) => flag(x, i))}
            aria-label={c.open ? (c.mine ? "scope change" : `${c.near} near`) : c.flag ? "flagged" : "hidden"}
          >
            {c.open ? (c.mine ? "✱" : c.near || "") : c.flag ? "⚑" : ""}
          </button>
        ))}
      </div>
      <p className={s.minesNote}>{b.state === "lost" ? "Scope crept in. Click the face to try again." : b.state === "won" ? "Scope contained. Ship it." : "Right-click (or long-press) to flag a scope change."}</p>
    </div>
  );
}

const BODY: Record<App, () => React.ReactNode> = { readme: Readme, career: Career, saints: Saints, mines: Mines, solitaire: Solitaire, bin: Bin };

// The sky behind the splash and on the desktop: value noise, five octaves, painted small and scaled up so it blurs soft.
function Clouds({ className }: { className?: string }) {
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = cv.current!, W = (c.width = 192), H = (c.height = 120), ctx = c.getContext("2d")!;
    let seed = 95;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const G = 64, grid = Array.from({ length: G * G }, rand);
    const at = (x: number, y: number) => grid[(((y % G) + G) % G) * G + (((x % G) + G) % G)];
    const smooth = (t: number) => t * t * (3 - 2 * t);
    const noise = (x: number, y: number) => {
      const xi = Math.floor(x), yi = Math.floor(y), u = smooth(x - xi), v = smooth(y - yi);
      const a = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * u, b = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * u;
      return a + (b - a) * v;
    };
    const img = ctx.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let n = 0, amp = 0.5, f = 1 / 24;
      for (let o = 0; o < 5; o++) { n += noise(x * f, y * f * 1.6) * amp; amp /= 2; f *= 2; }
      const cloud = Math.min(1, Math.max(0, (n - 0.42) / 0.3)), sky = y / H, k = (y * W + x) * 4;
      img.data[k] = 42 + 70 * sky + (255 - 42 - 70 * sky) * cloud;
      img.data[k + 1] = 92 + 80 * sky + (255 - 92 - 80 * sky) * cloud;
      img.data[k + 2] = 184 + 50 * sky + (255 - 184 - 50 * sky) * cloud;
      img.data[k + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, []);
  return <canvas ref={cv} className={`${s.clouds} ${className ?? ""}`} aria-hidden="true" />;
}

// The waving four-pane flag from the 95 splash, drawn on a bent grid: (u, v) across the flag maps to a point on the wave,
// so every pane and trailing square curves with it. Built once, as path strings.
const wave = (u: number, v: number): [number, number] => [70 + 112 * u - 26 * v + 5 * Math.sin(Math.PI * v), 34 + 112 * v - 26 * u - 12 * Math.sin(Math.PI * u * 1.1)];
const quad = (u0: number, v0: number, u1: number, v1: number, n = 8) => {
  const pts: [number, number][] = [];
  for (let k = 0; k <= n; k++) pts.push(wave(u0 + ((u1 - u0) * k) / n, v0));
  for (let k = 0; k <= n; k++) pts.push(wave(u1, v0 + ((v1 - v0) * k) / n));
  for (let k = n; k >= 0; k--) pts.push(wave(u0 + ((u1 - u0) * k) / n, v1));
  for (let k = n; k >= 0; k--) pts.push(wave(u0, v0 + ((v1 - v0) * k) / n));
  return "M" + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L") + "Z";
};
const FLAG = {
  frame: quad(0, 0, 1, 1),
  panes: [
    { d: quad(0.08, 0.07, 0.47, 0.46), fill: "#f05a22" },
    { d: quad(0.55, 0.07, 0.93, 0.46), fill: "#5fb53a" },
    { d: quad(0.08, 0.54, 0.47, 0.93), fill: "#2f78d6" },
    { d: quad(0.55, 0.54, 0.93, 0.93), fill: "#ffc20e" },
  ],
  // The trail: five columns of squares behind the flag, smaller and further apart as they go, coloured in the middle rows.
  trail: Array.from({ length: 5 }, (_, c) => Array.from({ length: 8 }, (_, row) => {
    const size = 0.1 * (1 - c * 0.13), u = -0.02 - size - c * 0.13 - c * c * 0.008, v = 0.01 + row * 0.125 + (0.1 - size) / 2;
    const fill = row === 1 || row === 2 ? "#f05a22" : row === 5 || row === 6 ? "#2f78d6" : "#000";
    return { d: quad(u, v, u + size, v + size * 0.9, 2), fill, o: 1 - c * 0.1 };
  })).flat(),
};
const Flag = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="-10 -10 200 170" aria-hidden="true">
    <g style={{ filter: "drop-shadow(4px 6px 3px rgba(0, 0, 40, 0.35))" }}>
      {FLAG.trail.map((t, k) => <path key={k} d={t.d} fill={t.fill} opacity={t.o} />)}
      <path d={FLAG.frame} fill="#000" />
      {FLAG.panes.map((p) => <path key={p.fill} d={p.d} fill={p.fill} />)}
    </g>
  </svg>
);

// The power-on self test, white on black, before Windows starts. One line every 170ms.
const POST = [
  "AL-BIOS (C) 1995 Adelina Lipșa, Bucharest",
  "",
  "Main Processor : Product Owner @ 75MHz",
  "Co-Processor   : Full-stack Developer",
  "Memory Test    : 16384K OK",
  "",
  "Detecting Primary Master   ... CV.SYS",
  "Detecting Primary Slave    ... RAMEN.DAT",
  "Detecting Secondary Master ... PAYMENTS.DLL",
  "",
  "Starting Windows 95...",
];

export default function Win95({ onClose, contact }: { onClose: () => void; contact: () => void }) {
  const calm = useCalm();
  const [booting, setBooting] = useState<"post" | "splash" | false>(calm ? false : "post");
  const [lines, setLines] = useState(0);
  const [off, setOff] = useState(false);
  const [start, setStart] = useState(false);
  const [wins, setWins] = useState<Win[]>([{ id: "readme", x: 140, y: 40, z: 1 }]);
  const [clock, setClock] = useState("");
  const top = useRef(1);
  const quit = useRef(onClose); // a ref, so a parent re-render never restarts the boot or the clock
  quit.current = onClose;

  useEffect(() => {
    unlock("win98");
    sfx.boot(); // the startup chime (opening it was a click, so the browser lets it play)
    const post = POST.length * 170 + 400;
    const typing = setInterval(() => setLines((n) => n + 1), 170);
    const t1 = setTimeout(() => { clearInterval(typing); setBooting((b) => b && "splash"); }, post);
    const t = setTimeout(() => setBooting(false), post + 1400);
    const tick = () => setClock(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 15000);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") quit.current(); };
    window.addEventListener("keydown", onKey);
    return () => { clearInterval(typing); clearTimeout(t1); clearTimeout(t); clearInterval(id); window.removeEventListener("keydown", onKey); };
  }, []);

  const open = (id: App) => {
    setStart(false);
    setWins((ws) => {
      top.current += 1;
      const had = ws.find((w) => w.id === id);
      if (had) return ws.map((w) => (w.id === id ? { ...w, z: top.current } : w));
      const n = ws.length;
      return [...ws, { id, x: 120 + n * 56, y: 30 + n * 40, z: top.current }];
    });
  };
  const focus = (id: App) => setWins((ws) => { top.current += 1; return ws.map((w) => (w.id === id ? { ...w, z: top.current } : w)); });
  const close = (id: App) => setWins((ws) => ws.filter((w) => w.id !== id));

  // Drag a window by its title bar.
  const drag = (id: App) => (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    focus(id);
    const w = wins.find((x) => x.id === id)!, sx = e.clientX - w.x, sy = e.clientY - w.y;
    const move = (m: PointerEvent) => setWins((ws) => ws.map((x) => (x.id === id ? { ...x, x: Math.max(-200, m.clientX - sx), y: Math.max(0, m.clientY - sy) } : x)));
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const screen = off ? (
    <button type="button" className={s.off} onClick={onClose} aria-label="Close">It’s now safe to turn off your computer.</button>
  ) : booting === "post" ? (
    <pre className={s.post} onClick={() => setBooting(false)}>{POST.slice(0, lines).join("\n")}<span className={s.caret}>_</span></pre>
  ) : booting ? (
    <div className={s.boot} onClick={() => setBooting(false)}><Clouds /><Flag className={s.flag} /><div className={s.logo}><small>Microsoft</small><b>Windows<em>95</em></b></div><span>Starting Windows 95…</span><i /></div>
  ) : (
    <div className={s.desk} onPointerDown={(e) => { if (e.target === e.currentTarget) setStart(false); }}>
      {/* The wallpaper: the clouds, with this machine's own splash in the middle */}
      <div className={s.wallpaper} aria-hidden="true">
        <Clouds />
        <div className={s.brand}><Flag className={s.flag} /><div className={s.logo}><small>Adelina</small><b>Lipșa<em>95</em></b></div><span>You should hire me.</span><small>Plug and play. No drivers needed.</small></div>
      </div>
      <ul className={s.icons}>
        {DESKTOP.map((id) => (
          <li key={id}><button type="button" className={s.icon} onDoubleClick={() => open(id)} onClick={(e) => { if (e.detail === 0 || matchMedia("(pointer: coarse)").matches) open(id); }}><Icon app={id} /><span>{NAMES[id]}</span></button></li>
        ))}
      </ul>

      {wins.map((w) => {
        const Body = BODY[w.id];
        return (
          <section key={w.id} className={s.win} style={{ left: w.x, top: w.y, zIndex: w.z }} onPointerDown={() => focus(w.id)} aria-label={TITLES[w.id]} data-app={w.id}>
            <header className={s.title} onPointerDown={drag(w.id)} data-active={w.z === top.current || undefined}>
              <Icon app={w.id} size={14} /><span>{TITLES[w.id]}</span>
              <button type="button" className={`${s.btn} ${s.x}`} onClick={() => close(w.id)} aria-label={`Close ${NAMES[w.id]}`}>✕</button>
            </header>
            <div className={s.winBody}><Body /></div>
          </section>
        );
      })}

      {start && (
        <nav className={s.menu} aria-label="Start menu">
          <span className={s.menuSide}><b>Windows</b>95</span>
          <ul>
            {DESKTOP.map((id) => <li key={id}><button type="button" onClick={() => open(id)}><Icon app={id} size={20} />{NAMES[id]}</button></li>)}
            <li className={s.sep} />
            <li><button type="button" onClick={() => { onClose(); contact(); }}><span className={s.menuGlyph}>✉</span>Message Adelina…</button></li>
            <li><button type="button" onClick={() => { sfx.shutdown(); setOff(true); }}><span className={s.menuGlyph}>⏻</span>Shut Down…</button></li>
          </ul>
        </nav>
      )}

      <footer className={s.taskbar}>
        <button type="button" className={`${s.btn} ${s.start}`} data-on={start || undefined} onClick={() => setStart((v) => !v)}><b>⊞</b> Start</button>
        <div className={s.tasks}>
          {wins.map((w) => <button key={w.id} type="button" className={s.btn} data-on={w.z === top.current || undefined} onClick={() => focus(w.id)}><Icon app={w.id} size={14} />{NAMES[w.id]}</button>)}
        </div>
        <span className={s.tray}>{clock}</span>
      </footer>
    </div>
  );

  return createPortal(<div className={s.overlay} role="dialog" aria-modal="true" aria-label="Windows 95">{screen}</div>, document.body);
}
