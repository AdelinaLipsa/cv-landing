"use client";
import { useEffect, useState } from "react";
import { unlock } from "@/lib/achievements";
import { sfx } from "@/lib/sfx";
import s from "./Halloween.module.css";

// A jack-o'-lantern between two candles, bottom left. Only shown in October (CSS keys off <html data-season>).
// Click a flame to blow it out; it relights itself. Both out at once: the room goes dark, and an achievement.
const CANDLES = [{ x: 8, h: 54 }, { x: 132, h: 34 }];

export default function Halloween() {
  const [out, setOut] = useState([false, false]);
  useEffect(() => {
    if (out.every(Boolean)) unlock("candles");
    const ids = out.map((o, i) => o && setTimeout(() => setOut((v) => v.map((x, j) => (j === i ? false : x))), 4000 + i * 900));
    return () => ids.forEach((id) => id && clearTimeout(id));
  }, [out]);

  return (
    <div className={s.scene} data-dark={out.every(Boolean) || undefined} aria-hidden="true">
      <div className={s.fog} />
      <svg className={s.art} viewBox="0 0 160 110" width="160" height="110">
        <defs>
          <radialGradient id="hw-skin" cx="45%" cy="35%" r="70%"><stop offset="0" stopColor="#ffb347" /><stop offset=".55" stopColor="#e8650f" /><stop offset="1" stopColor="#7a2c04" /></radialGradient>
          <radialGradient id="hw-fire" cx="50%" cy="60%" r="60%"><stop offset="0" stopColor="#fff6b0" /><stop offset=".5" stopColor="#ffc22e" /><stop offset="1" stopColor="#ff7a00" /></radialGradient>
          <linearGradient id="hw-wax" x1="0" x2="1"><stop offset="0" stopColor="#d9ccaa" /><stop offset=".4" stopColor="#f6efdc" /><stop offset="1" stopColor="#bfae86" /></linearGradient>
          <radialGradient id="hw-halo"><stop offset="0" stopColor="#ffcf5a" stopOpacity=".55" /><stop offset="1" stopColor="#ffcf5a" stopOpacity="0" /></radialGradient>
          <linearGradient id="hw-flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#ff8a00" /><stop offset=".35" stopColor="#ffd75a" /><stop offset="1" stopColor="#fffbe6" /></linearGradient>
        </defs>

        {/* The pumpkin: three lobes, ribs, a curled stem, a carved face lit from inside */}
        <g className={s.pumpkin}>
          <ellipse cx="80" cy="104" rx="46" ry="5" fill="#000" opacity=".25" />
          <path d="M80 44c-2-8 0-15 6-19 3-2 6 0 4 3-4 4-5 9-4 16z" fill="#4b5a22" />
          <ellipse cx="58" cy="76" rx="24" ry="28" fill="url(#hw-skin)" />
          <ellipse cx="102" cy="76" rx="24" ry="28" fill="url(#hw-skin)" />
          <ellipse cx="80" cy="75" rx="26" ry="31" fill="url(#hw-skin)" />
          <path d="M68 48c-6 16-6 40 0 56M92 48c6 16 6 40 0 56" stroke="#8a3306" strokeWidth="1.5" fill="none" opacity=".6" />
          <g className={s.face} fill="url(#hw-fire)">
            <path d="M58 66l10-12 6 14z" /><path d="M102 66l-10-12-6 14z" />
            <path d="M80 72l-4 7h8z" />
            <path d="M55 84c8 8 42 8 50 0l-3 10-6-5-5 7-6-6-5 6-6-6-5 5-6 5z" />
          </g>
        </g>

        {CANDLES.map((c, i) => (
          <g key={i} transform={`translate(${c.x} ${106 - c.h})`}>
            <rect x="0" y="0" width="20" height={c.h} rx="2" fill="url(#hw-wax)" />
            <path d="M0 2q4 10 3 14t3 0q1-8 4-8t3 12 3-4 4-14z" fill="#f6efdc" />
            <path d="M10 0v-6" stroke="#2a1d10" strokeWidth="1.4" />
            <g className={s.flame} data-out={out[i] || undefined}>
              <circle cx="10" cy="-12" r="22" fill="url(#hw-halo)" />
              <path d="M10-28c5 8 6 13 6 16a6 6 0 0 1-12 0c0-3 1-8 6-16z" fill="url(#hw-flame)" />
            </g>
            <g className={s.smoke} data-out={out[i] || undefined}><path d="M10-6c-4-6 4-10 0-16s4-10 0-14" stroke="#9a96b0" strokeWidth="1.5" fill="none" /></g>
            <rect
              className={s.hit} x="-6" y="-34" width="32" height="34" fill="transparent"
              onPointerDown={() => { if (out[i]) return; sfx.pop(); setOut((v) => v.map((x, j) => (j === i ? true : x))); }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

// The switch, next to the theme button: only there in October (CSS keys off <html data-october>), remembered.
// Off means the CV as it is the rest of the year. The games and the cat pick it up the next time they start.
export function HalloweenToggle({ className }: { className?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(document.documentElement.dataset.season === "halloween"), []);
  const toggle = () => {
    const next = !on;
    setOn(next);
    if (next) document.documentElement.dataset.season = "halloween";
    else delete document.documentElement.dataset.season;
    try { localStorage.setItem("cv-halloween", next ? "on" : "off"); } catch { }
  };
  return (
    <button type="button" className={`${className} ${s.toggle}`} onClick={toggle} aria-pressed={on} aria-label={on ? "Turn off Halloween mode" : "Turn on Halloween mode"} title={on ? "Halloween mode: on" : "Halloween mode: off"}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 7c-1-2.5 0-4 2-4.5M8 7.5C4.5 7.5 3 10.5 3 14s2 6 5 6c1.5 0 2.5-.5 4-.5s2.5.5 4 .5c3 0 5-2.5 5-6s-1.5-6.5-5-6.5c-1.5 0-2.5.5-4 .5s-2.5-.5-4-.5z" />
      </svg>
    </button>
  );
}
