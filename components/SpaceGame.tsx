"use client";
import { useEffect, useRef } from "react";
import { sfx } from "@/lib/sfx";
import { unlock } from "@/lib/achievements";
import { drawSnow, season } from "@/lib/season";
import type { SpaceView } from "@/lib/space3d";
import type { Mode } from "@/lib/arcadePrefs";
import { retroSpace } from "@/lib/retro/space";
import s from "./SpaceGame.module.css";

// A space shooter: the gamepad button in the nav, or `play` in the terminal. It plays on a 192 × 120 grid;
// lib/space3d draws that grid as a lit 3D scene, and a sharp 2D layer on top carries the score and messages.
// Three waves, then a boss: The Backlog. Beat it and you win. ← → (or drag) to move; the ship fires on its own.
// Power-ups drop from aliens: T triple shot, R rapid fire, S shield, B bomb (clears the screen), + extra life.
// Quick kills chain a combo up to x5. The high score is remembered.
const W = 192, H = 120;
const S = 4; // the 2D layer draws at 4× the grid, so text is sharp
const KINDS = [{ color: "#F5B53F", pts: 10 }, { color: "#ff7ac6", pts: 20 }, { color: "#5fd0ff", pts: 30 }];
const WAVES = [
  { kind: 0, rows: 3, cols: 6, speed: 10, fire: 0.5, dive: 0 },
  { kind: 1, rows: 4, cols: 7, speed: 13, fire: 0.75, dive: 0 },
  { kind: 2, rows: 4, cols: 8, speed: 15, fire: 0.9, dive: 0.35 },
];
const BOSS_HP = 60;
const DROPS = { T: "#F5B53F", R: "#5fd897", S: "#5fd0ff", B: "#ffffff", "+": "#ff7ac6" } as const;
const HI_KEY = "cv-space-hi";
type Drop = keyof typeof DROPS;

type Alien = { x: number; y: number; kind: number; alive: boolean; diving: boolean; vx: number };
type P = { x: number; y: number; vx: number; vy: number };
type Spark = P & { life: number; max: number; color: string };
type Pop = { x: number; y: number; text: string; life: number; color: string };

export default function SpaceGame({ mode, onLost, onEnd }: { mode: Mode; onLost?: () => void; onEnd?: (score: number) => void }) {
  // The final score goes to the arcade's leaderboard. A ref, so the game loop never restarts for it.
  const report = useRef(onEnd);
  report.current = onEnd;
  const lost = useRef(onLost); // likewise: a ref, so a lost GPU never restarts the loop
  lost.current = onLost;
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLCanvasElement>(null);
  const strip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = canvas.current!.getContext("2d")!;
    ctx.setTransform(S, 0, 0, S, 0, 0);
    const SEASON = season();
    const tint = SEASON === "halloween" ? ["#ff8c1a", "#b46bff", "#7dff6b"] : SEASON === "christmas" ? ["#ff5a5a", "#5fd897", "#ffffff"] : KINDS.map((k) => k.color);
    const bossColor = SEASON === "halloween" ? "#7dff6b" : "#ff5a5a";
    let view: SpaceView | null = null, gone = false;
    if (mode === "retro") view = retroSpace(ctx, W, H, tint, bossColor);
    else import("@/lib/space3d")
      .then((m) => m.mountSpace(stage.current!, W, H, tint, bossColor, () => lost.current?.()))
      .then((v) => { if (gone) v.dispose(); else view = v; })
      .catch(() => lost.current?.()); // no WebGL: the arcade switches to Retro
    let hi = 0;
    try { hi = Number(localStorage.getItem(HI_KEY)) || 0; } catch { }
    let best = hi; // the record to beat this game

    let ship = W / 2, lives = 3, score = 0, wave = -1;
    let state: "banner" | "play" | "over" | "won" = "banner", stateT = 0, banner = "";
    let invuln = 0, triple = 0, rapid = 0, shield = false, fire = 0, shake = 0, flash = 0, t = 0;
    let combo = 0, comboT = 0, pops: Pop[] = [];
    let shots: P[] = [], bombs: P[] = [], drops: (P & { type: Drop })[] = [], sparks: Spark[] = [];
    let aliens: Alien[] = [], dir = 1;
    let boss: { x: number; y: number; hp: number; cool: number } | null = null;
    const reset = () => {
      ship = W / 2; lives = 3; score = 0; wave = -1;
      invuln = 0; triple = 0; rapid = 0; shield = false; fire = 0; shake = 0; flash = 0;
      combo = 0; comboT = 0; pops = []; best = hi;
      sparks = []; drops = []; aliens = []; boss = null;
      nextWave();
    };
    const keys = { left: false, right: false };

    const burst = (x: number, y: number, color: string, n = 10, speed = 40) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = speed * (0.3 + Math.random());
        const max = 0.4 + Math.random() * 0.5;
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: max, max, color });
      }
      if (n >= 8) view?.boom(x, y, color, n / 10); // big ones light up the ships around them
    };

    // Kills inside 1.2s of each other chain a combo: x2, x3, up to x5.
    const award = (base: number, x: number, y: number) => {
      combo = comboT > 0 ? Math.min(combo + 1, 5) : 1;
      comboT = 1.2;
      score += base * combo;
      pops.push({ x, y, text: combo > 1 ? `+${base * combo} x${combo}` : `+${base}`, life: 0.9, color: combo > 2 ? "#F5B53F" : "#e8e6ff" });
    };
    const kill = (a: Alien) => {
      a.alive = false;
      sfx.pop();
      award(KINDS[a.kind].pts, a.x + 3, a.y);
      burst(a.x + 3, a.y + 2, tint[a.kind]);
      if (Math.random() < 0.13) {
        const r = Math.random();
        drops.push({ x: a.x + 3, y: a.y + 3, vx: 0, vy: 28, type: r < 0.28 ? "T" : r < 0.5 ? "R" : r < 0.72 ? "S" : r < 0.88 ? "B" : "+" });
      }
    };
    const end = (how: "over" | "won") => {
      state = how; stateT = 0;
      if (score > 0) report.current?.(score);
      if (score > hi) { hi = score; try { localStorage.setItem(HI_KEY, String(hi)); } catch { } }
    };
    // B: wipes every bomb, takes out up to 6 aliens, dents the boss.
    const nuke = () => {
      sfx.boom();
      bombs = [];
      flash = 0.3;
      shake = 0.4;
      aliens.filter((a) => a.alive).sort(() => Math.random() - 0.5).slice(0, 6).forEach(kill);
      if (boss) boss.hp = Math.max(1, boss.hp - 8);
    };

    const nextWave = () => {
      wave++;
      state = "banner";
      stateT = 1.8;
      banner = wave < WAVES.length ? `WAVE ${wave + 1}${SEASON === "halloween" ? " · BOO!" : SEASON === "christmas" ? " · HO HO HO" : ""}` : SEASON === "halloween" ? "BOSS: THE HAUNTED BACKLOG" : SEASON === "christmas" ? "BOSS: THE YEAR-END BACKLOG" : "BOSS: THE BACKLOG";
      if (wave < WAVES.length) sfx.wave(); else sfx.warning();
      shots = []; bombs = [];
    };
    const spawn = () => {
      state = "play";
      if (wave < WAVES.length) {
        const w = WAVES[wave];
        aliens = [];
        for (let r = 0; r < w.rows; r++) for (let c = 0; c < w.cols; c++) {
          aliens.push({ x: (W - w.cols * 14) / 2 + c * 14, y: 12 + r * 9, kind: w.kind, alive: true, diving: false, vx: 0 });
        }
        dir = 1;
      } else boss = { x: W / 2 - 7, y: 14, hp: BOSS_HP, cool: 1.5 };
    };
    const hitShip = () => {
      if (invuln > 0 || state !== "play") return;
      if (shield) { shield = false; invuln = 1; burst(ship, H - 9, "#5fd0ff", 14, 30); sfx.tink(); return; }
      sfx.hurt();
      lives--;
      invuln = 1.6;
      shake = 0.35;
      burst(ship, H - 9, "#5fd897", 18, 50);
      if (lives <= 0) { end("over"); burst(ship, H - 9, "#ffffff", 30, 70); sfx.boom(); sfx.lose(); }
    };

    const text = (str: string, x: number, y: number, color = "#e8e6ff", align: CanvasTextAlign = "left") => {
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.shadowColor = "rgba(0, 0, 0, 0.85)"; ctx.shadowBlur = 6; // readable over a bright explosion
      ctx.fillText(str, x, y);
    };

    let raf = 0, last = performance.now();
    const frame = (now: number) => {
      // The first frame's timestamp can be earlier than `last`: never let time run backwards.
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;
      t += dt;
      stateT -= dt;
      invuln -= dt;
      triple -= dt;
      rapid -= dt;
      shake -= dt;
      flash -= dt;
      comboT -= dt;

      if (state === "banner" && stateT <= 0) spawn();
      if (state === "play" || state === "banner") {
        ship = Math.max(4, Math.min(W - 4, ship + ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * 80 * dt));
      }

      if (state === "play") {
        // Auto-fire: one shot, or a fan of three with the power-up.
        fire -= dt;
        if (fire <= 0) {
          shots.push({ x: ship, y: H - 13, vx: 0, vy: -140 });
          sfx.laser();
          if (triple > 0) shots.push({ x: ship - 2, y: H - 12, vx: -28, vy: -135 }, { x: ship + 2, y: H - 12, vx: 28, vy: -135 });
          fire = rapid > 0 ? 0.12 : 0.26;
        }

        // The fleet marches sideways and drops a row at each edge; on wave 3 some dive at you.
        if (wave < WAVES.length) {
          const w = WAVES[wave];
          const live = aliens.filter((a) => a.alive);
          const rank = live.filter((a) => !a.diving);
          const speed = w.speed * (1 + (1 - live.length / (w.rows * w.cols)) * 1.2); // fewer left, faster they go
          if (rank.some((a) => (dir > 0 ? a.x + 7 >= W - 2 : a.x <= 2))) { dir *= -1; rank.forEach((a) => (a.y += 3)); }
          rank.forEach((a) => (a.x += dir * speed * dt));
          if (w.dive && rank.length && Math.random() < dt * w.dive) {
            const a = rank[Math.floor(Math.random() * rank.length)];
            a.diving = true;
            a.vx = (ship - a.x) * 0.5;
          }
          for (const a of live) if (a.diving) {
            a.x += a.vx * dt;
            a.y += 48 * dt;
            if (a.y > H) { a.y = 4; a.diving = false; } // loops back to the top and rejoins
            if (Math.abs(a.x + 3 - ship) < 5 && a.y + 5 >= H - 9 && a.y <= H - 4) { kill(a); hitShip(); }
          }
          if (rank.length && Math.random() < dt * w.fire) {
            const a = rank[Math.floor(Math.random() * rank.length)];
            bombs.push({ x: a.x + 3, y: a.y + 5, vx: 0, vy: 42 });
          }
          if (rank.some((a) => a.y + 5 >= H - 12)) { lives = 0; end("over"); burst(ship, H - 9, "#ffffff", 30, 70); sfx.boom(); sfx.lose(); } // they landed
          for (const sh of shots) for (const a of live) {
            if (a.alive && sh.x >= a.x - 0.5 && sh.x <= a.x + 7.5 && sh.y >= a.y && sh.y <= a.y + 5) { kill(a); sh.y = -99; }
          }
          if (!aliens.some((a) => a.alive)) nextWave();
        } else if (boss) {
          // The Backlog: sways, fires fans, gets angrier below half health.
          const angry = boss.hp < BOSS_HP / 2;
          boss.x = W / 2 - 7 + Math.sin(t * (angry ? 1.1 : 0.7)) * 70;
          boss.y = 14 + Math.sin(t * 1.7) * 4;
          boss.cool -= dt;
          if (boss.cool <= 0) {
            const cx = boss.x + 7, cy = boss.y + 8;
            for (const vx of angry ? [-30, -15, 0, 15, 30] : [-20, 0, 20]) bombs.push({ x: cx, y: cy, vx, vy: 46 });
            if (angry) bombs.push({ x: cx, y: cy, vx: (ship - cx) * 0.6, vy: 55 }); // and one aimed at you
            boss.cool = angry ? 0.9 : 1.3;
          }
          for (const sh of shots) {
            if (sh.x >= boss.x && sh.x <= boss.x + 15 && sh.y >= boss.y && sh.y <= boss.y + 8) {
              burst(sh.x, sh.y, "#ff5a5a", 3, 25);
              sh.y = -99; boss.hp--; score += 5;
              if (boss.hp % 3 === 0) sfx.tink(); // not every hit: the fan of shots would be a wall of noise
              if (boss.hp <= 0) {
                score += 1000;
                for (let i = 0; i < 6; i++) burst(boss.x + Math.random() * 15, boss.y + Math.random() * 8, i % 2 ? "#F5B53F" : "#ff5a5a", 16, 70);
                pops.push({ x: boss.x + 7, y: boss.y, text: "+1000", life: 1.5, color: "#F5B53F" });
                boss = null; shake = 0.8; flash = 0.4; bombs = []; end("won"); unlock("backlog");
                sfx.boom(); setTimeout(sfx.win, 700);
                break;
              }
            }
          }
        }

        for (const b of bombs) if (Math.abs(b.x - ship) <= 3 && b.y >= H - 10 && b.y <= H - 5) { b.y = H + 99; hitShip(); }
        for (const d of drops) if (Math.abs(d.x - ship) <= 5 && d.y >= H - 12 && d.y <= H - 3) {
          d.y = H + 99;
          if (d.type !== "B") sfx.power();
          if (d.type === "T") triple = 8; else if (d.type === "R") rapid = 8; else if (d.type === "S") shield = true; else if (d.type === "B") nuke(); else lives = Math.min(lives + 1, 5);
          pops.push({ x: d.x, y: H - 16, text: { T: "TRIPLE", R: "RAPID", S: "SHIELD", B: "BOOM", "+": "1UP" }[d.type], life: 0.9, color: DROPS[d.type] });
          burst(d.x, H - 9, DROPS[d.type], 8, 25);
        }
      }

      const move = (p: P) => { p.x += p.vx * dt; p.y += p.vy * dt; return p.y > -4 && p.y < H + 4; };
      shots = shots.filter(move);
      bombs = bombs.filter(move);
      drops = drops.filter(move);
      sparks = sparks.filter((p) => (p.life -= dt) > 0 && move(p));
      pops = pops.filter((p) => ((p.y -= 14 * dt), (p.life -= dt) > 0));

      // Draw: the 3D scene, then the 2D layer on top (power-up letters, points, flash, snow), shaken when hit.
      const warp = state === "banner" ? 7 : 1; // between waves the stars streak past
      ctx.clearRect(0, 0, W, H);
      view?.draw({
        t, dt, warp, shake,
        ship: { x: ship, visible: state !== "over" && (invuln <= 0 || Math.floor(t * 12) % 2 === 1), trim: triple > 0 ? "#F5B53F" : rapid > 0 ? "#b6ffcf" : "#5fd897", shield },
        aliens, kind: Math.min(Math.max(wave, 0), WAVES.length - 1),
        boss: boss && { x: boss.x, y: boss.y, hit: boss.hp < BOSS_HP / 2 && Math.floor(t * 8) % 2 === 1 },
        shots, bombs, sparks,
        drops: drops.map((d) => ({ x: d.x, y: d.y, color: DROPS[d.type] })),
      });
      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
      if (SEASON === "christmas") drawSnow(ctx, t, W, H);
      ctx.font = "bold 5px ui-monospace, monospace";
      ctx.textBaseline = "middle";
      for (const d of drops) text(d.type, d.x, d.y + 0.3, "#ffffff", "center");
      ctx.font = "6px ui-monospace, monospace";
      for (const p of pops) {
        ctx.globalAlpha = Math.min(1, p.life * 2);
        text(p.text, p.x, p.y, p.color, "center");
      }
      ctx.globalAlpha = 1;
      if (flash > 0 && !matchMedia("(prefers-reduced-motion: reduce)").matches) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(-4, -4, W + 8, H + 8); }
      ctx.restore();

      // HUD: score, hearts, wave, boss health, power-up timer.
      ctx.font = "7px monospace";
      ctx.textBaseline = "top";
      text(`${score}`.padStart(5, "0"), 3, 2);
      text("♥".repeat(Math.max(lives, 0)), W - 3, 2, "#ff7ac6", "right");
      text(`${wave < WAVES.length ? `W${wave + 1}` : "BOSS"} · HI ${Math.max(hi, score)}`, W / 2, 2, "#8e8cae", "center");
      if (combo > 1 && comboT > 0) text(`x${combo}`, 3, 10, "#F5B53F");
      if (boss) {
        ctx.fillStyle = "#3a1430"; ctx.fillRect(40, 11, W - 80, 2);
        ctx.fillStyle = "#ff5a5a"; ctx.fillRect(40, 11, (W - 80) * (boss.hp / BOSS_HP), 2);
      }
      if (triple > 0) { ctx.fillStyle = "#F5B53F"; ctx.fillRect(3, H - 2, 30 * (triple / 8), 1); }
      if (rapid > 0) { ctx.fillStyle = "#5fd897"; ctx.fillRect(3, H - 4, 30 * (rapid / 8), 1); }

      ctx.textBaseline = "middle";
      if (state === "banner") {
        ctx.font = "10px monospace";
        if (Math.floor(t * 4) % 2 || stateT < 1) text(banner, W / 2, H / 2 - 6, wave < WAVES.length ? "#e8e6ff" : "#ff5a5a", "center");
        ctx.font = "7px monospace";
        text(wave === 0 ? "← → OR DRAG TO MOVE" : "GET READY", W / 2, H / 2 + 8, "#8e8cae", "center");
      } else if (state === "over") {
        ctx.font = "10px monospace";
        text("GAME OVER", W / 2, H / 2 - 8, "#ff5a5a", "center");
        ctx.font = "7px monospace";
        text(score > best && score > 0 ? `NEW HIGH SCORE: ${score}` : `${score} POINTS`, W / 2, H / 2 + 4, score > best && score > 0 ? "#F5B53F" : "#e8e6ff", "center");
        text("TAP OR PRESS ENTER TO RETRY", W / 2, H / 2 + 14, "#8e8cae", "center");
      } else if (state === "won" && stateT < -1.2) {
        ctx.font = "10px monospace";
        text("BACKLOG CLEARED!", W / 2, H / 2 - 12, "#F5B53F", "center");
        ctx.font = "7px monospace";
        text(score > best ? `NEW HIGH SCORE: ${score}` : `YOU WIN · ${score} POINTS`, W / 2, H / 2, "#e8e6ff", "center");
        text("NOW YOU HAVE TO HIRE ME", W / 2, H / 2 + 12, "#5fd897", "center");
      }

      // Once the fireworks are over, stop drawing: nothing moves on the end screens.
      if (ended()) { raf = 0; return; }
      raf = requestAnimationFrame(frame);
    };
    const ended = () => (state === "over" || state === "won") && stateT < -2.5;
    const start = () => { last = performance.now(); raf = requestAnimationFrame(frame); };
    const again = () => { if (ended()) { reset(); start(); } };
    reset();
    start();

    // Arrows move the ship. The terminal input keeps focus, so these never type anything.
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") keys.left = down;
      else if (e.key === "ArrowRight") keys.right = down;
      else if (down && (e.key === "Enter" || e.key === " ")) again();
    };
    const kd = onKey(true), ku = onKey(false);
    // Touch or mouse: drag on the game, or on the thumb strip under it (phones), to steer.
    const el = canvas.current!, pad = strip.current!;
    const steer = (e: PointerEvent) => {
      if (e.type === "pointerdown") { again(); (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); }
      if (e.buttons === 0 && e.pointerType === "mouse") return;
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      ship = Math.max(4, Math.min(W - 4, ((e.clientX - r.left) / r.width) * W));
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    for (const t of [el, pad] as HTMLElement[]) { t.addEventListener("pointerdown", steer); t.addEventListener("pointermove", steer); }
    return () => {
      gone = true;
      view?.dispose();
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      for (const t of [el, pad] as HTMLElement[]) { t.removeEventListener("pointerdown", steer); t.removeEventListener("pointermove", steer); }
    };
  }, [mode]);

  return (
    <>
    <div className={`${s.crt} ${mode === "hd" ? s.hd : s.retro}`}>
      {mode === "hd" && <canvas ref={stage} aria-hidden="true" />}
      <canvas
        ref={canvas}
        width={W * S}
        height={H * S}
        className={s.hud}
        role="img"
        aria-label="Space shooter: three waves and a boss. Left and right arrows, or drag, to move. The ship fires on its own."
      />
    </div>
    {/* Phones: a big strip under the screen to steer with your thumb, so it never covers the ship */}
    <div ref={strip} className={s.strip} aria-hidden="true"><span>◀ drag here to steer ▶</span></div>
    </>
  );
}
