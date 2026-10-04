"use client";
import { useEffect, useRef, useState } from "react";
import { profile } from "@/content/cv";
import { bus } from "@/lib/audioBus";
import type { Lofi } from "@/lib/lofi";
import { sfx } from "@/lib/sfx";
import s from "./Win95.module.css";

// The fun half of the old computer: a music player, a messenger, the office assistant, and the blue screen.

/* ---------- RamenAmp: a 90s skinned player for the site's own pixel lofi ---------- */
const TRACK = "Adelina - Ramen in the Dark (pixel lofi)";
const LENGTH = 600; // the lofi plays ten minutes
const mmss = (t: number) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

export function Player() {
  const [state, setState] = useState<"stopped" | "playing" | "paused">("stopped");
  const [time, setTime] = useState(0);
  const lofi = useRef<Lofi | null>(null);
  const t0 = useRef(0);
  const bars = useRef<HTMLCanvasElement>(null);

  const stop = () => { lofi.current?.stop(); lofi.current = null; setState("stopped"); setTime(0); };
  const play = async () => {
    if (lofi.current) { await lofi.current.ctx.resume(); setState("playing"); return; }
    const { startLofi } = await import("@/lib/lofi");
    const p = startLofi(() => { if (lofi.current === p) { lofi.current = null; setState("stopped"); setTime(0); } });
    lofi.current = p; t0.current = p.ctx.currentTime;
    setState("playing");
  };
  const pause = () => { if (lofi.current) { lofi.current.ctx.suspend(); setState("paused"); } };
  const restart = () => { stop(); setTimeout(play, 60); };

  // The clock and the spectrum: 19 bars, green into yellow into red, with peaks that fall.
  useEffect(() => {
    const cv = bars.current!, g = cv.getContext("2d")!;
    const data = new Uint8Array(128), peaks = new Array(19).fill(0);
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (lofi.current) { const t = Math.floor(lofi.current.ctx.currentTime - t0.current); setTime((v) => (v === t ? v : t)); }
      g.fillStyle = "#000"; g.fillRect(0, 0, cv.width, cv.height);
      const a = bus.analyser;
      if (a && state === "playing") a.getByteFrequencyData(data); else data.fill(0);
      for (let i = 0; i < 19; i++) {
        const h = Math.round((data[i + 1] / 255) * 16);
        peaks[i] = Math.max(h, peaks[i] - 0.25);
        for (let y = 0; y < h; y++) { g.fillStyle = y > 12 ? "#ff3a1a" : y > 8 ? "#e8d81a" : "#2ce02c"; g.fillRect(i * 4, 15 - y, 3, 1); }
        g.fillStyle = "#c8c8c8"; g.fillRect(i * 4, 15 - Math.round(peaks[i]), 3, 1);
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [state]);
  useEffect(() => () => lofi.current?.stop(), []);

  return (
    <div className={s.amp}>
      <div className={s.ampDisplay}>
        <div className={s.ampLeft}>
          <span className={s.ampState}>{state === "playing" ? "▶" : state === "paused" ? "❚❚" : "■"}</span>
          <span className={s.ampTime}>{mmss(time)}</span>
          <canvas ref={bars} width={76} height={16} className={s.ampBars} aria-hidden="true" />
        </div>
        <div className={s.ampRight}>
          <div className={s.ampMarquee}><span>{`1. ${TRACK} (10:00)  ***  `.repeat(2)}</span></div>
          <div className={s.ampInfo}><b>128</b> kbps <b>44</b> kHz <i data-on={state !== "stopped" || undefined}>stereo</i></div>
        </div>
      </div>
      <div className={s.ampSeek}><span style={{ width: `${Math.min(100, (time / LENGTH) * 100)}%` }} /></div>
      <div className={s.ampButtons}>
        <button type="button" onClick={restart} aria-label="Previous">⏮</button>
        <button type="button" onClick={play} aria-label="Play">▶</button>
        <button type="button" onClick={pause} aria-label="Pause">❚❚</button>
        <button type="button" onClick={stop} aria-label="Stop">■</button>
        <button type="button" onClick={restart} aria-label="Next">⏭</button>
        <span className={s.ampLogo}>RamenAmp</span>
      </div>
    </div>
  );
}

/* ---------- ISeekYou: the 90s messenger, wired to her WhatsApp ---------- */
export const Flower = ({ on = true, size = 14 }: { on?: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true">
    {[0, 60, 120, 180, 240, 300].map((r) => <ellipse key={r} cx="5" cy="2.3" rx="1.5" ry="2.2" fill={on ? "#3cc23c" : "#d62828"} stroke="#145214" strokeWidth="0.3" transform={`rotate(${r} 5 5)`} />)}
    <circle cx="5" cy="5" r="1.5" fill="#e83030" />
  </svg>
);

type Msg = { from: "her" | "you"; text: string };
const HELLO = ["Hey! You found my old computer.", "Want to talk about a product role? Type below and I’ll pick it up on WhatsApp."];

export function Messenger() {
  const [chat, setChat] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => { log.current?.scrollTo(0, log.current.scrollHeight); }, [msgs, typing]);
  useEffect(() => {
    if (!chat) return;
    const ids: number[] = [];
    HELLO.forEach((text, i) => {
      ids.push(window.setTimeout(() => setTyping(true), 300 + i * 1900));
      ids.push(window.setTimeout(() => { setTyping(false); setMsgs((m) => [...m, { from: "her", text }]); sfx.uhoh(); }, 1300 + i * 1900));
    });
    return () => ids.forEach(clearTimeout);
  }, [chat]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMsgs((m) => [...m, { from: "you", text }, { from: "her", text: "Opening WhatsApp with that. See you there!" }]);
    setDraft("");
    window.open(`${profile.whatsapp.split("?")[0]}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  if (!chat) return (
    <div className={s.icq}>
      <div className={s.icqHead}><Flower size={18} /><b>ISeekYou</b><span>#1995</span></div>
      <div className={s.icqList}>
        <span className={s.icqGroup}>Online (1)</span>
        <button type="button" className={s.icqContact} onClick={() => setChat(true)}>
          <Flower /><span><b>Adelina</b><small>Online, probably eating ramen</small></span>
        </button>
      </div>
      <p className={s.icqHint}>Click Adelina to say hi.</p>
    </div>
  );
  return (
    <div className={s.icq}>
      <div className={s.icqHead}><Flower size={18} /><b>Adelina</b><span>Online</span></div>
      <div className={s.icqLog} ref={log} aria-live="polite">
        {msgs.map((m, i) => <p key={i} data-from={m.from}><b>{m.from === "her" ? "Adelina" : "You"}:</b> {m.text}</p>)}
        {typing && <p className={s.icqTyping}>Adelina is typing…</p>}
      </div>
      <form className={s.icqSend} onSubmit={send}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message" aria-label="Message to Adelina" maxLength={500} />
        <button type="submit" className={s.btn}>Send</button>
      </form>
    </div>
  );
}

/* ---------- The office assistant: a paperclip with opinions ---------- */
const Clip = () => (
  <svg className={s.clipArt} viewBox="0 0 64 96" aria-hidden="true">
    <rect x="8" y="78" width="48" height="14" rx="1" fill="#fffef2" stroke="#b9b49a" />
    {[83, 87].map((y) => <line key={y} x1="12" x2="52" y1={y} y2={y} stroke="#a8c8e8" strokeWidth="0.8" />)}
    <g fill="none" strokeLinecap="round">
      <path d="M24 82 V28 a8 8 0 0 1 16 0 V68 a12 12 0 0 1 -24 0 V20 a16 16 0 0 1 32 0 V60" stroke="#6d7380" strokeWidth="4.5" />
      <path d="M24 82 V28 a8 8 0 0 1 16 0 V68 a12 12 0 0 1 -24 0 V20 a16 16 0 0 1 32 0 V60" stroke="#e4e7ec" strokeWidth="1.6" transform="translate(-0.8 -0.6)" />
    </g>
    <g className={s.clipEyes}>
      <ellipse cx="25" cy="32" rx="6.5" ry="7.5" fill="#fff" stroke="#222" strokeWidth="1" />
      <ellipse cx="40" cy="32" rx="6.5" ry="7.5" fill="#fff" stroke="#222" strokeWidth="1" />
      <circle cx="23" cy="31" r="2.6" fill="#111" />
      <circle cx="38" cy="31" r="2.6" fill="#111" />
    </g>
    <path d="M18 22 q6 -5 12 -1 M34 20 q7 -3 12 2" fill="none" stroke="#111" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export function Assistant({ crashed, onMessage }: { crashed: number; onMessage: () => void }) {
  const [shown, setShown] = useState(false);
  const [say, setSay] = useState<"ask" | "crash" | "bye" | null>(null);
  useEffect(() => {
    const t = setTimeout(() => { setShown(true); setSay(crashed ? "crash" : "ask"); sfx.tink(); }, crashed ? 1800 : 6000);
    return () => clearTimeout(t);
  }, [crashed]);
  useEffect(() => {
    if (say !== "bye") return;
    const t = setTimeout(() => setSay(null), 2600);
    return () => clearTimeout(t);
  }, [say]);
  if (!shown) return null;

  return (
    <div className={s.clip}>
      {say && (
        <div className={s.balloon} role="status">
          {say === "bye" ? <p>Fine. I’ll be right here. Watching.</p> : (
            <>
              <p>{say === "crash"
                ? "It looks like you crashed Windows. Adelina did that a lot in high school. It’s how she learned how computers work."
                : "It looks like you’re hiring a Product Owner. Would you like help?"}</p>
              <ul>
                <li><button type="button" onClick={onMessage}>Message Adelina</button></li>
                <li><a href={profile.pdf} download onClick={() => setSay("bye")}>Download her CV</a></li>
                <li><button type="button" onClick={() => setSay("bye")}>{say === "crash" ? "I meant to do that" : "Just looking around"}</button></li>
              </ul>
            </>
          )}
        </div>
      )}
      <button type="button" className={s.clipBtn} onClick={() => setSay((v) => (v ? null : "ask"))} aria-label="Office assistant"><Clip /></button>
    </div>
  );
}

/* ---------- The blue screen ---------- */
export function Bsod({ onKey }: { onKey: () => void }) {
  return (
    <button type="button" className={s.bsod} onClick={onKey} autoFocus>
      <span className={s.bsodTitle}>Windows</span>
      <span>A fatal exception 0E has occurred at 0028:C0FFEE3D in VXD CHECKOUT(01) + 00003D5E. The current application will be terminated.</span>
      <span>*  Press any key to terminate the current application.<br />*  Press CTRL+ALT+DEL again to restart your computer. You will lose any unsaved information in all applications.</span>
      <span className={s.bsodPress}>Press any key to continue <i>_</i></span>
    </button>
  );
}
