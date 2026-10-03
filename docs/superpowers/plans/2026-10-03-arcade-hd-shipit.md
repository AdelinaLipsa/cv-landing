# Arcade HD, Plan 3: Ship It! in 3D — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship It! gets the HD treatment: a rigged, animated robot hero (CC0), a factory level with real depth and PBR steel, shadows, light shafts, steam, beacon lights, scorch marks where shots hit, dust shockwaves and a teleport beam-in. The pixel version stays as Retro. Same game underneath.

**Architecture:** Same pattern as the space shooter (Plan 1). `components/ShipIt.tsx` keeps all game logic on its tile grid and builds one `ShipItFrame` per frame. Two views draw it: `lib/shipit3d.ts` (HD, three.js on the shared stage `lib/arcade3d.ts`) and `lib/retro/shipit.ts` (the original pixel drawing, moved out of the component). A sharp 4× HUD canvas on top carries health bars and messages. The component owns its Retro fallback exactly like `components/SpaceGame.tsx` does. Level blocks stand from z = 0 back to z = −16, front faces on the grid; bodies move in the plane z = −6.

**Tech Stack:** Next 16, React 19, TypeScript 7, three 0.186 (`AnimationMixer`, `GLTFLoader` via `lib/assets.ts`), Node 26 test runner over `*.check.ts`.

**Spec:** `docs/superpowers/plans/2026-10-03-arcade-hd.md` → "Vision" → "Ship It! (Plan 3)" and "Everywhere", plus its Global Constraints. Starting draft for the HD view: `docs/superpowers/plans/2026-10-03-arcade-hd-shipit.draft.ts.txt` (procedural level, enemies, boss, robot; written before Plan 1 changed the stage API).

## Global Constraints

- Everything in the parent plan's Global Constraints applies (rules/hitboxes/timings unchanged; views read state only; FOV 30 and `D = H/2 / tan(15°)`; no new runtime dependencies; CC0 assets only; ≤ 1.5 MB per file, ≤ 4 MB per game in `public/arcade/shipit/`; reduced motion: no shake/flash; Retro on missing WebGL 2 or a lost context, and the run keeps going; seasons keep working; copy via cv-copywriter; commits end with a Co-Authored-By trailer).
- Ship It! grid: `W = 192`, `H = 120`, tile `T = 8`, `ROWS = 15`, `COLS = 180`, boss room from column `ARENA = 156`. HD world: `x = gridX`, `y = −gridY`; camera at `(cam + W/2 + lead, −H/2, D)`.
- Assets (approved by Adelina, "yes to all" / "do everything you need"): `RobotExpressive.glb` (CC0 1.0, Tomás Laulhé / Quaternius, modified by Don McCurdy; from the three.js repo r170), Poly Haven "Metal Plate" (CC0, Rob Tuytel) at 512 px.
- Retro must look exactly like the game does today (same sprites, colours, timing).

## Review Focus

1. **The robot fails to load** (offline, 404, bad file): the procedural robot from the draft stands in and the game plays normally. Pinned in Task 4 (`.catch` keeps the procedural hero) with a manual check (rename the file, reload).
2. **Retro parity**: Retro mode is the game exactly as before (sprites, beam-in, blinking, boss flash, door). Pinned in Task 3 (code moved verbatim) and its browser check (side-by-side with `git stash`-free comparison against commit `884cf20`).
3. **GPU lost mid-level**: Retro takes over at the same position, score, lives and checkpoint. Pinned in Task 3 (same `drop()` as SpaceGame) and its browser check with `WEBGL_lose_context`.
4. **Depth vs hitboxes**: bodies at z = −6 project slightly toward the screen centre; at the screen edge the error must stay under 3 grid units, and the camera's look-ahead must never change what can be hit. Pinned in Task 2 (`lookAhead` is view-only and returns 0 in the boss room) and Task 3's browser check (touch a spike at the right edge).
5. **Boss room**: the door bars appear, the camera locks (no look-ahead), the boss squashes, telegraphs and kicks up dust; dying in the room reopens it. Pinned in Tasks 2, 3 and 7.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `public/arcade/shipit/robot.glb` (add) | The hero model (CC0) |
| `public/arcade/shipit/metal-plate-{diff,nor,rough}.jpg` (add) | Block textures, 512 px (CC0) |
| `public/humans.txt` (modify) | Credits |
| `lib/shipitMotion.ts` (create) | Pure: which animation clip, camera look-ahead, squash and stretch |
| `lib/shipitMotion.check.ts` (create) | Node tests for the above |
| `lib/retro/shipit.ts` (create) | The original pixel drawing, as a view; owns the sprite data and `PAL` |
| `lib/shipit3d.ts` (create from the draft) | HD view: level, bodies, effects |
| `components/ShipIt.tsx` (modify) | Builds frames; HD/Retro with in-place fallback; HUD on the 4× canvas; emits wall impacts |

---

### Task 1: Assets and credits

**Files:**
- Add: `public/arcade/shipit/robot.glb`, `public/arcade/shipit/metal-plate-diff.jpg`, `public/arcade/shipit/metal-plate-nor.jpg`, `public/arcade/shipit/metal-plate-rough.jpg`
- Modify: `public/humans.txt`

- [ ] **Step 1: Fetch and shrink**

```bash
mkdir -p public/arcade/shipit
curl -sfL -o public/arcade/shipit/robot.glb https://raw.githubusercontent.com/mrdoob/three.js/r170/examples/models/gltf/RobotExpressive/RobotExpressive.glb
for m in diff nor_gl rough; do
  curl -sfL -o /tmp/mp-$m.jpg "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/metal_plate/metal_plate_${m}_1k.jpg"
done
sips -Z 512 -s formatOptions 82 /tmp/mp-diff.jpg --out public/arcade/shipit/metal-plate-diff.jpg
sips -Z 512 -s formatOptions 90 /tmp/mp-nor_gl.jpg --out public/arcade/shipit/metal-plate-nor.jpg
sips -Z 512 -s formatOptions 82 /tmp/mp-rough.jpg --out public/arcade/shipit/metal-plate-rough.jpg
ls -la public/arcade/shipit
```

Expected: `robot.glb` ≈ 464 KB; each jpg under 250 KB. If a Poly Haven URL 404s, read the real URLs from `https://api.polyhaven.com/files/metal_plate` (keys `Diffuse`, `nor_gl`, `Rough` → `1k` → `jpg` → `url`).

- [ ] **Step 2: Check the budget**

Run: `npm run assets:check`
Expected: exit 0, no output.

- [ ] **Step 3: Credit them in `public/humans.txt`**, appending:

```
/* ARCADE ASSETS */
Ship It! robot: RobotExpressive by Tomás Laulhé (Quaternius), modified by Don McCurdy. CC0 1.0.
Ship It! steel: Metal Plate by Rob Tuytel, Poly Haven. CC0.
```

- [ ] **Step 4: Commit**

```bash
git add public/arcade/shipit public/humans.txt
git commit -m "Ship It! assets: a CC0 robot and worn steel plates, credited

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Motion helpers (pure)

**Files:**
- Create: `lib/shipitMotion.ts`
- Test: `lib/shipitMotion.check.ts`

**Interfaces:**
- Produces: `type Clip = "Idle" | "Running" | "Jump" | "ThumbsUp"`, `heroClip(s: { won: boolean; ground: boolean; vx: number }): Clip`, `lookAhead(prev: number, face: number, vx: number, dt: number, locked: boolean): number`, `squash(prev: number, landedHard: boolean, ground: boolean, vy: number, dt: number): { s: number; y: number }`.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/shipitMotion.check.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { heroClip, lookAhead, squash } from "./shipitMotion.ts";

test("standing still is Idle", () => assert.equal(heroClip({ won: false, ground: true, vx: 0 }), "Idle"));
test("moving on the ground is Running", () => assert.equal(heroClip({ won: false, ground: true, vx: -62 }), "Running"));
test("in the air is Jump, whatever the speed", () => assert.equal(heroClip({ won: false, ground: false, vx: 62 }), "Jump"));
test("winning beats everything", () => assert.equal(heroClip({ won: true, ground: false, vx: 62 }), "ThumbsUp"));
test("tiny drift is not running", () => assert.equal(heroClip({ won: false, ground: true, vx: 0.5 }), "Idle"));

test("look-ahead eases toward 16 units in the running direction", () => {
  let x = 0;
  for (let i = 0; i < 120; i++) x = lookAhead(x, 1, 62, 1 / 60, false);
  assert.ok(x > 15 && x <= 16, `got ${x}`);
  for (let i = 0; i < 120; i++) x = lookAhead(x, -1, -62, 1 / 60, false);
  assert.ok(x < -15 && x >= -16, `got ${x}`);
});
test("look-ahead returns to centre when you stop", () => {
  let x = 16;
  for (let i = 0; i < 180; i++) x = lookAhead(x, 1, 0, 1 / 60, false);
  assert.ok(Math.abs(x) < 0.1, `got ${x}`);
});
test("the boss room locks the camera: look-ahead goes to 0", () => {
  let x = 16;
  for (let i = 0; i < 180; i++) x = lookAhead(x, 1, 62, 1 / 60, true);
  assert.ok(Math.abs(x) < 0.1, `got ${x}`);
});
test("a huge dt never overshoots", () => assert.equal(lookAhead(0, 1, 62, 10, false), 16));

test("a hard landing squashes, then springs back", () => {
  let { s, y } = squash(1, true, true, 0, 0);
  assert.equal(y, 0.7);
  for (let i = 0; i < 60; i++) ({ s, y } = squash(s, false, true, 0, 1 / 60));
  assert.ok(y > 0.99, `got ${y}`);
});
test("in the air it stretches with speed, at most 20%", () => {
  assert.equal(squash(1, false, false, 0, 1 / 60).y, 1);
  assert.equal(squash(1, false, false, 450, 1 / 60).y, 1.2);
  assert.ok(squash(1, false, false, -90, 1 / 60).y > 1.09);
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npm test`
Expected: FAIL, `Cannot find module '.../lib/shipitMotion.ts'`.

- [ ] **Step 3: Implement**

```ts
// lib/shipitMotion.ts
// Ship It!'s HD motion, kept pure so it can be tested: which animation the robot plays, where the camera
// leads, and how the boss squashes and stretches. View-only: none of this changes what can be hit.
export type Clip = "Idle" | "Running" | "Jump" | "ThumbsUp";

export function heroClip(s: { won: boolean; ground: boolean; vx: number }): Clip {
  if (s.won) return "ThumbsUp";
  if (!s.ground) return "Jump";
  return Math.abs(s.vx) > 1 ? "Running" : "Idle";
}

// The camera leads where you run: eases toward 16 units ahead of your facing, back to centre when you stop.
// In the boss room the game locks the camera, so the lead goes to 0.
const LEAD = 16, RATE = 3;
export function lookAhead(prev: number, face: number, vx: number, dt: number, locked: boolean) {
  const target = !locked && Math.abs(vx) > 1 ? face * LEAD : 0;
  return prev + (target - prev) * Math.min(1, dt * RATE);
}

// Squash to 70% on a hard landing and spring back; stretch up to 20% while airborne, with speed.
export function squash(prev: number, landedHard: boolean, ground: boolean, vy: number, dt: number) {
  let s = landedHard ? 0.7 : prev;
  if (!landedHard) s += (1 - s) * Math.min(1, dt * 8);
  return { s, y: ground ? s : 1 + Math.min(0.2, Math.abs(vy) / 900) };
}
```

- [ ] **Step 4: Run the tests to see them pass**

Run: `npm test`
Expected: PASS, all tests including the 11 new ones.

- [ ] **Step 5: Commit**

```bash
git add lib/shipitMotion.ts lib/shipitMotion.check.ts
git commit -m "Ship It! motion helpers: clip choice, camera look-ahead, squash and stretch

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Retro view, the HD view from the draft, and HD/Retro in the component

**Files:**
- Create: `lib/retro/shipit.ts`, `lib/shipit3d.ts`
- Modify: `components/ShipIt.tsx`

**Interfaces:**
- Consumes: `stage(canvas, W, H, { shadows, env, onLost })` and `st.render(dt)`, `st.calm` (`lib/arcade3d.ts`); `Mode` (`lib/arcadePrefs.ts`); `lookAhead`, `squash` (Task 2).
- Produces:
  - `type Level = { tile: (c: number, r: number) => string; rows: number; cols: number; size: number; arena: number }`
  - `type ShipItFrame` (below) and `type ShipItView = { draw(f: ShipItFrame): void; dispose(): void }`, exported from `lib/shipit3d.ts`.
  - `mountShipIt(canvas, W, H, level: Level, onLost?: () => void): Promise<ShipItView>`
  - `retroShipIt(ctx, W, H, level: Level): ShipItView` and `PAL` from `lib/retro/shipit.ts`.

```ts
export type ShipItFrame = {
  t: number; dt: number; cam: number; shake: number; halloween: boolean;
  p: { x: number; y: number; vx: number; vy: number; ground: boolean; face: number; shot: number; charge: number; won: boolean; visible: boolean; beam: number | null };
  enemies: { x: number; y: number; vx: number; kind: "wheel" | "drone" | "hat"; alive: boolean; open: number }[];
  boss: { x: number; y: number; vy: number; ground: boolean; cool: number; hit: boolean } | null;
  door: boolean;
  health: { x: number; y: number; on: boolean }[];
  shots: { x: number; y: number; vx: number; vy: number; big: boolean; foe: boolean }[];
  sparks: { x: number; y: number; life: number; color: string }[];
  impacts: { x: number; y: number; at: number }[];
};
```

- [ ] **Step 1: Create `lib/retro/shipit.ts` by moving the drawing code out of `components/ShipIt.tsx`**

Move these declarations verbatim from `components/ShipIt.tsx` into the new file (and delete them from the component): `PAL` (export it), `TOP`, `ARMS`, `CANNON`, `LEGS`, `hero`, `WHEEL`, `DRONE`, `BAT`, `HAT_SHUT`, `HAT_OPEN`, `CREEP`. Then add:

```ts
// Ship It! as it was: pixel sprites on a riveted fortress, drawn on the 2D layer.
// Retro mode, and the fallback when WebGL isn't there or the GPU takes it back.
import type { Level, ShipItFrame, ShipItView } from "../shipit3d";

// ...the moved sprite data and PAL go here...

export function retroShipIt(ctx: CanvasRenderingContext2D, W: number, H: number, level: Level): ShipItView {
  const { tile, cols: COLS, size: T, arena: ARENA } = level;
  const sprite = (rows: string[], x: number, y: number, flip = false, tint?: string) => {
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[flip ? row.length - 1 - i : i]; if (ch !== ".") { ctx.fillStyle = tint ?? PAL[ch]; ctx.fillRect(Math.round(x) + i, Math.round(y) + j, 1, 1); } } });
  };
  return {
    draw(f) {
      const { t, cam, p } = f;
      ctx.save();
      if (f.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 4));
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
        ctx.fillStyle = (Math.floor(t * 2) + id) % 3 ? "#2a2560" : f.halloween ? (id % 2 ? "#ff8c1a" : "#b46bff") : id % 2 ? "#ff5a5a" : "#5fd897";
        ctx.fillRect(x + 6, 14 + (id % 3) * 14, 2, 2);
      }
      ctx.fillStyle = "#24215a"; ctx.fillRect(0, 34, W, 3);
      ctx.translate(-Math.round(cam), 0);

      const c0 = Math.floor(cam / T), c1 = Math.min(COLS - 1, c0 + W / T + 1);
      for (let r = 0; r < level.rows; r++) for (let c = c0; c <= c1; c++) {
        const tl = tile(c, r), x = c * T, y = r * T;
        if (tl === "#") {
          ctx.fillStyle = "#3a3f7a"; ctx.fillRect(x, y, T, T);
          ctx.fillStyle = "#6d74b8"; ctx.fillRect(x, y, T, 1); ctx.fillRect(x, y, 1, T);
          ctx.fillStyle = "#1f2048"; ctx.fillRect(x, y + T - 1, T, 1); ctx.fillRect(x + T - 1, y, 1, T);
          ctx.fillStyle = "#9aa1dd"; ctx.fillRect(x + 2, y + 2, 1, 1); ctx.fillRect(x + 5, y + 5, 1, 1);
          if (tile(c, r - 1) !== "#") { ctx.fillStyle = "#F5B53F"; ctx.fillRect(x, y, T, 1); }
        } else if (tl === "=") {
          ctx.fillStyle = "#c46a1c"; ctx.fillRect(x, y, T, 1); ctx.fillRect(x, y + 4, T, 1);
          ctx.fillStyle = "#ff9e3d"; for (let i = 0; i < 4; i++) ctx.fillRect(x + i + (c % 2 ? 0 : 4), y + 1 + (i % 3), 1, 1);
          ctx.fillStyle = "#ffcf8a"; ctx.fillRect(x, y, T, 1);
        } else if (tl === "^") {
          ctx.fillStyle = "#c9cdf0";
          for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) ctx.fillRect(x + i * 4 + j / 2, y + 4 + j, 4 - j, 1);
          ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 1, y + 4, 1, 1); ctx.fillRect(x + 5, y + 4, 1, 1);
        }
      }
      if (f.door) { ctx.fillStyle = "#ff5a5a"; for (let r = 0; r < 13; r++) ctx.fillRect((ARENA - 1) * T + 3, r * T + ((Math.floor(t * 6) + r) % 2) * 4, 2, 4); }

      for (const h of f.health) if (h.on) { ctx.fillStyle = Math.floor(t * 4) % 2 ? PAL.p : PAL.w; ctx.fillRect(h.x, h.y + 1, 4, 2); ctx.fillRect(h.x + 1, h.y, 2, 4); }
      const pose = Math.floor(t * 6) % 2;
      for (const e of f.enemies) if (e.alive) {
        if (e.kind === "hat") e.open > 0 ? sprite(HAT_OPEN, e.x, e.y, false) : sprite(HAT_SHUT, e.x, e.y + 2, false);
        else sprite(e.kind === "wheel" ? WHEEL[pose] : f.halloween ? BAT[pose] : DRONE[pose], e.x, e.y, e.vx > 0);
      }
      if (f.boss) sprite(CREEP, f.boss.x, f.boss.y, false, f.boss.hit ? PAL.w : undefined);
      // READY: you beam down from the top of the screen, then appear.
      if (p.beam !== null) { ctx.fillStyle = PAL.l; ctx.fillRect(Math.round(p.x) + 4, Math.round(p.beam) - 12, 2, 12); ctx.fillStyle = PAL.w; ctx.fillRect(Math.round(p.x) + 4, Math.round(p.beam) - 3, 2, 3); }
      else if (p.visible) {
        const legs = !p.ground ? "jump" : Math.abs(p.vx) > 1 && pose ? "run" : "idle";
        sprite(hero(legs, p.shot > 0 || p.charge > 0.2), p.x - 1, p.y, p.face < 0, p.charge > 0.7 && Math.floor(t * 16) % 2 ? PAL.y : undefined);
      }
      for (const sh of f.shots) {
        if (sh.big) { ctx.fillStyle = PAL.y; ctx.fillRect(Math.round(sh.x), Math.round(sh.y), 6, 6); ctx.fillStyle = PAL.w; ctx.fillRect(Math.round(sh.x) + 1, Math.round(sh.y) + 1, 4, 4); }
        else { ctx.fillStyle = sh.foe ? PAL.r : PAL.y; ctx.fillRect(Math.round(sh.x), Math.round(sh.y), 3, 2); }
      }
      for (const sp of f.sparks) { ctx.globalAlpha = Math.min(1, sp.life * 2); ctx.fillStyle = sp.color; ctx.fillRect(Math.round(sp.x), Math.round(sp.y), 1, 1); }
      ctx.globalAlpha = 1;
      ctx.restore();
    },
    dispose() { },
  };
}
```

- [ ] **Step 2: Create `lib/shipit3d.ts` from the draft and bring it onto the current stage API**

```bash
cp docs/superpowers/plans/2026-10-03-arcade-hd-shipit.draft.ts.txt lib/shipit3d.ts
```

Then make these edits in `lib/shipit3d.ts`:

1. Replace the draft's `ShipItFrame` type with the one in this task's Interfaces block, and add above it:

```ts
export type Level = { tile: (c: number, r: number) => string; rows: number; cols: number; size: number; arena: number };
```

2. Signature and stage call:

```ts
export async function mountShipIt(canvas: HTMLCanvasElement, W: number, H: number, level: Level, onLost?: () => void): Promise<ShipItView> {
  const [st, { RoundedBoxGeometry }] = await Promise.all([stage(canvas, W, H, { shadows: true, env: 0.35, onLost }), import("three/examples/jsm/geometries/RoundedBoxGeometry.js")]);
```

3. Aiming reads the game's shot timer: replace `const aiming = p.shooting || p.charge > 0.2;` with `const aiming = p.shot > 0 || p.charge > 0.2;`.

4. No per-frame `Color` allocation for lamps. Above `return {` add `const lampOff = new THREE.Color(0.08, 0.07, 0.2), lampOn = [new THREE.Color(), new THREE.Color()];` and replace the `lampAt.forEach((_, i) => lamps.setColorAt(...))` line with:

```ts
      lampOn[0].copy(hot(c1, 3)); lampOn[1].copy(hot(c2, 3));
      lampAt.forEach((_, i) => lamps.setColorAt(i, (Math.floor(t * 2) + i) % 3 ? lampOff : lampOn[i % 2]));
```

5. Camera look-ahead and boss squash from Task 2. Add `import { lookAhead, squash } from "./shipitMotion";` at the top, replace `let phase = 0, lastBossVy = 0, squash = 1;` with `let phase = 0, lastBossVy = 0, bossSquash = 1, lead = 0;`, and replace the camera line `camera.position.set(f.cam + W / 2 + sx, -H / 2 + sy, D);` with:

```ts
      lead = lookAhead(lead, f.p.face, f.p.vx, dt, f.door);
      camera.position.set(f.cam + W / 2 + lead + sx, -H / 2 + sy, D);
```

and replace the boss squash block (from `if (f.boss.ground && lastBossVy > 50) squash = 0.7;` through `boss.scale.set(2 - stretch, stretch, 1);`) with:

```ts
        const sq = squash(bossSquash, f.boss.ground && lastBossVy > 50, f.boss.ground, f.boss.vy, dt);
        bossSquash = sq.s;
        lastBossVy = f.boss.ground ? 0 : f.boss.vy;
        boss.scale.set(2 - sq.y, sq.y, 1);
```

6. Render with time: replace `st.render();` with `st.render(dt);`.

- [ ] **Step 3: Wire the component.** In `components/ShipIt.tsx`:

Imports — replace the `crt` and `s` import block's neighbours so the top reads:

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import type { Mode } from "@/lib/arcadePrefs";
import { sfx } from "@/lib/sfx";
import { unlock } from "@/lib/achievements";
import { drawSnow, season } from "@/lib/season";
import type { ShipItView } from "@/lib/shipit3d";
import { PAL, retroShipIt } from "@/lib/retro/shipit";
import crt from "./SpaceGame.module.css";
import s from "./Arcade.module.css";
```

Add `const S = 4; // the 2D layer draws at 4× the grid, so text is sharp` after the `ARENA` constant, and `const LEVEL = { tile, rows: ROWS, cols: COLS, size: T, arena: ARENA };` after the `solidAt` function.

Component head, replacing from `export default function ShipIt(` through `const SEASON = season();`:

```tsx
export default function ShipIt({ mode: want = "hd", onLost, onEnd }: { mode?: Mode; onLost?: () => void; onEnd?: (score: number) => void }) {
  // The final score goes to the arcade's leaderboard. A ref, so the game loop never restarts for it.
  const report = useRef(onEnd);
  report.current = onEnd;
  // Ship It! owns its fallback like the space shooter: no WebGL or a lost GPU swaps to Retro in place (the run
  // goes on), then tells the parent. `shown` is presentation only; the game effect depends on the requested mode.
  const [shown, setShown] = useState(want);
  const lost = useRef(onLost);
  lost.current = onLost;
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLCanvasElement>(null);
  const keys = useRef({ left: false, right: false, jump: false, fire: false });

  useEffect(() => {
    setShown(want);
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.current!.getContext("2d")!;
    ctx.setTransform(S, 0, 0, S, 0, 0);
    const k = keys.current;
    const SEASON = season();
    let view: ShipItView | null = null, gone = false, dropped = false;
    const drop = () => {
      if (gone || dropped) return;
      dropped = true;
      view?.dispose();
      view = retroShipIt(ctx, W, H, LEVEL);
      setShown("retro");
      lost.current?.();
    };
    if (want === "retro") view = retroShipIt(ctx, W, H, LEVEL);
    else import("@/lib/shipit3d")
      .then((m) => (gone ? null : m.mountShipIt(stage.current!, W, H, LEVEL, drop)))
      .then((v) => { if (!v) return; if (gone || dropped) v.dispose(); else view = v; })
      .catch(drop); // no WebGL: drop to Retro
```

Delete the old `const bloom = glow.current!.getContext("2d")!;` line. Add `let impacts: { x: number; y: number; at: number }[] = [];` next to `let enemies...`, and `impacts = [];` inside `reset()`.

Emit impacts (view data only; rules unchanged). Replace the shot wall check

```tsx
        if (solidAt(Math.floor(sh.x / T), Math.floor(sh.y / T), !!boss?.on) || Math.abs(sh.x - p.x) > W) { sh.y = 999; continue; }
```

with

```tsx
        if (solidAt(Math.floor(sh.x / T), Math.floor(sh.y / T), !!boss?.on)) { impacts.push({ x: sh.x, y: sh.y, at: t }); if (impacts.length > 40) impacts.shift(); sh.y = 999; continue; }
        if (Math.abs(sh.x - p.x) > W) { sh.y = 999; continue; }
```

Replace the whole drawing section — from `// Draw: sky, a slow skyline, tiles, pickups, bodies, shots, sparks.` down to and including `if (flash > 0) { ctx.fillStyle = \`rgba(255,255,255,${flash})\`; ctx.fillRect(0, 0, W, H); }` — with:

```tsx
      // Draw: the view (3D on the stage canvas, or Retro on this one), then snow, flash and the HUD on top.
      ctx.clearRect(0, 0, W, H);
      const beaming = state === "ready" && stateT > 0.7;
      view?.draw({
        t, dt, cam, shake: calm ? 0 : shake, halloween: SEASON === "halloween",
        p: {
          x: p.x, y: p.y, vx: p.vx, vy: p.vy, ground: p.ground, face: p.face, shot: p.shot, charge: p.charge, won: state === "won",
          visible: !beaming && !p.dead && (p.inv <= 0 || Math.floor(t * 14) % 2 === 1),
          beam: beaming ? Math.min(p.y + 8, (1.8 - stateT) * 140) : null,
        },
        enemies,
        boss: boss && { x: boss.x, y: boss.y, vy: boss.vy, ground: boss.ground, cool: boss.cool, hit: boss.hp < BOSS_HP / 2 && Math.floor(t * 10) % 2 === 1 },
        door: !!boss?.on, health, shots, sparks, impacts,
      });
      if (SEASON === "christmas") drawSnow(ctx, t, W, H);
      if (flash > 0 && !calm) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(0, 0, W, H); }
```

Delete the `bloom.clearRect(0, 0, W, H);` and `bloom.drawImage(ctx.canvas, 0, 0);` lines. In the cleanup, add as the first two lines:

```tsx
      gone = true;
      view?.dispose();
```

Change the effect's dependency list from `}, []);` to `}, [want]);`.

JSX — replace the CRT block:

```tsx
      <div className={`${crt.crt} ${shown === "hd" ? crt.hd : crt.retro}`}>
        {shown === "hd" && <canvas ref={stage} aria-hidden="true" />}
        <canvas ref={canvas} width={W * S} height={H * S} className={crt.hud} role="img" aria-label="Ship It!, a platformer. Left and right arrows to run, Z or up to jump, X or Space to shoot, hold to charge." />
      </div>
```

and delete `const glow = useRef<HTMLCanvasElement>(null);`.

- [ ] **Step 4: Type-check and test**

Run: `npx tsc --noEmit -p . && npm test`
Expected: no errors; all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/retro/shipit.ts lib/shipit3d.ts components/ShipIt.tsx
git commit -m "Ship It! in 3D: a deep steel fortress, Retro kept, Retro when the GPU drops out

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Browser check (controller, visible Chrome window)**

Open the arcade → Ship It! in HD: blocks have depth and shadows, the robot runs and its legs swing, enemies spin and hover, the camera leads where you run. Switch to Retro: identical to the game before this plan (compare with `git show 884cf20:components/ShipIt.tsx` drawing). In HD mid-level, run in the console:

```js
document.querySelector('[class*="SpaceGame-module"][class*="crt"] canvas[aria-hidden]').getContext("webgl2").getExtension("WEBGL_lose_context").loseContext()
```

Expected: "Switched to Retro" toast; same position, score and lives, now in pixels. Touch a spike at the right edge of the screen: the hit lands when they visibly meet (within about two pixels).

---

### Task 4: The animated robot hero

**Files:**
- Modify: `lib/shipit3d.ts`

**Interfaces:**
- Consumes: `loadModel(url): Promise<{ scene; animations }>` (`lib/assets.ts`; clones share geometry with the cache, so materials are cloned before tinting); `heroClip` (Task 2).
- Produces: no new exports. The procedural `hero` stays as the fallback and is hidden once the robot is ready.

- [ ] **Step 1: Load the robot after the procedural hero is built.** Add `import { loadModel } from "./assets";` and `import { heroClip, type Clip } from "./shipitMotion";` (merge with the Task 3 import). After `scene.add(beam);` add:

```ts
  // The real hero: a rigged CC0 robot with idle, run, jump, punch and thumbs-up clips, painted in the game's
  // blues, an arm cannon on its right hand. If it can't load, the procedural robot above stays.
  let disposed = false;
  type Robot = { root: T.Group; mixer: T.AnimationMixer; actions: Partial<Record<Clip | "Punch", T.AnimationAction>>; current: Clip | "Punch"; muzzle: T.MeshBasicMaterial };
  let robot: Robot | null = null;
  loadModel("/arcade/shipit/robot.glb").then(({ scene: model, animations }) => {
    if (disposed) return;
    model.traverse((o) => {
      const m = o as T.Mesh;
      if (!m.isMesh) return;
      m.castShadow = st.shadows;
      const mat = (m.material as T.MeshStandardMaterial).clone(); // clones share the cached material: never tint it in place
      if (mat.name === "Main") mat.color.set("#2f6bff");
      if (mat.name === "Grey") mat.color.set("#7fe3ff");
      mat.metalness = 0.35; mat.roughness = 0.35;
      m.material = mat;
    });
    const box = new THREE.Box3().setFromObject(model);
    model.scale.setScalar(15 / (box.max.y - box.min.y)); // as tall as the hitbox, a touch over
    const root = new THREE.Group();
    root.add(model);
    const mixer = new THREE.AnimationMixer(model);
    const actions: Robot["actions"] = {};
    for (const c of animations) if (["Idle", "Running", "Jump", "ThumbsUp", "Punch"].includes(c.name)) actions[c.name as Clip | "Punch"] = mixer.clipAction(c);
    actions.Jump?.setLoop(THREE.LoopOnce, 1); if (actions.Jump) actions.Jump.clampWhenFinished = true;
    actions.Idle?.play();
    // The arm cannon rides the right hand bone; its muzzle glows hotter as you charge.
    const muzzle = glowMat(hot("#7fe3ff", 2));
    let hand = null as T.Object3D | null; // assigned inside the traverse callback; the cast stops TS narrowing it to null
    model.traverse((o) => { if ((o as T.Bone).isBone && o.name === "Hand.R") hand = o; });
    if (hand) {
      const gun = new THREE.Group();
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 1.3, 16), gloss("#2f6bff"));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.1, 8, 16), muzzle);
      ring.position.y = 0.7; ring.rotation.x = Math.PI / 2;
      gun.add(barrel, ring);
      gun.scale.setScalar(1 / model.scale.x); // undo the model's scale so the cannon keeps its size in world units
      gun.position.y = 0.5 / model.scale.x;
      (hand as T.Object3D).add(gun);
    }
    scene.add(shadowed(root));
    hero.visible = false;
    robot = { root, mixer, actions, current: "Idle", muzzle };
  }).catch(() => { }); // keep the procedural robot
```

- [ ] **Step 2: Drive it each frame.** In `draw`, right after the procedural hero is posed (after the `heroLight.position.set(...)` line), add:

```ts
      if (robot) {
        hero.visible = false;
        robot.root.visible = p.visible;
        robot.root.position.set(X(p.x + 5), Y(p.y + 14), Z);
        robot.root.rotation.y = p.face * (Math.PI / 2 - 0.6);
        // Shooting while standing holds the punch's extended arm; running or jumping keeps the run or jump.
        const base = heroClip({ won: p.won, ground: p.ground, vx: p.vx });
        const want: Clip | "Punch" = aiming && base === "Idle" && robot.actions.Punch ? "Punch" : base;
        if (want !== robot.current && robot.actions[want]) {
          const next = robot.actions[want]!, prev = robot.actions[robot.current];
          next.reset().play();
          if (want === "Punch") { next.time = 0.28; next.timeScale = 0; } else next.timeScale = 1;
          if (prev) prev.crossFadeTo(next, 0.15, false);
          robot.current = want;
        }
        robot.mixer.update(robot.current === "Running" ? dt * Math.min(1.6, Math.abs(p.vx) / 45) : dt);
        robot.muzzle.color.copy(charged && Math.floor(t * 16) % 2 ? hot("#fff1a8", 4) : hot("#7fe3ff", 1 + Math.min(p.charge, 0.7) * 3));
      }
```

- [ ] **Step 3: Stop loading after dispose.** Replace `dispose: () => st.dispose(...textures),` with:

```ts
    dispose: () => { disposed = true; st.dispose(...textures); },
```

- [ ] **Step 4: Type-check and test**

Run: `npx tsc --noEmit -p . && npm test`
Expected: no errors; all pass.

- [ ] **Step 5: Commit**

```bash
git add lib/shipit3d.ts
git commit -m "Ship It!'s hero is a rigged robot: runs, jumps, aims its arm cannon, thumbs up on a win

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Browser check (controller)**: the robot idles, runs at a pace matching its speed, jumps, holds its arm out to shoot while standing, the muzzle brightens while charging, thumbs up after beating Scope Creep. Then `mv public/arcade/shipit/robot.glb /tmp/` and reload: the procedural robot plays instead, no console error beyond the 404; `mv /tmp/robot.glb public/arcade/shipit/`.

---

### Task 5: PBR steel blocks

**Files:**
- Modify: `lib/shipit3d.ts`

- [ ] **Step 1: Keep a handle on the block material.** Replace

```ts
  instanced(new THREE.BoxGeometry(TS, TS, DEPTH), new THREE.MeshStandardMaterial({ map: steel, metalness: 0.7, roughness: 0.55 }), blocks.map(([c, r]) => [c * TS + TS / 2, -(r * TS + TS / 2), -DEPTH / 2]));
```

with

```ts
  const blockMat = new THREE.MeshStandardMaterial({ map: steel, metalness: 0.7, roughness: 0.55 });
  instanced(new THREE.BoxGeometry(TS, TS, DEPTH), blockMat, blocks.map(([c, r]) => [c * TS + TS / 2, -(r * TS + TS / 2), -DEPTH / 2]));
  // Worn steel plates (Poly Haven, CC0): colour, normal and roughness maps, tinted to the site's indigo.
  // Until they load, or if they don't, the painted steel above stays.
  const tl = new THREE.TextureLoader();
  Promise.all(["diff", "nor", "rough"].map((m) => tl.loadAsync(`/arcade/shipit/metal-plate-${m}.jpg`))).then(([diff, nor, rough]) => {
    if (disposed) { [diff, nor, rough].forEach((x) => x.dispose()); return; }
    diff.colorSpace = THREE.SRGBColorSpace;
    for (const x of [diff, nor, rough]) { x.anisotropy = 4; textures.push(x); }
    Object.assign(blockMat, { map: diff, normalMap: nor, roughnessMap: rough, color: new THREE.Color(0x9aa0d8), metalness: 0.8, roughness: 1 });
    blockMat.normalScale.set(1.2, 1.2);
    blockMat.needsUpdate = true;
  }).catch(() => { });
```

Move the `let disposed = false;` line added in Task 4 up to just after `const X = (x: number) => x, Y = (y: number) => -y;` so it is declared before this block.

- [ ] **Step 2: Type-check, test, commit**

Run: `npx tsc --noEmit -p . && npm test` → pass.

```bash
git add lib/shipit3d.ts
git commit -m "Ship It! blocks in worn steel plate: colour, normal and roughness maps

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 3: Browser check (controller)**: block faces show plate seams and wear; highlights move as the camera scrolls; Halloween still orange/purple lamps.

---

### Task 6: Atmosphere — light shafts, steam, beacons

**Files:**
- Modify: `lib/shipit3d.ts`

- [ ] **Step 1: Add the three systems after the door is built** (after `scene.add(door);`):

```ts
  // Light shafts from high windows: open cones, additive, fading toward the floor, breathing slowly.
  const shaftMat = new THREE.ShaderMaterial({
    uniforms: { t: { value: 0 }, c: { value: hot("#9fb4ff", 0.5) } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `varying vec2 vUv; uniform float t; uniform vec3 c;
      void main() { float fall = smoothstep(0.0, 1.0, vUv.y); float edge = sin(vUv.x * 3.14159); float flick = 0.75 + 0.25 * sin(t * 0.7 + vUv.x * 9.0);
        gl_FragColor = vec4(c * fall * edge * flick * 0.35, 1.0); }`,
  });
  for (let x = 40; x < span; x += 96) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(16, 150, 24, 1, true), shaftMat);
    cone.position.set(x, -40, -30);
    cone.rotation.z = 0.25;
    scene.add(cone);
  }

  // Steam vents at the back of the floor: soft grey puffs that rise, swell and fade.
  const VENTS: number[] = [];
  for (let x = 72; x < span; x += 120) VENTS.push(x);
  const PUFFS = 18, steamCount = VENTS.length * PUFFS;
  const steamGeo = new THREE.BufferGeometry();
  const steamPos = new Float32Array(steamCount * 3), steamA = new Float32Array(steamCount), steamS = new Float32Array(steamCount);
  steamGeo.setAttribute("position", new THREE.BufferAttribute(steamPos, 3));
  steamGeo.setAttribute("alpha", new THREE.BufferAttribute(steamA, 1));
  steamGeo.setAttribute("size", new THREE.BufferAttribute(steamS, 1));
  const steam = new THREE.Points(steamGeo, new THREE.ShaderMaterial({
    uniforms: { map: { value: st.dot }, scale: { value: 1 } }, // half the drawing-buffer height, set each frame
    transparent: true, depthWrite: false,
    vertexShader: `attribute float alpha; attribute float size; varying float vA; uniform float scale;
      void main() { vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: "uniform sampler2D map; varying float vA; void main() { gl_FragColor = vec4(vec3(0.62, 0.62, 0.72), texture2D(map, gl_PointCoord).a * vA * 0.35); }",
  }));
  steam.frustumCulled = false;
  scene.add(steam);

  // Rotating amber beacons on the floor's back edge; the three nearest the camera really light the scene.
  const beaconAt: number[] = [];
  for (let x = 24; x < span; x += 64) beaconAt.push(x);
  const beaconMat = glowMat(hot("#F5B53F", 3));
  const beacons = beaconAt.map((x) => { const b = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 8), beaconMat); b.position.set(x, -(13 * TS) + 1.1, -DEPTH + 1.5); scene.add(b); return b; });
  const beaconLights = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xffb347, 0, 46, 0); scene.add(l); return l; });
```

- [ ] **Step 2: Animate them in `draw`**, after the lamp colours are set:

```ts
      shaftMat.uniforms.t.value = t;
      (steam.material as T.ShaderMaterial).uniforms.scale.value = st.renderer.domElement.height / 2; // tracks pixel ratio and resizes
      VENTS.forEach((vx, v) => {
        for (let k = 0; k < PUFFS; k++) {
          const i = v * PUFFS + k, life = ((t * 0.35 + k / PUFFS + v * 0.37) % 1);
          steamPos[i * 3] = vx + Math.sin(life * 6 + k) * 3; steamPos[i * 3 + 1] = -(13 * TS) + life * 46; steamPos[i * 3 + 2] = -DEPTH + 2;
          steamA[i] = Math.sin(life * Math.PI); steamS[i] = 4 + life * 12;
        }
      });
      steamGeo.attributes.position.needsUpdate = steamGeo.attributes.alpha.needsUpdate = steamGeo.attributes.size.needsUpdate = true;
      const centre = f.cam + W / 2;
      const near = beaconAt.map((x, i) => [Math.abs(x - centre), i]).sort((a, b) => a[0] - b[0]).slice(0, 3);
      beaconLights.forEach((l, k) => {
        const i = near[k]?.[1];
        if (i === undefined) { l.intensity = 0; return; }
        const spin = Math.max(0, Math.sin(t * 5 + i));
        l.position.set(beaconAt[i] + Math.cos(t * 5 + i) * 6, -(13 * TS) + 3, -DEPTH + 6);
        l.intensity = 0.6 + spin * 2.4;
      });
```

- [ ] **Step 3: Type-check, test, commit**

Run: `npx tsc --noEmit -p . && npm test` → pass.

```bash
git add lib/shipit3d.ts
git commit -m "Ship It! atmosphere: light shafts, rising steam, amber beacons that light the floor

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Browser check (controller)**: shafts visible but subtle over the wall; steam rises and fades at vents; beacon light sweeps across nearby blocks and the robot; `?perf` stays ≥ 55 fps on high; `?tier=low` ≥ 30 fps.

---

### Task 7: Impacts, dust, telegraph, beam-in

**Files:**
- Modify: `lib/shipit3d.ts`

- [ ] **Step 1: Build the effect pools** after the beacons:

```ts
  // Scorch marks where shots hit walls: dark soft discs on the block faces, fading over 8 seconds.
  const scorchCanvas = document.createElement("canvas");
  scorchCanvas.width = scorchCanvas.height = 64;
  const sg = scorchCanvas.getContext("2d")!, sr = sg.createRadialGradient(32, 32, 2, 32, 32, 30);
  sr.addColorStop(0, "rgba(10,8,20,0.9)"); sr.addColorStop(0.5, "rgba(20,14,30,0.5)"); sr.addColorStop(1, "rgba(0,0,0,0)");
  sg.fillStyle = sr; sg.fillRect(0, 0, 64, 64);
  const scorchTex = new THREE.CanvasTexture(scorchCanvas);
  textures.push(scorchTex);
  const scorches = Array.from({ length: 40 }, () => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ map: scorchTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.visible = false; scene.add(m); return m;
  });
  // Wall-hit sparks of our own (the game's sparks don't know about walls).
  const hitSparks = st.sparks(160, 1.6);
  let wallSparks: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
  const seenImpacts = new WeakSet<object>(); // two hits in one frame share a timestamp, so track them by identity

  // Dust rings: a flat ring that races outward along the floor when something heavy lands.
  const rings = Array.from({ length: 4 }, () => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.35, 8, 40), new THREE.MeshBasicMaterial({ color: 0xb8b0c8, transparent: true, opacity: 0, depthWrite: false }));
    m.rotation.x = Math.PI / 2; m.visible = false; scene.add(m);
    return { m, age: 99 };
  });
  const dust = (x: number, y: number, size: number) => {
    const r = rings.reduce((a, b) => (a.age > b.age ? a : b));
    r.age = 0; r.m.position.set(x, y, -DEPTH / 2); r.m.userData.size = size; r.m.visible = true;
  };
  let heroWasGround = true, heroVy = 0;

  // The beam-in: a column of light with scanning rings, replacing the plain cylinder.
  const beamMat = new THREE.ShaderMaterial({
    uniforms: { t: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `varying vec2 vUv; uniform float t;
      void main() { float bands = 0.55 + 0.45 * step(0.5, fract(vUv.y * 14.0 - t * 6.0)); float core = pow(sin(vUv.x * 3.14159), 3.0);
        gl_FragColor = vec4(vec3(0.5, 0.9, 1.0) * 2.4 * bands * core, 1.0); }`,
  });
  beam.material = beamMat;
  beam.geometry.dispose();
  beam.geometry = new THREE.CylinderGeometry(2.4, 2.4, 1, 24, 1, true);
```

- [ ] **Step 2: Drive them in `draw`** (before `st.render(dt);`):

```ts
      // New wall impacts: a scorch mark and a spray of sparks. `impacts` holds the last 40, oldest first.
      for (const im of f.impacts) if (!seenImpacts.has(im)) {
        seenImpacts.add(im);
        const s = scorches.reduce((a, b) => ((a.userData.at ?? -1) < (b.userData.at ?? -1) ? a : b));
        s.position.set(X(im.x), Y(im.y), 0.05); s.userData.at = t; s.visible = true; s.rotation.z = Math.random() * Math.PI;
        for (let i = 0; i < 7; i++) { const a = Math.PI / 2 + (Math.random() - 0.5) * 2.4; wallSparks.push({ x: X(im.x), y: Y(im.y), vx: Math.cos(a) * 40 * Math.sign(-(f.p.face || 1)), vy: Math.sin(a) * 40, life: 0.35 + Math.random() * 0.25 }); }
      }
      for (const s of scorches) if (s.visible) { const age = t - s.userData.at; (s.material as T.MeshBasicMaterial).opacity = Math.max(0, 1 - age / 8); if (age > 8) s.visible = false; }
      wallSparks = wallSparks.filter((s) => ((s.x += s.vx * dt), (s.y += s.vy * dt), (s.vy -= 90 * dt), (s.life -= dt) > 0));
      const hs = Math.min(wallSparks.length, hitSparks.max);
      for (let i = 0; i < hs; i++) hitSparks.set(i, wallSparks[i].x, wallSparks[i].y, 1, "#fff1a8", wallSparks[i].life * 4);
      hitSparks.commit(hs);

      // Dust when the hero lands from a real fall, and when Scope Creep lands.
      if (p.ground && !heroWasGround && heroVy > 140 && p.visible) dust(X(p.x + 5), Y(p.y + 14), 9);
      heroWasGround = p.ground; heroVy = p.ground ? 0 : p.vy;
      for (const r of rings) {
        if (!r.m.visible) continue;
        r.age += dt;
        const k = Math.min(1, r.age / 0.6);
        r.m.scale.setScalar(1 + k * r.m.userData.size);
        (r.m.material as T.MeshBasicMaterial).opacity = (1 - k) * 0.6;
        if (k >= 1) r.m.visible = false;
      }

      // Scope Creep telegraphs a leap: a crouch and a red glow in the half second before it jumps.
      if (f.boss && f.boss.ground && f.boss.cool < 0.45) { bossArmor.emissive.set("#ff3b3b"); bossArmor.emissiveIntensity = 0.25 + Math.sin(t * 30) * 0.15; boss.scale.y *= 0.9; }
      else if (f.boss && !f.boss.hit) bossArmor.emissive.set(0xffffff);

      beamMat.uniforms.t.value = t;
```

Ordering: put this whole block after the boss block (the telegraph scales the boss after the boss block sets its squash), keeping `st.render(dt)` last. Separately, add the boss's landing dust as the **first line inside** the boss block's `if (f.boss) {`, before `squash(...)` updates `lastBossVy`:

```ts
        if (f.boss.ground && lastBossVy > 50) dust(X(f.boss.x + 8), Y(f.boss.y + 13), 24);
```

Since `dust` and `rings` are declared in Step 1, which comes after the boss model is built in the file, that's fine: `draw` runs later.

- [ ] **Step 3: Type-check, test, commit**

Run: `npx tsc --noEmit -p . && npm test` → pass.

```bash
git add lib/shipit3d.ts
git commit -m "Ship It! impacts and drama: scorch marks, wall sparks, dust rings, a boss that telegraphs, a scanning beam-in

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Browser check (controller)**: shooting a wall leaves a fading scorch and a spark spray; falling from a girder puffs a ring; Scope Creep glows red and dips before each leap, slams down with a wide ring; the beam-in shows moving bands. Reduced motion: no camera shake, rings still fine (they are not motion of the view).

---

### Task 8: Verification pass (controller)

- [ ] **Step 1**: `npm run assets:check` → exit 0. `npx tsc --noEmit -p . && npm test && npm run build` → all pass.
- [ ] **Step 2**: `?perf` on the high tier in the boss room: ≥ 55 fps; note calls and triangles in the ledger. `?tier=low`: ≥ 30 fps, no shadows.
- [ ] **Step 3**: Seasons: `?season=halloween` (orange/purple lamps, bat sprites in Retro), `?season=christmas` (snow on the HUD layer).
- [ ] **Step 4**: Close and reopen the arcade 10 times into Ship It!: no "Too many active WebGL contexts" warning, no false toast.
