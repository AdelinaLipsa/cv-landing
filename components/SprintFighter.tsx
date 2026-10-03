"use client";
import { useEffect, useRef, useState } from "react";
import type { Mode } from "@/lib/arcadePrefs";
import { sfx } from "@/lib/sfx";
import { unlock } from "@/lib/achievements";
import { drawSnow, season } from "@/lib/season";
import { PO, SH, type Look } from "@/lib/fighterMotion";
import { retroFighter, type FighterView } from "@/lib/retro/fighter";
import crt from "./SpaceGame.module.css";
import s from "./Arcade.module.css";

// Sprint Fighter: a one-on-one fighter in the spirit of the 90s arcade classics. Original characters.
// You are The PO. The Stakeholder wants one more thing. Best of three rounds.
// ← → walk (hold back to block), ↑ jump, ↓ crouch, Z punch, X kick, C special (Ship-o-ken).
// Landing hits fills your meter; a full meter makes the special a super.
const W = 192, H = 120, GROUND = 104, ROUND_TIME = 45;
const S = 4; // the 2D layer draws at 4× the grid, so text is sharp

type Act = "idle" | "walk" | "crouch" | "jump" | "punch" | "kick" | "special" | "hit" | "block" | "ko" | "win";
type Input = { left: boolean; right: boolean; up: boolean; down: boolean; p: boolean; k: boolean; s: boolean };
type F = {
  x: number; y: number; vy: number; vx: number; face: number; hp: number; shown: number; meter: number;
  act: Act; actT: number; low: boolean; hitDone: boolean; stun: number; knock: number; cool: number; wins: number; combo: number;
  look: Look; prev: Input;
};
type Ball = { x: number; y: number; vx: number; owner: F; big: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };

const MOVES = {
  punch: { time: 0.28, from: 0.07, to: 0.15, reach: 16, lo: 17, hi: 22, dmg: 6, sound: "punch" },
  lowpunch: { time: 0.28, from: 0.07, to: 0.15, reach: 15, lo: 4, hi: 9, dmg: 5, sound: "punch" },
  kick: { time: 0.4, from: 0.12, to: 0.22, reach: 19, lo: 10, hi: 18, dmg: 9, sound: "kick" },
  airkick: { time: 0.35, from: 0.05, to: 0.3, reach: 15, lo: 4, hi: 14, dmg: 8, sound: "kick" },
} as const;

export default function SprintFighter({ mode: want = "hd", onLost, onEnd }: { mode?: Mode; onLost?: () => void; onEnd?: (score: number) => void }) {
  // The final score goes to the arcade's leaderboard. A ref, so the game loop never restarts for it.
  const report = useRef(onEnd);
  report.current = onEnd;
  // Owns its fallback like Ship It!: no WebGL or a lost GPU swaps to Retro in place (the match goes on), then tells the parent.
  const [shown, setShown] = useState(want);
  const lost = useRef(onLost);
  lost.current = onLost;
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Input>({ left: false, right: false, up: false, down: false, p: false, k: false, s: false });

  useEffect(() => {
    setShown(want);
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.current!.getContext("2d")!;
    ctx.setTransform(S, 0, 0, S, 0, 0);
    const SEASON = season();
    let view: FighterView | null = null, gone = false, dropped = false;
    const drop = () => {
      if (gone || dropped) return;
      dropped = true;
      view?.dispose();
      view = retroFighter(ctx, W, H, GROUND);
      setShown("retro");
      lost.current?.();
    };
    if (want === "retro") view = retroFighter(ctx, W, H, GROUND);
    else import("@/lib/fighter3d")
      .then((m) => (gone ? null : m.mountFighter(stage.current!, W, H, GROUND, drop)))
      .then((v) => { if (!v) return; if (gone || dropped) v.dispose(); else view = v; })
      .catch(drop);

    const fighter = (x: number, face: number, look: Look, wins = 0): F => ({
      x, y: 0, vy: 0, vx: 0, face, hp: 100, shown: 100, meter: 0, act: "idle", actT: 0, low: false, hitDone: false,
      stun: 0, knock: 0, cool: 0, wins, combo: 0, look, prev: { left: false, right: false, up: false, down: false, p: false, k: false, s: false },
    });
    let me = fighter(56, 1, PO), cpu = fighter(136, -1, SH);
    let balls: Ball[] = [], sparks: Spark[] = [];
    let round = 1, clock = ROUND_TIME, t = 0, pause = 0, shake = 0, flash = 0, score = 0;
    // A round you win scores 1000, plus 10 per health point left, 20 per second on the clock, 2000 more if perfect.
    const roundWon = () => { score += 1000 + me.hp * 10 + Math.ceil(clock) * 20 + (me.hp === 100 ? 2000 : 0); };
    let state: "intro" | "fight" | "ko" | "end" = "intro", stateT = 2.2, callout = "", calloutT = 0, comboText = "", comboT = 0;
    const ai: Input & { think: number } = { left: false, right: false, up: false, down: false, p: false, k: false, s: false, think: 0 };

    const say = (text: string, time = 1.1) => { callout = text; calloutT = time; };
    const newRound = () => {
      me = fighter(56, 1, PO, me.wins); cpu = fighter(136, -1, SH, cpu.wins);
      balls = []; clock = ROUND_TIME; state = "intro"; stateT = 2.2;
    };
    const reset = () => { me = fighter(56, 1, PO); cpu = fighter(136, -1, SH); round = 1; score = 0; sparks = []; newRound(); };

    const burst = (x: number, y: number, color: string, n = 10, speed = 60) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = speed * (0.3 + Math.random());
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.25 + Math.random() * 0.3, color });
      }
    };
    const attacking = (f: F) => ["punch", "kick", "special"].includes(f.act);
    const height = (f: F) => (f.act === "crouch" || f.low ? 15 : 26);

    // A hit lands: blocked (chip damage) if the target holds back on the ground, otherwise damage, stun, knockback.
    const land = (by: F, to: F, dmg: number, x: number, y: number, sound: "punch" | "kick" | "fireball") => {
      const back = to.face > 0 ? to.prev.left : to.prev.right;
      if (back && to.y === 0 && to.stun <= 0 && !attacking(to) && to.act !== "ko") {
        to.hp -= 1; to.act = "block"; to.actT = 0.2; to.knock = by.face * 50;
        burst(x, y, "#9cc6ff", 6, 40); sfx.block();
        by.meter = Math.min(100, by.meter + 4);
        return;
      }
      to.combo = to.stun > 0 ? to.combo + 1 : 1;
      if (to.combo >= 2) { comboText = `${to.combo} HIT COMBO`; comboT = 1; }
      to.hp = Math.max(0, to.hp - dmg);
      to.stun = 0.32; to.act = "hit"; to.knock = by.face * (sound === "kick" ? 80 : 60);
      if (to.y < 0) to.vy = -60;
      by.meter = Math.min(100, by.meter + 12); to.meter = Math.min(100, to.meter + 6);
      burst(x, y, "#fff1a8", 12, 70); burst(x, y, "#ff7ac6", 6, 40);
      pause = 0.06; shake = 0.15;
      sfx[sound]();
      if (to.hp <= 0) {
        to.act = "ko"; to.vy = -120; to.knock = by.face * 70; to.stun = 9;
        state = "ko"; stateT = 3; pause = 0.4; shake = 0.5; flash = 0.3;
        sfx.ko(); say("K.O.", 2.4);
        if (by === me && me.hp === 100) unlock("perfect");
        by.wins++;
        if (by === me) roundWon();
      }
    };

    const step = (f: F, foe: F, inp: Input, dt: number) => {
      const pressed = (b: "p" | "k" | "s" | "up") => inp[b] && !f.prev[b];
      if (f.act === "ko") {
        f.vy += 420 * dt; f.y = Math.min(0, f.y + f.vy * dt); f.x += f.knock * dt; f.knock *= 0.92;
      } else if (f.act === "win") {
        f.actT += dt;
      } else if (f.stun > 0) {
        f.stun -= dt; f.x += f.knock * dt; f.knock *= 0.85;
        if (f.stun <= 0) { f.act = "idle"; f.combo = 0; }
      } else if (f.act === "block" && f.actT > 0) {
        f.actT -= dt; f.x += f.knock * dt; f.knock *= 0.85;
      } else if (attacking(f)) {
        f.actT += dt;
        const m = f.act === "special" ? null : MOVES[f.y < 0 && f.act === "kick" ? "airkick" : f.low && f.act === "punch" ? "lowpunch" : (f.act as "punch" | "kick")];
        if (f.act === "special" && !f.hitDone && f.actT > 0.18) {
          f.hitDone = true;
          const big = f.meter >= 100;
          if (big) { f.meter = 0; flash = 0.25; say(`MEGA ${f.look.move}`, 1.2); } else say(f.look.move, 0.9);
          balls.push({ x: f.x + f.face * 12, y: 19, vx: f.face * (big ? 110 : 85), owner: f, big });
          sfx.fireball();
        }
        if (m && !f.hitDone && f.actT >= m.from && f.actT <= m.to) {
          const hx = f.x + f.face * m.reach, fy = -f.y;
          const top = height(foe) - foe.y;
          if (Math.abs(hx - foe.x) < 7 && fy + m.hi > -foe.y && fy + m.lo < top && foe.act !== "ko") {
            f.hitDone = true;
            land(f, foe, m.dmg, (hx + foe.x) / 2, GROUND + foe.y - (m.lo + m.hi) / 2, m.sound);
          }
        }
        if (f.actT >= (f.act === "special" ? 0.5 : m?.time ?? 0.3)) { f.act = f.y < 0 ? "jump" : "idle"; f.low = false; }
      } else {
        const fwd = f.face > 0 ? inp.right : inp.left, back = f.face > 0 ? inp.left : inp.right;
        if (f.y === 0) {
          f.low = inp.down;
          if (pressed("up")) { f.vy = -165; f.vx = (fwd ? 1 : back ? -1 : 0) * f.face * 55; f.act = "jump"; sfx.jump(); }
          else if (pressed("p")) { f.act = "punch"; f.actT = 0; f.hitDone = false; sfx.blast(); }
          else if (pressed("k") && !f.low) { f.act = "kick"; f.actT = 0; f.hitDone = false; }
          else if (pressed("s") && f.cool <= 0 && !balls.some((b) => b.owner === f)) { f.act = "special"; f.actT = 0; f.hitDone = false; f.cool = 1.2; }
          else if (f.low) f.act = "crouch";
          else { f.x += (fwd ? 46 : back ? -38 : 0) * f.face * dt; f.act = fwd || back ? "walk" : "idle"; }
        } else if (pressed("k")) { f.act = "kick"; f.actT = 0; f.hitDone = false; }
      }
      f.cool -= dt;
      // Gravity, landing, facing, staying on screen.
      if (f.y < 0 || f.vy < 0) {
        f.vy += 420 * dt; f.y += f.vy * dt;
        if (f.act !== "ko") f.x += f.vx * dt;
        if (f.y >= 0) { f.y = 0; f.vy = 0; f.vx = 0; if (f.act === "jump" || f.act === "kick") f.act = "idle"; }
      }
      if (f.y === 0 && !attacking(f) && f.stun <= 0 && f.act !== "ko") f.face = foe.x > f.x ? 1 : -1;
      f.x = Math.max(10, Math.min(W - 10, f.x));
      f.prev = { ...inp };
    };

    // The Stakeholder thinks a few times a second: approach, poke, block, throw requests from afar.
    const think = (dt: number) => {
      ai.p = ai.k = ai.s = false;
      ai.think -= dt;
      if (ai.think > 0 || cpu.stun > 0) return;
      ai.think = 0.12 + Math.random() * (0.32 - round * 0.05);
      ai.left = ai.right = ai.up = ai.down = false;
      const d = Math.abs(me.x - cpu.x), toward = me.x > cpu.x ? "right" : "left", away = toward === "right" ? "left" : "right";
      const r = Math.random(), skill = 0.35 + round * 0.12;
      const incoming = balls.find((b) => b.owner === me && Math.abs(b.x - cpu.x) < 50);
      if (attacking(me) && d < 30 && r < skill) ai[away] = true;
      else if (incoming && r < skill + 0.1) { if (Math.random() < 0.5) ai.up = true; else ai[away] = true; }
      else if (d > 70 && r < 0.3 && cpu.cool <= 0) ai.s = true;
      else if (d > 26) { if (r < 0.85) ai[toward] = true; if (r < 0.08) ai.up = true; }
      else if (r < 0.35) ai.p = true;
      else if (r < 0.6) ai.k = true;
      else if (r < 0.72) ai[away] = true;
      else if (r < 0.8) { ai.up = true; ai[toward] = true; }
      else if (r < 0.9) { ai.down = true; ai.p = true; }
    };

    let raf = 0, last = performance.now();
    const frame = (now: number) => {
      // The first frame's timestamp can be earlier than `last`: never let time run backwards.
      let dt = Math.max(0, Math.min((now - last) / 1000, 0.04));
      last = now;
      t += dt; shake -= dt; flash -= dt; calloutT -= dt; comboT -= dt;
      if (pause > 0) { pause -= dt; dt = 0; } // hit-stop: the world freezes for a beat on impact

      stateT -= dt;
      if (state === "intro") {
        if (stateT > 1 && calloutT <= 0) say(round === 3 ? "FINAL ROUND" : `ROUND ${round}`, 1.1);
        if (stateT <= 1 && callout !== "FIGHT!") { say("FIGHT!", 0.9); sfx.wave(); }
        if (stateT <= 0.1) state = "fight";
      }
      if (state === "fight") {
        clock -= dt;
        if (clock <= 0) {
          clock = 0; state = "ko"; stateT = 2.5; say("TIME!", 2);
          const w = me.hp === cpu.hp ? null : me.hp > cpu.hp ? me : cpu;
          if (w) w.wins++;
          if (w === me) roundWon();
        }
      }
      if (state === "fight" || state === "ko") {
        if (state === "fight") think(dt);
        const frozen: Input = { left: false, right: false, up: false, down: false, p: false, k: false, s: false };
        step(me, cpu, state === "fight" ? keys.current : frozen, dt);
        step(cpu, me, state === "fight" ? ai : frozen, dt);
        // Bodies can't pass through each other.
        const gap = cpu.x - me.x;
        if (Math.abs(gap) < 12 && me.y === 0 && cpu.y === 0) { const push = (12 - Math.abs(gap)) / 2 * Math.sign(gap || 1); me.x -= push; cpu.x += push; }
      }
      if (state === "ko" && stateT <= 0) {
        const winner = me.wins >= 2 ? me : cpu.wins >= 2 ? cpu : null;
        if (winner) {
          state = "end"; stateT = 0;
          if (score > 0) report.current?.(score);
          winner.act = "win";
          if (winner === me) { sfx.win(); unlock("stakeholder"); } else sfx.lose();
        } else { round++; newRound(); }
      }

      // Fireballs: fly, cancel each other out, hit standing bodies (crouch under them).
      for (const b of balls) {
        b.x += b.vx * dt;
        const foe = b.owner === me ? cpu : me;
        const other = balls.find((o) => o !== b && o.owner !== b.owner && Math.abs(o.x - b.x) < 6);
        if (other) { burst((b.x + other.x) / 2, GROUND - 19, "#ffffff", 14, 60); b.x = other.x = -99; sfx.pop(); continue; }
        if (foe.act !== "ko" && Math.abs(b.x - foe.x) < 7 && GROUND - 19 + 3 > GROUND + foe.y - height(foe) && GROUND - 19 - 3 < GROUND + foe.y) {
          land(b.owner, foe, b.big ? 22 : 10, b.x, GROUND - 19, "fireball");
          b.x = -99;
        }
      }
      balls = balls.filter((b) => b.x > -10 && b.x < W + 10);
      sparks = sparks.filter((sp) => ((sp.x += sp.vx * dt), (sp.y += sp.vy * dt), (sp.vy += 80 * dt), (sp.life -= dt) > 0));
      for (const f of [me, cpu]) f.shown += (f.hp - f.shown) * Math.min(1, dt * (f.shown > f.hp ? 2.5 : 10)); // the red part drains behind

      // Draw: the view (3D on the stage canvas, or Retro on this one), then snow, flash and the HUD on top.
      ctx.clearRect(0, 0, W, H);
      view?.draw({
        t, dt, shake: calm ? 0 : shake, pause, halloween: SEASON === "halloween", christmas: SEASON === "christmas", state, stateT,
        fighters: [me, cpu].map((f) => ({ x: f.x, y: f.y, face: f.face, act: f.act, actT: f.actT, low: f.low, look: f.look })),
        balls: balls.map((b) => ({ x: b.x, y: GROUND - 19, vx: b.vx, mine: b.owner === me, big: b.big })),
        sparks,
      });
      if (SEASON === "christmas") drawSnow(ctx, t, W, H);
      if (flash > 0 && !calm) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(0, 0, W, H); }

      // HUD: health bars that drain red, names, round pips, clock, meters.
      const bar = (f: F, left: boolean) => {
        const x = left ? 6 : W - 6 - 76, w = 76;
        ctx.fillStyle = "#07061a"; ctx.fillRect(x - 1, 5, w + 2, 6);
        ctx.fillStyle = "#ff5a5a"; const sw = (w * f.shown) / 100; ctx.fillRect(left ? x + w - sw : x, 6, sw, 4);
        ctx.fillStyle = f.hp > 30 ? "#F5B53F" : "#ff7ac6"; const hw = (w * f.hp) / 100; ctx.fillRect(left ? x + w - hw : x, 6, hw, 4);
        ctx.font = "6px monospace"; ctx.textBaseline = "top"; ctx.textAlign = left ? "left" : "right";
        ctx.fillStyle = "#ffffff"; ctx.fillText(f.look.name, left ? x : x + w, 12);
        for (let i = 0; i < f.wins; i++) { ctx.fillStyle = "#F5B53F"; ctx.fillRect(left ? x + w - 4 - i * 6 : x + i * 6, 13, 4, 4); }
        const mx = left ? 6 : W - 6 - 40;
        ctx.fillStyle = "#07061a"; ctx.fillRect(mx - 1, H - 6, 42, 4);
        ctx.fillStyle = f.meter >= 100 ? (Math.floor(t * 8) % 2 ? "#5fd0ff" : "#ffffff") : "#3f7cff"; ctx.fillRect(left ? mx : mx + 40 - (40 * f.meter) / 100, H - 5, (40 * f.meter) / 100, 2);
      };
      bar(me, true); bar(cpu, false);
      ctx.font = "9px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillStyle = clock < 10 ? "#ff5a5a" : "#ffffff"; ctx.fillText(`${Math.ceil(clock)}`, W / 2, 4);

      ctx.textBaseline = "middle";
      if (calloutT > 0) {
        ctx.font = callout.length > 10 ? "9px monospace" : "13px monospace";
        ctx.fillStyle = "#07061a"; ctx.fillText(callout, W / 2 + 1, 45 + 1);
        ctx.fillStyle = callout === "K.O." ? "#ff5a5a" : "#fff1a8"; ctx.fillText(callout, W / 2, 45);
      }
      if (comboT > 0) { ctx.font = "7px monospace"; ctx.fillStyle = "#F5B53F"; ctx.fillText(comboText, W / 2, 30); }
      if (state === "intro" && round === 1) { ctx.font = "6px monospace"; ctx.fillStyle = "#ffffff"; ctx.fillText("←→ MOVE  ↑ JUMP  ↓ CROUCH  Z PUNCH  X KICK  C SPECIAL", W / 2, 62); }
      if (state === "end") {
        const won = me.wins >= 2;
        ctx.fillStyle = "rgba(7,6,26,0.6)"; ctx.fillRect(0, 34, W, 46);
        ctx.font = "12px monospace"; ctx.fillStyle = won ? "#F5B53F" : "#ff5a5a";
        ctx.fillText(won ? (me.hp === 100 ? "PERFECT!" : "YOU WIN!") : "YOU LOSE", W / 2, 46);
        ctx.font = "6px monospace"; ctx.fillStyle = "#e8e6ff";
        ctx.fillText(won ? "THE STAKEHOLDER AGREES TO THE ROADMAP" : "THE STAKEHOLDER ADDED THREE MORE FEATURES", W / 2, 58);
        ctx.fillStyle = "#F5B53F"; ctx.fillText(`SCORE ${score}`, W / 2, 66);
        ctx.fillStyle = "#8e8cae"; ctx.fillText("TAP OR PRESS ENTER FOR A REMATCH", W / 2, 74);
      }

      raf = requestAnimationFrame(frame);
    };
    const again = () => { if (state === "end") reset(); };
    reset();
    raf = requestAnimationFrame(frame);

    const map: Record<string, keyof Input> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", z: "p", Z: "p", x: "k", X: "k", c: "s", C: "s" };
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      if ((e.target as Element).closest?.("input, textarea")) return; // typing initials, not playing
      if (down && e.key === "Enter") again();
      const name = map[e.key];
      if (!name) return;
      e.preventDefault();
      keys.current[name] = down;
    };
    const kd = onKey(true), ku = onKey(false);
    const el = canvas.current!;
    el.addEventListener("pointerdown", again);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      gone = true; view?.dispose();
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", again);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, [want]);

  const hold = (name: keyof Input) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); keys.current[name] = true; },
    onPointerUp: () => { keys.current[name] = false; },
    onPointerCancel: () => { keys.current[name] = false; },
  });

  return (
    <>
      <div className={`${crt.crt} ${shown === "hd" ? crt.hd : crt.retro}`}>
        {shown === "hd" && <canvas ref={stage} aria-hidden="true" />}
        <canvas ref={canvas} width={W * S} height={H * S} className={crt.hud} role="img" aria-label="Sprint Fighter, a one-on-one fighting game. Arrows to move, jump and crouch, hold back to block. Z punch, X kick, C special." />
      </div>
      <div className={s.pad} aria-hidden="true">
        {/* A d-pad cross on the left, the three attack buttons on the right */}
        <span className={s.cross}>
          <button type="button" tabIndex={-1} className={s.u} {...hold("up")}>▲</button>
          <button type="button" tabIndex={-1} className={s.l} {...hold("left")}>◀</button>
          <button type="button" tabIndex={-1} className={s.r} {...hold("right")}>▶</button>
          <button type="button" tabIndex={-1} className={s.d} {...hold("down")}>▼</button>
        </span>
        <span className={s.btns}>
          <button type="button" tabIndex={-1} className={s.a} {...hold("p")}>P</button>
          <button type="button" tabIndex={-1} className={s.b} {...hold("k")}>K</button>
          <button type="button" tabIndex={-1} className={`${s.c} ${s.wide}`} {...hold("s")}>SP</button>
        </span>
      </div>
    </>
  );
}
