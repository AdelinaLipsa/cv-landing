"use client";
import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sfx";
import { unlock } from "@/lib/achievements";
import { season } from "@/lib/season";
import s from "./Cat.module.css";

// A pixel cat that drops by now and then: walks in, sits somewhere along the bottom, washes, leaves.
// Pet it (click or tap) and it purrs. In October it wears a witch hat, in December a Santa hat.
const SIT = ["..........k..k", "..........kkkk", "..........kwkw", "..........kkkk", ".........kkkk.", "k.......kkkkk.", "kk.....kkkkkk.", ".kk...kkkkkkk.", "..kkkkkkkkkkk.", "....kk.kk.kk.."];
const WALK = [
  [".........k..k.", ".........kkkk.", ".........kwkwk", "k........kkkk.", ".k.kkkkkkkkk..", "..kkkkkkkkkk..", "..kkkkkkkkk...", "..k.k....k.k..", ".k...k..k...k.", ".............."],
  [".........k..k.", ".........kkkk.", ".........kwkwk", "k........kkkk.", ".kkkkkkkkkkk..", "..kkkkkkkkkk..", "..kkkkkkkkk...", "...kk....kk...", "...k.k..k.k...", ".............."],
];
const PX = 3, CW = 14, CH = 13; // 3 rows of headroom for hats

export default function Cat() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [visit, setVisit] = useState<{ from: number; to: number; dir: number } | null>(null);
  const [hearts, setHearts] = useState<number[]>([]);

  // Schedule visits: the first after ~15s, then every 35 to 70s.
  useEffect(() => {
    let id = 0;
    const next = (ms: number) => {
      id = window.setTimeout(() => {
        const dir = Math.random() < 0.5 ? 1 : -1, w = innerWidth;
        setVisit({ from: dir > 0 ? -60 : w + 20, to: w * (0.15 + Math.random() * 0.7), dir });
        next(35000 + Math.random() * 35000);
      }, ms);
    };
    next(15000);
    return () => clearTimeout(id);
  }, []);

  // Walk in, sit for a while, walk out.
  useEffect(() => {
    if (!visit) return;
    const el = canvas.current!, ctx = el.getContext("2d")!;
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hat = season();
    const ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#17153a";
    const exit = visit.dir > 0 ? innerWidth + 20 : -60;
    const walk = calm ? 0 : Math.abs(visit.to - visit.from) / 70; // seconds at 70px/s
    let raf = 0, t0 = performance.now();
    const draw = (rows: string[], flip: boolean) => {
      ctx.clearRect(0, 0, CW, CH);
      rows.forEach((row, j) => { for (let i = 0; i < CW; i++) { const ch = row[flip ? CW - 1 - i : i]; if (ch && ch !== ".") { ctx.fillStyle = ch === "w" ? "#F5B53F" : ink; ctx.fillRect(i, j + 3, 1, 1); } } });
      const hx = flip ? 1 : 10; // the head
      if (hat === "halloween") { ctx.fillStyle = "#7a3cff"; ctx.fillRect(hx - 1, 2, 6, 1); ctx.fillRect(hx, 1, 4, 1); ctx.fillRect(hx + 1, 0, 2, 1); }
      if (hat === "christmas") { ctx.fillStyle = "#ff5a5a"; ctx.fillRect(hx, 1, 4, 2); ctx.fillRect(hx + (flip ? -1 : 4), 0, 1, 1); ctx.fillStyle = "#ffffff"; ctx.fillRect(hx, 2, 4, 1); }
    };
    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      let x: number, rows: string[], flip = visit.dir < 0;
      if (t < walk) { x = visit.from + (visit.to - visit.from) * (t / walk); rows = WALK[Math.floor(t * 6) % 2]; }
      else if (t < walk + 7) { x = visit.to; rows = SIT; }
      else if (!calm && t < walk + 7 + Math.abs(exit - visit.to) / 70) { const k = (t - walk - 7) / (Math.abs(exit - visit.to) / 70); x = visit.to + (exit - visit.to) * k; rows = WALK[Math.floor(t * 6) % 2]; }
      else { setVisit(null); return; }
      el.style.transform = `translateX(${Math.round(x)}px)`;
      draw(rows, flip);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [visit]);

  if (!visit) return null;
  const pet = () => { sfx.purr(); unlock("cat"); setHearts((h) => [...h, Date.now()]); setTimeout(() => setHearts((h) => h.slice(1)), 1200); };
  return (
    <div className={s.cat}>
      <canvas ref={canvas} width={CW} height={CH} className={s.sprite} style={{ width: CW * PX, height: CH * PX }} onClick={pet} role="button" aria-label="A cat. Pet it." />
      {hearts.map((h) => <span key={h} className={s.heart} style={{ transform: `translateX(${canvas.current?.style.transform.match(/-?\d+/)?.[0] ?? 0}px)` }}>♥</span>)}
    </div>
  );
}
