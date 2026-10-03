"use client";
import { useEffect, useRef } from "react";
import type { Mode } from "@/lib/arcadePrefs";
import { sfx } from "@/lib/sfx";
import { unlock } from "@/lib/achievements";
import { drawSnow, season } from "@/lib/season";
import crt from "./SpaceGame.module.css";
import s from "./Arcade.module.css";

// Ship It!: a tiny run-and-gun in a robot fortress, in the spirit of the 8-bit blue-bomber classics. Original sprites.
// Run right, blast bugs, survive the pits and spikes, beat Scope Creep in the locked room at the end.
// ← → move, Z or ↑ jump, X or Space shoot (hold to charge). Phones: the pad under the screen.
const W = 192, H = 120, T = 8, ROWS = 15, COLS = 180;
const ARENA = 156; // the boss room starts at this column

// The level, built from a few rules: ground with pits, platforms, spikes, a raised stretch.
const grid: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill("."));
const fill = (c0: number, c1: number, r0: number, r1: number, ch: string) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) grid[r][c] = ch; };
fill(0, COLS - 1, 13, 14, "#");
for (const [a, b] of [[30, 32], [70, 73], [108, 111], [138, 140]]) fill(a, b, 13, 14, ".");
for (const [a, b, r] of [[20, 24, 10], [45, 48, 9], [52, 55, 7], [60, 62, 10], [84, 89, 10], [94, 96, 8], [99, 101, 6], [134, 142, 9]]) fill(a, b, r, r, "=");
fill(118, 132, 11, 12, "#"); // a raised stretch
fill(116, 117, 12, 12, "#"); // a step up to it
for (const [a, b, r] of [[38, 40, 12], [78, 80, 12], [124, 126, 10], [146, 148, 12]]) fill(a, b, r, r, "^");
fill(COLS - 1, COLS - 1, 0, 12, "#"); // the far wall
const WALKERS = [15, 27, 42, 58, 66, 88, 104, 121, 129, 150];
const FLYERS = [50, 92, 113, 144];
const HATS = [36, 61, 86, 130, 144];
const HEALTH = [[64, 12], [97, 7], [133, 10], [152, 12]];
const CHECKPOINTS = [0, 90, 152];

const PAL: Record<string, string> = { b: "#2f6bff", l: "#7fe3ff", s: "#f2c29b", k: "#0b0a1f", w: "#ffffff", g: "#5fd897", m: "#8c94c9", p: "#ff7ac6", a: "#F5B53F", r: "#ff5a5a", y: "#fff1a8" };
// The hero: an armoured robot, helmet and visor, arm cannon out when firing. 12 × 14.
const TOP = ["...kkkkk....", "..kbbbbbk...", ".kbllbbbbk..", ".kbbsssssk..", ".kbsskssk...", ".kbbsssssk..", "..kkbbbbk..."];
const ARMS = ["..kllbbbbk..", ".kllbbbbblk.", ".klkbbbbbkk."];
const CANNON = ["..kllbbbbbbk", ".kllbbbbbbll", ".klkbbbbbbk."];
const LEGS = {
  idle: ["..kbbbbbk...", "..kbbkbbk...", ".kbbk.kbbk..", "kbbbk.kbbbk."],
  run: ["..kbbbbbk...", "..kbbk.kbk..", ".kbbk...kbk.", "kbbk.....kbk"],
  jump: ["..kbbbbbk...", ".kbbk.kbbk..", "kbbk...kbk..", "kk......kk.."],
};
const hero = (legs: keyof typeof LEGS, firing: boolean) => [...TOP, ...(firing ? CANNON : ARMS), ...LEGS[legs]];
// Wheel-bots roll the floor, drones chase you, hard-hats hide under their helmets and pop up to fire.
const WHEEL = [["..kkkk..", ".krrrrk.", "krwkrrrk", "krrrrrrk", ".kkkkkk.", "..kmmk..", ".kmkkmk.", "..kkkk.."], ["..kkkk..", ".krrrrk.", "krwkrrrk", "krrrrrrk", ".kkkkkk.", "..kkkk..", ".kmmmmk.", "..kkkk.."]];
const DRONE = [["kkkk.kkkk", "....k....", "..kmmmk..", ".kmrwmmk.", ".kmmmmmk.", "..k.k.k.."], [".kk...kk.", "....k....", "..kmmmk..", ".kmrwmmk.", ".kmmmmmk.", "..k.k.k.."]];
const BAT = [["k.......k", "kk.....kk", "kkkpkpkkk", ".kkkkkkk.", "..k...k.."], ["...k.k...", "..kkkkk..", "kkkpkpkkk", "k.kkkkk.k", "..k...k.."]];
const HAT_SHUT = ["...kkkk...", "..kaaaak..", ".kaaaaaak.", "kaaaaaaaak", "kkkkkkkkkk"];
const HAT_OPEN = ["...kkkk...", "..kaaaak..", ".kaaaaaak.", "kkkkkkkkkk", ".kwkkkkwk.", ".kkkkkkkk.", "..kk..kk.."];
// Scope Creep: the boss, a robot with a visor and an antenna. 16 × 16.
const CREEP = [
  "......kk........",
  "......ka........",
  "...kkkkkkkkkk...",
  "..kaaaaaaaaaak..",
  "..kakkkkkkkkak..",
  "..kakwrkkwrkak..",
  "..kakkkkkkkkak..",
  "..kaaaaaaaaaak..",
  ".kkkkaaaaaakkkk.",
  "kaaakaaaaaakaaak",
  "kaaakaaaaaakaaak",
  "kkk.kaaaaaak.kkk",
  "....kakkkkak....",
  "...kaak..kaak...",
  "..kaaak..kaaak..",
  "..kkkkk..kkkkk..",
];
const BOSS_HP = 28;

type Body = { x: number; y: number; vx: number; vy: number; w: number; h: number; ground: boolean };
type Enemy = Body & { kind: "wheel" | "drone" | "hat"; hp: number; baseY: number; alive: boolean; timer: number; open: number };
type Shot = { x: number; y: number; vx: number; vy: number; big: boolean; foe: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string; g: number };

const tile = (c: number, r: number) => (r < 0 ? "." : r >= ROWS ? "." : c < 0 || c >= COLS ? "#" : grid[r][c]);
const solidAt = (c: number, r: number, wall: boolean) => { const t = tile(c, r); return t === "#" || t === "=" || (wall && c === ARENA - 1 && r < 13); };

export default function ShipIt({ onEnd }: { mode?: Mode; onLost?: () => void; onEnd?: (score: number) => void }) {
  // The final score goes to the arcade's leaderboard. A ref, so the game loop never restarts for it.
  const report = useRef(onEnd);
  report.current = onEnd;
  const canvas = useRef<HTMLCanvasElement>(null);
  const glow = useRef<HTMLCanvasElement>(null);
  const keys = useRef({ left: false, right: false, jump: false, fire: false });

  useEffect(() => {
    const ctx = canvas.current!.getContext("2d")!;
    const bloom = glow.current!.getContext("2d")!;
    const k = keys.current;
    const SEASON = season();

    let p: Body & { hp: number; inv: number; face: number; charge: number; lives: number; dead: number; shot: number } = null!;
    let enemies: Enemy[] = [], shots: Shot[] = [], sparks: Spark[] = [], health: { x: number; y: number; on: boolean }[] = [];
    let boss: (Body & { hp: number; cool: number; on: boolean }) | null = null;
    let cam = 0, checkpoint = 0, score = 0, t = 0, shake = 0, flash = 0;
    let state: "ready" | "play" | "warning" | "over" | "won" = "ready", stateT = 1.8;
    let wasJump = false, wasFire = false;

    const spawnEnemies = () => {
      enemies = [
        // Ground bots drop in from above and land on whatever is there.
        ...WALKERS.map((c) => ({ x: c * T, y: 2 * T, vx: -18, vy: 0, w: 8, h: 8, ground: false, kind: "wheel" as const, hp: 1, baseY: 0, alive: true, timer: 0, open: 0 })),
        ...FLYERS.map((c) => ({ x: c * T, y: 5 * T, vx: 0, vy: 0, w: 9, h: 6, ground: false, kind: "drone" as const, hp: 2, baseY: 5 * T, alive: true, timer: 0, open: 0 })),
        ...HATS.map((c) => ({ x: c * T, y: 2 * T, vx: 0, vy: 0, w: 10, h: 7, ground: false, kind: "hat" as const, hp: 2, baseY: 0, alive: true, timer: 1, open: 0 })),
      ];
    };
    const respawn = () => {
      // Feet on the ground: every checkpoint stands on floor.
      p = { x: checkpoint * T + 12, y: 13 * T - 14.01, vx: 0, vy: 0, w: 10, h: 14, ground: false, hp: 10, inv: 1.2, face: 1, charge: 0, lives: p?.lives ?? 3, dead: 0, shot: 0 };
      shots = [];
      boss = null; // dying mid-fight reopens the room: walk back in for a fresh fight
      state = "ready"; stateT = 1.8;
    };
    const reset = () => {
      p = null!;
      checkpoint = 0; score = 0; sparks = [];
      health = HEALTH.map(([c, r]) => ({ x: c * T + 2, y: r * T + 3, on: true }));
      spawnEnemies();
      respawn();
    };

    const burst = (x: number, y: number, color: string, n = 10, speed = 50) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = speed * (0.3 + Math.random());
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.3 + Math.random() * 0.5, color, g: 60 });
      }
    };
    // The classic exit: two rings of orbs drifting out from where you stood.
    const ring = (x: number, y: number) => {
      for (const speed of [28, 50]) for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        sparks.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 1.4, color: PAL.l, g: 0 });
      }
    };
    const overlap = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const hits = (b: Body) => {
      const wall = !!boss?.on;
      for (let r = Math.floor(b.y / T); r <= Math.floor((b.y + b.h - 0.01) / T); r++)
        for (let c = Math.floor(b.x / T); c <= Math.floor((b.x + b.w - 0.01) / T); c++) if (solidAt(c, r, wall)) return true;
      return false;
    };
    // Move one axis at a time, snapping to the tile edge on contact.
    const physics = (b: Body, dt: number, gravity = 430) => {
      b.vy = Math.min(b.vy + gravity * dt, 220);
      b.x += b.vx * dt;
      if (hits(b)) { b.x = b.vx > 0 ? Math.floor((b.x + b.w) / T) * T - b.w - 0.01 : (Math.floor(b.x / T) + 1) * T; b.vx = b.vx > 0 ? -0.0001 : 0.0001; }
      b.y += b.vy * dt;
      b.ground = false;
      if (hits(b)) {
        if (b.vy > 0) { b.y = Math.floor((b.y + b.h) / T) * T - b.h - 0.01; b.ground = true; }
        else b.y = (Math.floor(b.y / T) + 1) * T;
        b.vy = 0;
      }
    };
    const hurt = (dmg: number, from: number) => {
      if (p.inv > 0 || p.dead || state !== "play") return;
      p.hp -= dmg;
      p.inv = 1.2;
      if (p.hp > 0) sfx.hurt();
      p.vx = from < p.x ? 70 : -70;
      p.vy = -110;
      shake = 0.25;
      burst(p.x + 5, p.y + 7, PAL.l, 8, 40);
      if (p.hp <= 0) die();
    };
    const die = () => {
      p.dead = 1.6;
      p.lives--;
      shake = 0.4;
      ring(p.x + 5, p.y + 7);
      sfx.boom();
      if (p.lives <= 0) { state = "over"; stateT = 0; setTimeout(sfx.lose, 600); if (score > 0) report.current?.(score); }
    };
    const fire = (big: boolean) => {
      if (!big && shots.filter((x) => !x.foe).length >= 3) return;
      p.shot = 0.25;
      if (big) sfx.charged(); else sfx.blast();
      shots.push({ x: p.x + (p.face > 0 ? 11 : -4), y: p.y + 8 - (big ? 2 : 0), vx: p.face * (big ? 170 : 150), vy: 0, big, foe: false });
    };

    let raf = 0, last = performance.now();
    const frame = (now: number) => {
      // The first frame's timestamp can be earlier than `last`: never let time run backwards.
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.04));
      last = now;
      t += dt; stateT -= dt; shake -= dt; flash -= dt;

      if (state === "ready" && stateT <= 0) state = "play";
      if (state === "warning" && stateT <= 0) state = "play";

      if (state === "play" && !p.dead) {
        // Controls: run, jump (on press), shoot (press fires, hold charges, release fires big).
        p.inv -= dt;
        p.shot -= dt;
        const dir = (k.right ? 1 : 0) - (k.left ? 1 : 0);
        if (p.inv < 0.9) p.vx = dir * 62;
        if (dir) p.face = dir;
        if (k.jump && !wasJump && p.ground) { p.vy = -185; sfx.jump(); }
        if (!k.jump && p.vy < -60) p.vy = -60; // let go early, jump lower
        if (k.fire && !wasFire) fire(false);
        if (k.fire) p.charge += dt;
        if (!k.fire && wasFire && p.charge > 0.7) fire(true);
        if (!k.fire) p.charge = 0;
        physics(p, dt);
        p.x = Math.max(boss?.on ? ARENA * T : 0, p.x);
        if (p.y > H + 16) { p.hp = 0; die(); }
        for (let r = Math.floor(p.y / T); r <= Math.floor((p.y + p.h - 0.01) / T); r++)
          for (let c = Math.floor(p.x / T); c <= Math.floor((p.x + p.w - 0.01) / T); c++) if (tile(c, r) === "^") hurt(4, p.x - p.face);
        for (const cp of CHECKPOINTS) if (p.x > cp * T + 16 && cp > checkpoint) checkpoint = cp;
        for (const h of health) if (h.on && overlap(p, { x: h.x, y: h.y, w: 4, h: 4 })) { h.on = false; sfx.power(); p.hp = Math.min(10, p.hp + 4); burst(h.x + 2, h.y + 2, PAL.p, 8, 30); }
        // The boss room: walls close behind you.
        if (!boss && p.x > (ARENA + 3) * T) {
          boss = { x: (COLS - 6) * T, y: 6 * T, vx: 0, vy: 0, w: 16, h: 13, ground: false, hp: BOSS_HP, cool: 1.8, on: true };
          state = "warning"; stateT = 2;
          sfx.warning();
        }
      }
      wasJump = k.jump; wasFire = k.fire;

      if (p.dead) {
        p.dead -= dt;
        if (p.dead <= 0 && p.lives > 0) respawn();
      }

      if (state === "play" || state === "warning") {
        for (const e of enemies) {
          if (!e.alive || Math.abs(e.x - p.x) > W) continue; // only what's near you moves
          if (e.kind === "hat") {
            // Hides (shots go tink), pops up to fire three, hides again.
            physics(e, dt);
            e.open -= dt;
            if (Math.abs(e.x - p.x) < 90) e.timer -= dt;
            if (e.timer <= 0) {
              e.open = 0.9; e.timer = 2;
              const aim = Math.sign(p.x - e.x) || 1;
              for (const vy of [-30, 0, 30]) shots.push({ x: e.x + 5, y: e.y + 2, vx: aim * 70, vy, big: false, foe: true });
              sfx.laser();
            }
          } else if (e.kind === "wheel") {
            const ahead = Math.floor((e.vx > 0 ? e.x + e.w + 1 : e.x - 1) / T);
            if (e.ground && (!solidAt(ahead, Math.floor((e.y + e.h + 2) / T), false) || solidAt(ahead, Math.floor((e.y + 2) / T), false))) e.vx *= -1; // turn at edges and walls
            physics(e, dt);
            if (Math.abs(e.vx) < 1) e.vx = e.vx >= 0 ? 18 : -18;
          } else {
            e.x += Math.sign(p.x - e.x) * 22 * dt;
            e.y = e.baseY + Math.sin(t * 3 + e.x * 0.05) * 10;
          }
          if (!p.dead && overlap(p, e)) hurt(2, e.x);
        }
        if (boss) {
          // Scope Creep: hops toward you, sprays on landing; below half health it never stops.
          const angry = boss.hp < BOSS_HP / 2;
          const landed = !boss.ground;
          physics(boss, dt, 380);
          boss.x = Math.max(ARENA * T, Math.min((COLS - 1) * T - boss.w, boss.x));
          if (boss.ground) boss.vx = 0;
          boss.cool -= dt;
          if (boss.ground && boss.cool <= 0 && state === "play") {
            boss.vy = angry ? -200 : -170;
            boss.vx = Math.sign(p.x - boss.x) * (angry ? 70 : 45);
            boss.cool = angry ? 1.1 : 1.6;
          }
          if (landed && boss.ground) {
            shake = 0.2;
            sfx.thud();
            const cx = boss.x + 8, cy = boss.y + 6, aim = Math.sign(p.x - cx) || 1;
            for (const vy of angry ? [-60, -25, 0, 25] : [-35, 0]) shots.push({ x: cx, y: cy, vx: aim * 85, vy, big: false, foe: true });
          }
          if (!p.dead && overlap(p, boss)) hurt(3, boss.x + 8);
        }
      }

      // Shots: yours hit enemies and the boss; theirs hit you. Walls stop everything.
      for (const sh of shots) {
        sh.x += sh.vx * dt; sh.y += sh.vy * dt;
        const box = { x: sh.x, y: sh.y, w: sh.big ? 6 : 3, h: sh.big ? 6 : 2 };
        if (solidAt(Math.floor(sh.x / T), Math.floor(sh.y / T), !!boss?.on) || Math.abs(sh.x - p.x) > W) { sh.y = 999; continue; }
        if (sh.foe) { if (!p.dead && overlap(p, box)) { hurt(2, sh.x); sh.y = 999; } continue; }
        for (const e of enemies) if (e.alive && overlap(e, box)) {
          e.hp -= sh.big ? 3 : 1;
          if (!sh.big) sh.y = 999;
          if (e.kind === "hat" && e.open <= 0) { e.hp += sh.big ? 3 : 1; burst(sh.x, sh.y, PAL.w, 3, 20); sh.y = 999; sfx.tink(); break; } // tink: the helmet takes it
          if (e.hp <= 0) { e.alive = false; sfx.pop(); score += e.kind === "wheel" ? 100 : e.kind === "drone" ? 200 : 300; burst(e.x + 4, e.y + 3, e.kind === "wheel" ? PAL.r : e.kind === "drone" ? PAL.m : PAL.a, 12); }
          else burst(sh.x, sh.y, PAL.w, 3, 20);
          break;
        }
        if (boss && sh.y < 900 && overlap(boss, box)) {
          boss.hp -= sh.big ? 3 : 1;
          burst(sh.x, sh.y, PAL.a, 4, 30);
          sh.y = 999;
          if (boss.hp <= 0) {
            for (let i = 0; i < 6; i++) burst(boss.x + Math.random() * 16, boss.y + Math.random() * 13, i % 2 ? PAL.a : PAL.r, 18, 80);
            score += 5000 + p.lives * 1000;
            boss = null; shots = []; shake = 0.8; flash = 0.4;
            sfx.boom(); setTimeout(sfx.win, 700);
            state = "won"; stateT = 0;
            unlock("scope");
            report.current?.(score);
          }
        }
      }
      shots = shots.filter((sh) => sh.y < 900);
      sparks = sparks.filter((sp) => ((sp.x += sp.vx * dt), (sp.y += sp.vy * dt), (sp.vy += sp.g * dt), (sp.life -= dt) > 0));

      // Camera: follows you, locks on the boss room.
      const target = boss?.on ? ARENA * T : p.x - W / 2 + 20;
      cam += (Math.max(0, Math.min(COLS * T - W, target)) - cam) * Math.min(1, dt * 8);

      // Draw: sky, a slow skyline, tiles, pickups, bodies, shots, sparks.
      ctx.save();
      if (shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 4));
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#0b0a24"); sky.addColorStop(1, "#141238");
      ctx.fillStyle = sky; ctx.fillRect(-4, -4, W + 8, H + 8);
      // The fortress wall: panels, pipes, blinking lights, scrolling slower than you.
      const off = (cam * 0.4) % 32;
      for (let i = -1; i < W / 32 + 2; i++) {
        const x = Math.round(i * 32 - off);
        ctx.fillStyle = "#161437"; ctx.fillRect(x, 0, 31, H);
        ctx.fillStyle = "#1f1c4a"; ctx.fillRect(x + 1, 6, 29, 1); ctx.fillRect(x + 1, 58, 29, 1);
        ctx.fillStyle = "#24215a"; ctx.fillRect(x + 22, 0, 4, H);
        ctx.fillStyle = "#2f2b6e"; for (let y = 10; y < H; y += 20) ctx.fillRect(x + 21, y, 6, 2);
        const id = i + Math.floor((cam * 0.4) / 32);
        ctx.fillStyle = (Math.floor(t * 2) + id) % 3 ? "#2a2560" : SEASON === "halloween" ? (id % 2 ? "#ff8c1a" : "#b46bff") : id % 2 ? "#ff5a5a" : "#5fd897";
        ctx.fillRect(x + 6, 14 + (id % 3) * 14, 2, 2);
      }
      ctx.fillStyle = "#24215a"; ctx.fillRect(0, 34, W, 3);
      ctx.translate(-Math.round(cam), 0);

      const c0 = Math.floor(cam / T), c1 = Math.min(COLS - 1, c0 + W / T + 1);
      for (let r = 0; r < ROWS; r++) for (let c = c0; c <= c1; c++) {
        const tl = tile(c, r), x = c * T, y = r * T;
        if (tl === "#") {
          // Riveted metal block: bevel light top-left, dark bottom-right, a rivet in each corner.
          ctx.fillStyle = "#3a3f7a"; ctx.fillRect(x, y, T, T);
          ctx.fillStyle = "#6d74b8"; ctx.fillRect(x, y, T, 1); ctx.fillRect(x, y, 1, T);
          ctx.fillStyle = "#1f2048"; ctx.fillRect(x, y + T - 1, T, 1); ctx.fillRect(x + T - 1, y, 1, T);
          ctx.fillStyle = "#9aa1dd"; ctx.fillRect(x + 2, y + 2, 1, 1); ctx.fillRect(x + 5, y + 5, 1, 1);
          if (tile(c, r - 1) !== "#") { ctx.fillStyle = "#F5B53F"; ctx.fillRect(x, y, T, 1); } // hazard trim on top
        } else if (tl === "=") {
          // Girder: two rails and a zigzag.
          ctx.fillStyle = "#c46a1c"; ctx.fillRect(x, y, T, 1); ctx.fillRect(x, y + 4, T, 1);
          ctx.fillStyle = "#ff9e3d"; for (let i = 0; i < 4; i++) ctx.fillRect(x + i + (c % 2 ? 0 : 4), y + 1 + (i % 3), 1, 1);
          ctx.fillStyle = "#ffcf8a"; ctx.fillRect(x, y, T, 1);
        } else if (tl === "^") {
          ctx.fillStyle = "#c9cdf0";
          for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) ctx.fillRect(x + i * 4 + j / 2, y + 4 + j, 4 - j, 1);
          ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 1, y + 4, 1, 1); ctx.fillRect(x + 5, y + 4, 1, 1);
        }
      }
      if (boss?.on) { ctx.fillStyle = "#ff5a5a"; for (let r = 0; r < 13; r++) ctx.fillRect((ARENA - 1) * T + 3, r * T + ((Math.floor(t * 6) + r) % 2) * 4, 2, 4); } // the locked door

      const sprite = (rows: string[], x: number, y: number, flip = false, tint?: string) => {
        rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[flip ? row.length - 1 - i : i]; if (ch !== ".") { ctx.fillStyle = tint ?? PAL[ch]; ctx.fillRect(Math.round(x) + i, Math.round(y) + j, 1, 1); } } });
      };
      for (const h of health) if (h.on) { ctx.fillStyle = Math.floor(t * 4) % 2 ? PAL.p : PAL.w; ctx.fillRect(h.x, h.y + 1, 4, 2); ctx.fillRect(h.x + 1, h.y, 2, 4); }
      const pose = Math.floor(t * 6) % 2;
      for (const e of enemies) if (e.alive) {
        if (e.kind === "hat") e.open > 0 ? sprite(HAT_OPEN, e.x, e.y, false) : sprite(HAT_SHUT, e.x, e.y + 2, false);
        else sprite(e.kind === "wheel" ? WHEEL[pose] : SEASON === "halloween" ? BAT[pose] : DRONE[pose], e.x, e.y, e.vx > 0);
      }
      if (boss) sprite(CREEP, boss.x, boss.y, false, boss.hp < BOSS_HP / 2 && Math.floor(t * 10) % 2 ? PAL.w : undefined);
      // READY: you beam down from the top of the screen, then appear.
      const beaming = state === "ready" && stateT > 0.7;
      if (beaming) { const by = Math.min(p.y + 8, (1.8 - stateT) * 140); ctx.fillStyle = PAL.l; ctx.fillRect(Math.round(p.x) + 4, Math.round(by) - 12, 2, 12); ctx.fillStyle = PAL.w; ctx.fillRect(Math.round(p.x) + 4, Math.round(by) - 3, 2, 3); }
      else if (!p.dead && (p.inv <= 0 || Math.floor(t * 14) % 2)) {
        const legs = !p.ground ? "jump" : Math.abs(p.vx) > 1 && pose ? "run" : "idle";
        sprite(hero(legs, p.shot > 0 || p.charge > 0.2), p.x - 1, p.y, p.face < 0, p.charge > 0.7 && Math.floor(t * 16) % 2 ? PAL.y : undefined); // flashes when charged
      }
      for (const sh of shots) {
        if (sh.big) { ctx.fillStyle = PAL.y; ctx.fillRect(Math.round(sh.x), Math.round(sh.y), 6, 6); ctx.fillStyle = PAL.w; ctx.fillRect(Math.round(sh.x) + 1, Math.round(sh.y) + 1, 4, 4); }
        else { ctx.fillStyle = sh.foe ? PAL.r : PAL.y; ctx.fillRect(Math.round(sh.x), Math.round(sh.y), 3, 2); }
      }
      for (const sp of sparks) { ctx.globalAlpha = Math.min(1, sp.life * 2); ctx.fillStyle = sp.color; ctx.fillRect(Math.round(sp.x), Math.round(sp.y), 1, 1); }
      ctx.globalAlpha = 1;
      ctx.restore();
      if (SEASON === "christmas") drawSnow(ctx, t, W, H);
      if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(0, 0, W, H); }

      // HUD: your health bar on the left, the boss's on the right, score and lives on top.
      const bar = (x: number, v: number, max: number, color: string) => {
        ctx.fillStyle = "#07061a"; ctx.fillRect(x, 10, 6, 42);
        for (let i = 0; i < 10; i++) { ctx.fillStyle = i < Math.ceil((v / max) * 10) ? color : "#2e2b5c"; ctx.fillRect(x + 1, 11 + (9 - i) * 4, 4, 3); }
      };
      bar(4, Math.max(p.hp, 0), 10, PAL.y);
      if (boss) bar(W - 10, state === "warning" ? Math.min(boss.hp, ((2 - stateT) / 1.6) * BOSS_HP) : boss.hp, BOSS_HP, PAL.a); // fills up, segment by segment
      ctx.font = "7px monospace";
      ctx.textBaseline = "top";
      ctx.textAlign = "center";
      ctx.fillStyle = "#e8e6ff"; ctx.fillText(`${score}`.padStart(6, "0"), W / 2, 2);
      ctx.textAlign = "left"; ctx.fillStyle = PAL.l; ctx.fillText(`x${Math.max(p.lives, 0)}`, 13, 2);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const say = (str: string, y: number, color: string, size = 7) => { ctx.font = `${size}px monospace`; ctx.fillStyle = color; ctx.fillText(str, W / 2, y); };
      if (state === "ready" && Math.floor(t * 5) % 2) say("READY", H / 2 - 10, "#e8e6ff", 10);
      if (state === "ready" && checkpoint === 0) say("← → MOVE · Z JUMP · X SHOOT (HOLD)", H / 2 + 4, "#8e8cae", 6);
      if (state === "warning") { if (Math.floor(t * 4) % 2) say("WARNING", H / 2 - 10, PAL.r, 10); say("SCOPE CREEP APPROACHES", H / 2 + 4, PAL.a); }
      if (state === "over") { say("GAME OVER", H / 2 - 10, PAL.r, 10); say(`${score} POINTS`, H / 2 + 2, "#e8e6ff"); say("TAP OR PRESS ENTER TO RETRY", H / 2 + 12, "#8e8cae", 6); }
      if (state === "won" && stateT < -1) { say("SHIPPED!", H / 2 - 14, PAL.a, 12); say(`SCOPE CREEP DEFEATED · ${score} POINTS`, H / 2, "#e8e6ff", 6); say("NOW YOU HAVE TO HIRE ME", H / 2 + 12, PAL.g); }

      bloom.clearRect(0, 0, W, H);
      bloom.drawImage(ctx.canvas, 0, 0);
      if (ended()) { raf = 0; return; }
      raf = requestAnimationFrame(frame);
    };
    const ended = () => (state === "over" || state === "won") && stateT < -2.5;
    const start = () => { last = performance.now(); raf = requestAnimationFrame(frame); };
    const again = () => { if (ended()) { reset(); start(); } };
    reset();
    start();

    // Keyboard. Game keys don't scroll the page while you play.
    const map: Record<string, keyof typeof k> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "jump", z: "jump", Z: "jump", x: "fire", X: "fire", " ": "fire" };
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      if ((e.target as Element).closest?.("input, textarea")) return; // typing initials, not playing
      if (down && e.key === "Enter") again();
      const name = map[e.key];
      if (!name) return;
      e.preventDefault();
      if (down && name === "fire") again();
      k[name] = down;
    };
    const kd = onKey(true), ku = onKey(false);
    const tap = () => again();
    const el = canvas.current!;
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    el.addEventListener("pointerdown", tap);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      el.removeEventListener("pointerdown", tap);
    };
  }, []);

  // Touch pad: hold buttons set the same keys the keyboard does.
  const hold = (name: keyof typeof keys.current) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); keys.current[name] = true; },
    onPointerUp: () => { keys.current[name] = false; },
    onPointerCancel: () => { keys.current[name] = false; },
  });

  return (
    <>
      <div className={crt.crt}>
        <canvas ref={canvas} width={W} height={H} role="img" aria-label="Ship It!, a platformer. Left and right arrows to run, Z or up to jump, X or Space to shoot, hold to charge." />
        <canvas ref={glow} width={W} height={H} className={crt.glow} aria-hidden="true" />
      </div>
      <div className={s.pad} aria-hidden="true">
        <span className={s.dpad}>
          <button type="button" tabIndex={-1} {...hold("left")}>◀</button>
          <button type="button" tabIndex={-1} {...hold("right")}>▶</button>
        </span>
        <span className={s.dpad}>
          <button type="button" tabIndex={-1} className={s.b} {...hold("fire")}>FIRE</button>
          <button type="button" tabIndex={-1} className={s.a} {...hold("jump")}>JUMP</button>
        </span>
      </div>
    </>
  );
}
