"use client";
import { useEffect, useRef } from "react";
import { sfx } from "@/lib/sfx";
import { unlock } from "@/lib/achievements";
import crt from "./SpaceGame.module.css";

// The 404 page's game: run past the missing pages. The 4s and 0s of the error roll at you; jump them.
// Space, ↑ or tap to jump. It gets faster. Best distance is remembered.
const W = 192, H = 72, GROUND = 60;
const HERO = ["..bbbb..", ".bllllb.", ".bsskss.", ".bssssb.", "..bbbb..", ".bblbbww", "bbbbbbb.", ".bbbbb.."];
const LEGS = [[".bb.bb..", "bbb.bbb."], [".bb..bb.", "b.....bb"]];
const DIGITS: Record<string, string[]> = {
  "4": ["#..#", "#..#", "####", "...#", "...#"],
  "0": ["####", "#..#", "#..#", "#..#", "####"],
};
const PAL: Record<string, string> = { b: "#3f7cff", l: "#7fe3ff", s: "#f2c29b", k: "#17153a", w: "#ffffff" };
const KEY = "cv-404-best";

export default function Runner404() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const glow = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    unlock("lost");
    const ctx = canvas.current!.getContext("2d")!, bloom = glow.current!.getContext("2d")!;
    let best = 0;
    try { best = Number(localStorage.getItem(KEY)) || 0; } catch { }
    let y = 0, vy = 0, speed = 60, dist = 0, t = 0, spawn = 1, over = false, started = false;
    let blocks: { x: number; d: string; scale: number }[] = [];
    const jump = () => {
      if (over) { y = 0; vy = 0; speed = 60; dist = 0; blocks = []; spawn = 1; over = false; started = true; return; }
      started = true;
      if (y === 0) { vy = -150; sfx.jump(); }
    };

    let raf = 0, last = performance.now();
    const frame = (now: number) => {
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.04));
      last = now; t += dt;
      if (started && !over) {
        speed += dt * 2.5; dist += speed * dt / 10;
        vy += 480 * dt; y = Math.min(0, y + vy * dt); if (y === 0) vy = 0;
        spawn -= dt;
        if (spawn <= 0) { blocks.push({ x: W + 4, d: Math.random() < 0.6 ? "4" : "0", scale: Math.random() < 0.25 ? 3 : 2 }); spawn = 0.9 + Math.random() * 1.1 - Math.min(0.5, speed / 400); }
        blocks.forEach((b) => (b.x -= speed * dt));
        blocks = blocks.filter((b) => b.x > -20);
        for (const b of blocks) {
          const bw = 4 * b.scale, bh = 5 * b.scale;
          if (b.x < 18 && b.x + bw > 11 && GROUND + y > GROUND - bh + 1) {
            over = true; sfx.boom();
            if (dist > best) { best = Math.floor(dist); try { localStorage.setItem(KEY, String(best)); } catch { } }
          }
        }
      }

      ctx.fillStyle = "#07061a"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#2e2b5c"; for (let i = 0; i < 30; i++) ctx.fillRect(Math.round((i * 47 - dist * 3) % W + W) % W, (i * 13) % 40, 1, 1);
      ctx.fillStyle = "#5a56a0"; ctx.fillRect(0, GROUND, W, 1);
      ctx.fillStyle = "#2e2b5c"; for (let x = -((dist * 10) % 12); x < W; x += 12) ctx.fillRect(Math.round(x), GROUND + 4, 6, 1);
      for (const b of blocks) {
        ctx.fillStyle = b.d === "4" ? "#F5B53F" : "#ff7ac6";
        DIGITS[b.d].forEach((row, j) => [...row].forEach((c, i) => c === "#" && ctx.fillRect(Math.round(b.x) + i * b.scale, GROUND - 5 * b.scale + j * b.scale, b.scale, b.scale)));
      }
      const legs = y < 0 ? LEGS[0] : LEGS[Math.floor(t * 10) % 2];
      [...HERO, ...legs].forEach((row, j) => [...row].forEach((c, i) => { if (c !== ".") { ctx.fillStyle = PAL[c]; ctx.fillRect(10 + i, Math.round(GROUND - 10 + y) + j, 1, 1); } }));

      ctx.font = "7px monospace"; ctx.textBaseline = "top"; ctx.textAlign = "right"; ctx.fillStyle = "#e8e6ff";
      ctx.fillText(`${Math.floor(dist)}m  BEST ${Math.max(best, Math.floor(dist))}m`, W - 3, 3);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (!started) { ctx.fillStyle = "#e8e6ff"; ctx.fillText("PRESS SPACE OR TAP TO RUN", W / 2, 26); }
      if (over) { ctx.fillStyle = "#ff5a5a"; ctx.fillText(`404'D AT ${Math.floor(dist)}m`, W / 2, 22); ctx.fillStyle = "#8e8cae"; ctx.fillText("SPACE OR TAP TO RETRY", W / 2, 32); }

      bloom.clearRect(0, 0, W, H); bloom.drawImage(ctx.canvas, 0, 0);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const onKey = (e: KeyboardEvent) => { if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); jump(); } };
    const el = canvas.current!;
    window.addEventListener("keydown", onKey);
    el.addEventListener("pointerdown", jump);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", onKey); el.removeEventListener("pointerdown", jump); };
  }, []);

  return (
    <div className={crt.crt} style={{ maxWidth: 520 }}>
      <canvas ref={canvas} width={W} height={H} style={{ aspectRatio: `${W} / ${H}` }} role="img" aria-label="A runner game: jump over the 4s and 0s. Space, up arrow or tap to jump." />
      <canvas ref={glow} width={W} height={H} className={crt.glow} aria-hidden="true" />
    </div>
  );
}
