# Arcade HD, Plan 4: Sprint Fighter in 3D — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sprint Fighter becomes a lit 3D rooftop fight at sunset: jointed 3D fighters driven by the game's own poses (smoothly blended), a glossy reflective roof, a city skyline with lit windows, a cheering crowd, energy-ball specials with trails and a flare, landing dust, and a camera that frames the fight, punches in on hits and circles the knockout. Pixel version kept as Retro. Same game underneath.

**Architecture:** Same pattern as Plans 1 and 3. `components/SprintFighter.tsx` keeps all logic and builds a `FighterFrame` per tick. Two views draw it: `lib/fighter3d.ts` (HD) and `lib/retro/fighter.ts` (the original pixel drawing, moved verbatim). The HUD (health bars, clock, callouts, meters) stays 2D on a 4× canvas. The pose data (`POSES`, `Look`, `PO`, `SH`) moves to a pure module `lib/fighterMotion.ts` shared by both views. Fighters stand in the plane z = 0; 1 grid unit = 1 world unit; world `x = gridX`, `y = −gridY`; the floor is at `y = −GROUND`.

**Tech Stack:** Next 16, React 19, TypeScript 7, three 0.186, Node 26 test runner over `*.check.ts`.

**Spec:** `docs/superpowers/plans/2026-10-03-arcade-hd.md` → Vision → "Sprint Fighter (Plan 4)" and "Everywhere", plus its Global Constraints. Mixamo characters (Adelina's account) are a follow-up plan ("4b"), written when the files arrive; this plan's procedural fighters are both the first HD version and the permanent fallback.

## Global Constraints

- Everything in the parent plan's Global Constraints applies (rules/hitboxes/timings unchanged; views read state only; FOV 30, `D = H/2 / tan(15°)` at zoom 1; no new runtime dependencies; reduced motion: no shake, flash, camera orbit or sweep; Retro on missing WebGL 2 or lost context with the match continuing; seasons keep working; commits end with a Co-Authored-By trailer).
- Sprint Fighter grid: `W = 192`, `H = 120`, `GROUND = 104`, `ROUND_TIME = 45`. Pose angles are "from straight down, + is forward" (as in `POSES`), segment lengths match Retro: thigh 7, shin 7, upper arm 6, forearm 6, hip at 13 − drop, shoulders 8 up the torso, neck 10 up.
- Camera zoom never hides a fighter: visible width `W / zoom ≥ distance + 60`, zoom ∈ [1, 1.25].
- Retro must look exactly like the game today.

## Review Focus

1. **Pose fidelity**: an HD fighter's limbs point where the Retro fighter's do for every pose (idle, walk, punch, low punch, kick, air kick, crouch, jump, special, hit, block, win, KO flat). Pinned in Task 1 (angle → direction tests) and Task 3's browser check (switch HD/Retro mid-move).
2. **Facing**: both fighters face each other, swap sides correctly when jumping over, and the near-side limbs stay near the camera. Pinned in Task 3 (`scale.x = face` mirroring) and its browser check.
3. **Hit-stop and KO**: the 60 ms freeze on hits freezes the 3D poses too; KO lays the loser flat with the head away from the hit. Pinned in Task 3 (pose blending uses `pause`) and Task 4's browser check.
4. **Camera never loses a fighter** at max distance, on jumps, or during the KO orbit. Pinned in Task 1 (`framing` tests) and Task 4.
5. **GPU lost mid-round**: Retro takes over with the same health, clock, round and wins. Pinned in Task 2 and its browser check.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `lib/fighterMotion.ts` (create) | Pure: `POSES`, `Pose`, `Look`, `PO`, `SH`, `poseName`, `lerpPose`, `limbDir`, `framing` |
| `lib/fighterMotion.check.ts` (create) | Node tests |
| `lib/retro/fighter.ts` (create) | The original pixel drawing, as a view |
| `lib/fighter3d.ts` (create) | HD view: arena, fighters, balls, sparks, camera |
| `components/SprintFighter.tsx` (modify) | Builds frames; HD/Retro with in-place fallback; HUD on the 4× canvas |

---

### Task 1: Pose and camera helpers (pure)

**Files:**
- Create: `lib/fighterMotion.ts`
- Test: `lib/fighterMotion.check.ts`

**Interfaces:**
- Produces: `type Pose`, `POSES: Record<string, Pose>` (moved verbatim from `components/SprintFighter.tsx`), `type Look`, `PO`, `SH` (moved verbatim), `poseName(f: { act: string; low: boolean; y: number }, t: number): string`, `lerpPose(a: Pose, b: Pose, k: number): Pose`, `limbDir(angle: number, face: number): [number, number]` (world x, y-up), `framing(ax: number, bx: number, W: number, H: number): { x: number; y: number; zoom: number }`.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/fighterMotion.check.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { POSES, poseName, lerpPose, limbDir, framing } from "./fighterMotion.ts";

const near = (a: number, b: number, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} vs ${b}`);

test("poseName matches the Retro choice", () => {
  assert.equal(poseName({ act: "walk", low: false, y: 0 }, 0.2), "walk1");
  assert.equal(poseName({ act: "walk", low: false, y: 0 }, 0.0), "walk2");
  assert.equal(poseName({ act: "idle", low: false, y: 0 }, 0.5), "idle");
  assert.equal(poseName({ act: "idle", low: false, y: 0 }, 0.0), "idle2");
  assert.equal(poseName({ act: "punch", low: true, y: 0 }, 0), "lowpunch");
  assert.equal(poseName({ act: "kick", low: false, y: -10 }, 0), "airkick");
  assert.equal(poseName({ act: "kick", low: false, y: 0 }, 0), "kick");
  assert.equal(poseName({ act: "ko", low: false, y: -5 }, 0), "hit");
  assert.equal(poseName({ act: "block", low: false, y: 0 }, 0), "block");
});
test("every name poseName can return has a pose", () => {
  for (const act of ["idle", "walk", "crouch", "jump", "punch", "kick", "special", "hit", "block", "ko", "win"])
    for (const low of [false, true]) for (const y of [0, -8]) for (const t of [0, 0.2, 0.5])
      assert.ok(POSES[poseName({ act, low, y }, t)], `${act} ${low} ${y} ${t}`);
});
test("lerpPose: 0 is a, 1 is b, halfway is the midpoint", () => {
  const a = POSES.idle, b = POSES.punch;
  assert.deepEqual(lerpPose(a, b, 0), a);
  assert.deepEqual(lerpPose(a, b, 1), b);
  near(lerpPose(a, b, 0.5)[0], (a[0] + b[0]) / 2);
  near(lerpPose(a, b, 0.5)[1][1], (a[1][1] + b[1][1]) / 2);
});
test("limbDir: straight down, forward for each facing, Retro's y-down flipped to y-up", () => {
  const [dx, dy] = limbDir(0, 1); near(dx, 0); near(dy, -1);
  const [fx, fy] = limbDir(Math.PI / 2, 1); near(fx, 1); near(fy, 0, 1e-12);
  const [bx] = limbDir(Math.PI / 2, -1); near(bx, -1);
});
test("framing keeps both fighters in view with a margin", () => {
  for (const [a, b] of [[10, 182], [56, 136], [90, 102], [10, 30], [170, 182]]) {
    const { x, zoom } = framing(a, b, 192, 120);
    assert.ok(zoom >= 1 && zoom <= 1.25, `zoom ${zoom}`);
    const half = 192 / zoom / 2;
    assert.ok(Math.min(a, b) >= x - half && Math.max(a, b) <= x + half, `${a},${b} in [${x - half}, ${x + half}]`);
    assert.ok(x - half >= -1e-9 && x + half <= 192 + 1e-9, "never shows past the arena");
  }
});
test("framing keeps the floor at the bottom of the screen", () => {
  const { y, zoom } = framing(90, 102, 192, 120);
  near(y - 120 / zoom / 2, -120); // bottom edge of the view sits on grid row 120
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npm test`
Expected: FAIL, `Cannot find module '.../lib/fighterMotion.ts'`.

- [ ] **Step 3: Implement.** Move `Look`, `PO`, `SH`, `Pose` and `POSES` verbatim from `components/SprintFighter.tsx` into this file (export each), then add:

```ts
// Sprint Fighter's poses and the HD camera, kept pure so both views (and tests) share them.
// ...moved Look, PO, SH, Pose, POSES here (exported)...

// Which pose a fighter shows: the same choice the pixel version has always made.
export function poseName(f: { act: string; low: boolean; y: number }, t: number) {
  if (f.act === "walk") return Math.floor(t * 6) % 2 ? "walk1" : "walk2";
  if (f.act === "idle") return Math.floor(t * 2.5) % 2 ? "idle" : "idle2";
  if (f.act === "punch" && f.low) return "lowpunch";
  if (f.act === "kick" && f.y < 0) return "airkick";
  if (f.act === "ko") return "hit";
  return POSES[f.act] ? f.act : "idle";
}

const mix = (a: number, b: number, k: number) => (k >= 1 ? b : k <= 0 ? a : a + (b - a) * k); // exact at the ends
export function lerpPose(a: Pose, b: Pose, k: number): Pose {
  return [mix(a[0], b[0], k), [mix(a[1][0], b[1][0], k), mix(a[1][1], b[1][1], k)], [mix(a[2][0], b[2][0], k), mix(a[2][1], b[2][1], k)],
    [mix(a[3][0], b[3][0], k), mix(a[3][1], b[3][1], k)], [mix(a[4][0], b[4][0], k), mix(a[4][1], b[4][1], k)], mix(a[5], b[5], k)];
}

// A limb at `angle` (from straight down, + forward) for a fighter facing `face`, as a y-up world direction.
export const limbDir = (angle: number, face: number): [number, number] => [Math.sin(angle) * face, -Math.cos(angle)];

// The HD camera: centred on the fight, zoomed in when the fighters are close, never past the arena's edges,
// floor kept at the bottom of the screen. y is the world y of the view centre (y-up, floor at −GROUND).
export function framing(ax: number, bx: number, W: number, H: number) {
  const dist = Math.abs(ax - bx);
  const zoom = Math.max(1, Math.min(1.25, W / (dist + 60)));
  const half = W / zoom / 2;
  const x = Math.max(half, Math.min(W - half, (ax + bx) / 2));
  return { x, y: -H + H / zoom / 2, zoom };
}
```

In `components/SprintFighter.tsx`, delete the moved declarations and import them: `import { POSES, PO, SH, type Look } from "@/lib/fighterMotion";` (keep `MOVES` in the component; it is game logic).

- [ ] **Step 4: Run the tests and type-check**

Run: `npm test && npx tsc --noEmit -p .`
Expected: PASS (all tests, including 6 new); no type errors.

- [ ] **Step 5: Commit**

```bash
git add lib/fighterMotion.ts lib/fighterMotion.check.ts components/SprintFighter.tsx
git commit -m "Sprint Fighter's poses move to a shared module, with blending and a fight camera

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Retro view and HD/Retro wiring

**Files:**
- Create: `lib/retro/fighter.ts`
- Modify: `components/SprintFighter.tsx`

**Interfaces:**
- Consumes: Task 1 exports; `Mode` (`lib/arcadePrefs.ts`); `season()` (`lib/season.ts`).
- Produces (exported from `lib/retro/fighter.ts` for now; Task 3 re-exports the types from `lib/fighter3d.ts`):

```ts
export type FighterFrame = {
  t: number; dt: number; shake: number; pause: number; halloween: boolean; christmas: boolean;
  state: "intro" | "fight" | "ko" | "end"; stateT: number;
  fighters: { x: number; y: number; face: number; act: string; actT: number; low: boolean; look: Look }[]; // [me, cpu]
  balls: { x: number; y: number; vx: number; mine: boolean; big: boolean }[];
  sparks: { x: number; y: number; life: number; color: string }[];
};
export type FighterView = { draw(f: FighterFrame): void; dispose(): void };
export function retroFighter(ctx: CanvasRenderingContext2D, W: number, H: number, GROUND: number): FighterView;
```

- [ ] **Step 1: Create `lib/retro/fighter.ts`** by moving, verbatim, from `components/SprintFighter.tsx`: the `crowd` array construction, `limb`, `draw` (the fighter drawer), and the drawing section from `// Draw: a rooftop at sunset...` through the sparks loop and `ctx.restore();`. Adapt only references: `t` → `f.t`; `SEASON === "halloween"` → `f.halloween`; `SEASON === "christmas"` → `f.christmas`; `state === "ko"` → `f.state === "ko"`; `shake` → `f.shake`; the fighters loop `for (const f of [cpu, me]) draw(f)` → `for (const g of [f.fighters[1], f.fighters[0]]) draw(g)` (rename the inner drawer's parameter to `g` and its `t` uses to `f.t` via closure); balls: `b.owner === me` → `b.mine`; balls' `y` is `GROUND - 19` exactly as before. `L === SH` / `L === PO` identity checks keep working because `look` carries the same `PO`/`SH` objects. Wrap it:

```ts
// Sprint Fighter as it was: a pixel rooftop at sunset, the crowd, two fighters made of thick pixel limbs.
// Retro mode, and the fallback when WebGL isn't there or the GPU takes it back.
import { POSES, PO, SH, poseName, type Look } from "../fighterMotion";

// FighterFrame / FighterView types from this task's Interfaces block go here.

export function retroFighter(ctx: CanvasRenderingContext2D, W: number, H: number, GROUND: number): FighterView {
  const crowd = Array.from({ length: 34 }, (_, i) => ({ x: i * 6 - 4, h: 5 + ((i * 7) % 4), c: ["#2a1f4f", "#33255e", "#241a45"][i % 3], ph: i * 0.7 }));
  // ...moved `limb` and `draw` here; in `draw`, replace the pose-name expression with `poseName(g, f.t)`...
  return {
    draw(f) {
      // ...moved drawing section here...
    },
    dispose() { },
  };
}
```

(`poseName` returns exactly what the inlined expression returned; Task 1's tests pin it.)

- [ ] **Step 2: Wire the component** — follow `components/ShipIt.tsx` exactly (same `want`/`shown`/`lost`/`drop`/`dropped`/`gone`, Strict-Mode guard, `[want]` dependency, cleanup). Specifically:

Imports: add `useState`, `import type { Mode } from "@/lib/arcadePrefs";`, `import { retroFighter, type FighterView } from "@/lib/retro/fighter";`. Add `const S = 4;` after the constants.

Signature: `export default function SprintFighter({ mode: want = "hd", onLost, onEnd }: { mode?: Mode; onLost?: () => void; onEnd?: (score: number) => void })`, with `const [shown, setShown] = useState(want); const lost = useRef(onLost); lost.current = onLost; const stage = useRef<HTMLCanvasElement>(null);` and remove `glow`.

At the top of the effect, replacing `const ctx = ...; const SEASON = season(); const bloom = ...; const crowd = ...;`:

```tsx
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
```

Delete `limb` and `draw` from the component (moved). Replace the drawing section (from `// Draw: a rooftop at sunset` through `if (flash > 0) {...}`) with:

```tsx
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
```

Note `dt` here is the frame's `dt` after hit-stop (0 during `pause`), which is what the view should see. Delete `bloom.clearRect(...)` and `bloom.drawImage(...)`. Cleanup: first lines `gone = true; view?.dispose();`. Dependencies `}, [want]);`.

JSX:

```tsx
      <div className={`${crt.crt} ${shown === "hd" ? crt.hd : crt.retro}`}>
        {shown === "hd" && <canvas ref={stage} aria-hidden="true" />}
        <canvas ref={canvas} width={W * S} height={H * S} className={crt.hud} role="img" aria-label="Sprint Fighter, a one-on-one fighting game. Arrows to move, jump and crouch, hold back to block. Z punch, X kick, C special." />
      </div>
```

Until Task 3 lands, `@/lib/fighter3d` doesn't exist: create a stub so the import type-checks and HD falls back to Retro cleanly:

```ts
// lib/fighter3d.ts — replaced in Task 3.
export type { FighterFrame, FighterView } from "./retro/fighter";
export async function mountFighter(..._args: unknown[]): Promise<import("./retro/fighter").FighterView> { throw new Error("HD fighter not built yet"); }
```

- [ ] **Step 3: Type-check and test**

Run: `npx tsc --noEmit -p . && npm test`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add lib/retro/fighter.ts lib/fighter3d.ts components/SprintFighter.tsx
git commit -m "Sprint Fighter: pixel drawing moves to a Retro view; HD/Retro wiring with in-place fallback

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Browser check (controller)**: in HD the game shows Retro (stub) with the "Switched to Retro" toast — expected until Task 3; Retro looks identical to the original; HUD, callouts, KO and rematch work.

---

### Task 3: The HD view — arena, fighters, balls, camera

**Files:**
- Replace: `lib/fighter3d.ts`
- Modify: `lib/retro/fighter.ts` (move the two types out)

**Interfaces:**
- Consumes: `stage(canvas, W, H, { shadows, env, onLost })`, `st.render(dt)`, `st.calm`, `st.sparks`, `st.hot`, `st.glowMat` (`lib/arcade3d.ts`); Task 1 exports.
- Produces: `FighterFrame`, `FighterView` (moved here; `lib/retro/fighter.ts` imports them back), `mountFighter(canvas, W, H, GROUND, onLost?): Promise<FighterView>`.

- [ ] **Step 1: Move the types.** Cut `FighterFrame` and `FighterView` from `lib/retro/fighter.ts` into the new `lib/fighter3d.ts`; in `lib/retro/fighter.ts` add `import type { FighterFrame, FighterView } from "../fighter3d";`.

- [ ] **Step 2: Write `lib/fighter3d.ts`:**

```ts
// Sprint Fighter's 3D view: a glossy rooftop at sunset over a lit city, a cheering crowd, two jointed fighters
// posed from the game's own pose angles (blended smoothly), energy balls, and a camera that frames the fight.
// The game still plays on its 192 × 120 grid (components/SprintFighter); this only draws it.
import type * as T from "three";
import { stage } from "./arcade3d";
import { POSES, PO, SH, poseName, lerpPose, framing, type Look, type Pose } from "./fighterMotion";

export type FighterFrame = {
  t: number; dt: number; shake: number; pause: number; halloween: boolean; christmas: boolean;
  state: "intro" | "fight" | "ko" | "end"; stateT: number;
  fighters: { x: number; y: number; face: number; act: string; actT: number; low: boolean; look: Look }[];
  balls: { x: number; y: number; vx: number; mine: boolean; big: boolean }[];
  sparks: { x: number; y: number; life: number; color: string }[];
};
export type FighterView = { draw(f: FighterFrame): void; dispose(): void };

export async function mountFighter(canvas: HTMLCanvasElement, W: number, H: number, GROUND: number, onLost?: () => void): Promise<FighterView> {
  const st = await stage(canvas, W, H, { shadows: true, env: 0.5, onLost });
  const { THREE, scene, camera, D, hot, glowMat } = st;
  const X = (x: number) => x, Y = (y: number) => -y;
  const textures: T.Texture[] = [];
  const paint = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
    const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; textures.push(tex); return tex;
  };

  // Light: a low sun behind the city rims the fighters; a soft key from the front keeps them readable.
  scene.add(new THREE.HemisphereLight(0xc8b0ff, 0x2a1640, 0.9));
  const sunLight = new THREE.DirectionalLight(0xffa860, 2.4); sunLight.position.set(W / 2 + 30, -60, -300);
  const key = new THREE.DirectionalLight(0xfff0e0, 1.7);
  key.position.set(W / 2 - 70, 40, 170); key.target.position.set(W / 2, -GROUND, 0);
  key.castShadow = st.shadows; key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -130, right: 130, top: 90, bottom: -90, near: 1, far: 500 });
  key.shadow.bias = -0.001;
  scene.add(sunLight, key, key.target);

  // The sky: a gradient dome on a far plane, sunset (or Halloween night), with the sun (or moon) on it.
  const skyMat = new THREE.ShaderMaterial({
    uniforms: { top: { value: new THREE.Color("#1b1040") }, mid: { value: new THREE.Color("#b8335f") }, bot: { value: new THREE.Color("#F5B53F") } },
    depthWrite: false,
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `varying vec2 vUv; uniform vec3 top, mid, bot;
      void main() { float y = vUv.y; vec3 c = y > 0.45 ? mix(mid, top, smoothstep(0.45, 1.0, y)) : mix(bot, mid, smoothstep(0.2, 0.45, y));
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(900, 520), skyMat);
  sky.position.set(W / 2, -H / 2 + 40, -420);
  scene.add(sky);
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(30, 48), glowMat(hot("#ffd27a", 2.2)));
  sunDisc.position.set(W / 2, -GROUND + 8, -400);
  scene.add(sunDisc);
  const sunStripes = new THREE.Group(); // the retro sun's stripes, as dark bands across the disc
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(64, 1.6 + i * 0.5), new THREE.MeshBasicMaterial({ color: 0xb8335f })); b.position.set(0, -6 - i * 4.5, 0.1); sunStripes.add(b); }
  sunStripes.position.copy(sunDisc.position);
  scene.add(sunStripes);

  // The skyline: buildings at several depths with lit windows.
  const windows = paint(64, 128, (g) => {
    g.fillStyle = "#000"; g.fillRect(0, 0, 64, 128);
    for (let y = 6; y < 128; y += 10) for (let x = 5; x < 64; x += 10) if (Math.random() < 0.38) { g.fillStyle = Math.random() < 0.8 ? "#ffd27a" : "#9fd0ff"; g.fillRect(x, y, 5, 6); }
  });
  windows.wrapS = windows.wrapT = THREE.RepeatWrapping;
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x2a1640, roughness: 0.8, metalness: 0.2, emissive: 0xffffff, emissiveMap: windows, emissiveIntensity: 1.3 });
  const towers = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), towerMat, 46);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  for (let i = 0; i < 46; i++) {
    const z = -140 - (i % 3) * 60, w = 16 + ((i * 13) % 20), h = 40 + ((i * 37) % 90);
    towers.setMatrixAt(i, m4.compose(v.set(-180 + i * 12.5 + ((i * 7) % 9), -GROUND - 20 + h / 2, z), q, sc.set(w, h, 14)));
  }
  scene.add(towers);

  // The roof: glossy, reflective, with seams; the railing; the crowd behind it.
  const seams = paint(256, 64, (g) => {
    g.fillStyle = "#4b2f66"; g.fillRect(0, 0, 256, 64);
    g.fillStyle = "#5c3a7d"; for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 2, 64);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`; g.fillRect(Math.random() * 256, Math.random() * 64, 1, 1); }
  });
  seams.wrapS = seams.wrapT = THREE.RepeatWrapping; seams.repeat.set(4, 2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W + 240, 140), new THREE.MeshPhysicalMaterial({ map: seams, roughness: 0.28, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, Y(GROUND), -30); floor.receiveShadow = true;
  scene.add(floor);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(W + 240, 1.6, 1.2), new THREE.MeshStandardMaterial({ color: 0x3a2350, metalness: 0.8, roughness: 0.35 }));
  rail.position.set(W / 2, Y(GROUND) + 10, -24);
  scene.add(rail);
  const CROWD = 40;
  const crowd = new THREE.InstancedMesh(new THREE.CapsuleGeometry(2.2, 5, 4, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), CROWD);
  const crowdCol = ["#2a1f4f", "#33255e", "#241a45"].map((c) => new THREE.Color(c));
  for (let i = 0; i < CROWD; i++) crowd.setColorAt(i, crowdCol[i % 3]);
  scene.add(crowd);

  // A jointed fighter: hips → torso → shoulders → arms, hips → legs; head on the torso. Built facing +x.
  // Pivots point down; rotation.z = angle reproduces Retro's "from straight down, + forward" angles.
  const tint = (hex: string, rough = 0.75) => new THREE.MeshPhysicalMaterial({ color: hex, roughness: rough, sheen: 0.6, sheenRoughness: 0.6, sheenColor: new THREE.Color(hex) });
  type Rig = {
    root: T.Group; hips: T.Group; torso: T.Group; head: T.Group; mats: T.MeshPhysicalMaterial[];
    arms: { sh: T.Group; el: T.Group }[]; legs: { hip: T.Group; knee: T.Group }[];
    pose: Pose; wasAir: boolean; lying: number;
  };
  const capsule = (r: number, len: number, mat: T.Material) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), mat); m.castShadow = st.shadows; return m; };
  const segment = (r: number, len: number, mat: T.Material) => { const g = new THREE.Group(); const m = capsule(r, len - r, mat); m.position.y = -len / 2; g.add(m); return g; };
  const makeFighter = (look: Look): Rig => {
    const skin = tint(look.skin, 0.55), top = tint(look.top), sleeve = tint(look.sleeve), legs = tint(look.legs), hair = tint(look.hair, 0.9);
    const extra = new THREE.MeshPhysicalMaterial({ color: look.extra, roughness: 0.5 });
    const root = new THREE.Group(), hips = new THREE.Group(), torso = new THREE.Group(), head = new THREE.Group();
    hips.position.y = 13; root.add(hips); hips.add(torso);
    const chest = capsule(2.7, 5.5, top); chest.scale.set(1, 1, 0.75); chest.position.y = 5; torso.add(chest);
    head.position.y = 12.5; torso.add(head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(2.6, 24, 18), skin); skull.castShadow = st.shadows;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(2.75, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.2), hair); cap.rotation.z = 0.35;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0x17153a })); eye.position.set(2.35, 0.3, 0.9);
    head.add(skull, cap, eye);
    if (look === PO) { const band = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.35, 8, 24), extra); band.rotation.x = Math.PI / 2; band.position.y = 0.6; head.add(band); }
    else { const tie = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.5, 0.4), extra); tie.position.set(2.2, 7.5, 0); torso.add(tie); }
    const arm = (z: number) => {
      const sh = new THREE.Group(); sh.position.set(0, 8, z); torso.add(sh);
      const upper = segment(1.1, 6, sleeve); sh.add(upper);
      const el = new THREE.Group(); el.position.y = -6; sh.add(el);
      const fore = segment(0.95, 6, skin); el.add(fore);
      const fist = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 10), skin); fist.position.y = -6; fist.castShadow = st.shadows; el.add(fist);
      return { sh, el };
    };
    const leg = (z: number) => {
      const hip = new THREE.Group(); hip.position.set(0, 0, z); hips.add(hip);
      hip.add(segment(1.45, 7, legs));
      const knee = new THREE.Group(); knee.position.y = -7; hip.add(knee);
      knee.add(segment(1.25, 7, legs));
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.4, 2), new THREE.MeshStandardMaterial({ color: 0x17153a, roughness: 0.6 })); shoe.position.set(0.9, -7.2, 0); shoe.castShadow = st.shadows; knee.add(shoe);
      return { hip, knee };
    };
    // Front limbs nearer the camera (+z), drawn last in Retro; mirroring with scale.x keeps them near when facing left.
    const arms = [arm(2.6), arm(-2.6)], legsR = [leg(1.4), leg(-1.4)];
    scene.add(root);
    return { root, hips, torso, head, mats: [skin, top, sleeve, legs, hair, extra], arms, legs: legsR, pose: POSES.idle, wasAir: false, lying: 0 };
  };
  const rigs = [makeFighter(PO), makeFighter(SH)];

  const apply = (r: Rig, p: Pose) => {
    const [lean, fa, ba, fl, bl, drop] = p;
    r.hips.position.y = 13 - drop;
    r.torso.rotation.z = -lean;
    for (const [i, a] of [fa, ba].entries()) { r.arms[i].sh.rotation.z = a[0] + lean; r.arms[i].el.rotation.z = a[1] - a[0]; }
    for (const [i, l] of [fl, bl].entries()) { r.legs[i].hip.rotation.z = l[0]; r.legs[i].knee.rotation.z = l[1] - l[0]; }
  };

  // Energy balls: a hot core and a soft halo.
  const balls = Array.from({ length: 4 }, () => {
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 12), glowMat(new THREE.Color()));
    const halo = new THREE.Mesh(new THREE.SphereGeometry(3.4, 16, 12), glowMat(new THREE.Color(), 0.35));
    g.add(core, halo); g.visible = false; scene.add(g);
    return { g, core: core.material as T.MeshBasicMaterial, halo: halo.material as T.MeshBasicMaterial };
  });
  const sparks = st.sparks(320, 1.8);

  const cam = { x: W / 2, y: -H / 2, zoom: 1 };
  return {
    draw(f) {
      const { t } = f, dt = Math.max(f.dt, 0);
      // Fighters: blend toward the pose the game shows; freeze during hit-stop; lie flat on a KO.
      f.fighters.forEach((s, i) => {
        const r = rigs[i];
        const target = POSES[s.act === "ko" && s.y === 0 ? "hit" : poseName(s, t)] ?? POSES.idle;
        r.pose = lerpPose(r.pose, target, f.pause > 0 ? 0 : Math.min(1, dt * 20));
        apply(r, r.pose);
        r.lying += ((s.act === "ko" && s.y === 0 ? 1 : 0) - r.lying) * Math.min(1, dt * 10);
        r.root.position.set(X(s.x), Y(GROUND + s.y) + r.lying * 2.4, 0);
        r.root.scale.x = s.face;
        r.root.rotation.set(0, -0.35 * s.face, s.face * (Math.PI / 2) * r.lying);
        const flash = s.act === "hit" && Math.floor(t * 20) % 2 ? 0.6 : 0;
        for (const m of r.mats) { m.emissive.set(0xff3b3b); m.emissiveIntensity = flash; }
      });

      balls.forEach((o, i) => {
        const b = f.balls[i];
        o.g.visible = !!b;
        if (!b) return;
        const c = b.mine ? "#5fd0ff" : "#ff7ac6";
        o.core.color.copy(hot("#ffffff", 3)); o.halo.color.copy(hot(c, 2.2));
        o.g.position.set(X(b.x), Y(b.y), 2);
        o.g.scale.setScalar((b.big ? 1.7 : 1) * (1 + Math.sin(t * 30 + i) * 0.08));
      });

      const n = Math.min(f.sparks.length, sparks.max);
      for (let i = 0; i < n; i++) { const s = f.sparks[i]; sparks.set(i, X(s.x), Y(s.y), 4, s.color, Math.min(1, s.life * 3) * 2.4); }
      sparks.commit(n);

      // The crowd bobs, harder on a KO.
      for (let i = 0; i < CROWD; i++) {
        const h = 1 + ((i * 7) % 4) * 0.12, bob = Math.sin(t * 6 + i * 0.7) * (f.state === "ko" ? 1.6 : 0.7);
        crowd.setMatrixAt(i, m4.compose(v.set(-10 + i * 5.4, Y(GROUND) + 14 + bob, -30 - (i % 3) * 3), q, sc.set(1, h, 1)));
      }
      crowd.instanceMatrix.needsUpdate = true;

      // Camera: frame the fight. Reduced motion: no zoom changes.
      const me = f.fighters[0], cpu = f.fighters[1];
      const fr = st.calm ? { x: W / 2, y: -H / 2, zoom: 1 } : framing(me.x, cpu.x, W, H);
      const k = Math.min(1, dt * 4);
      cam.x += (fr.x - cam.x) * k; cam.y += (fr.y - cam.y) * k; cam.zoom += (fr.zoom - cam.zoom) * k;
      const sx = f.shake > 0 ? (Math.random() - 0.5) * 3 : 0, sy = f.shake > 0 ? (Math.random() - 0.5) * 2 : 0;
      camera.position.set(cam.x + sx, cam.y + sy, D / cam.zoom);
      camera.lookAt(cam.x + sx, cam.y + sy, 0);

      st.render(dt);
    },
    dispose: () => st.dispose(...textures),
  };
}
```

- [ ] **Step 3: Type-check and test**

Run: `npx tsc --noEmit -p . && npm test`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add lib/fighter3d.ts lib/retro/fighter.ts
git commit -m "Sprint Fighter in 3D: a glossy rooftop at sunset, a lit city, jointed fighters posed by the game

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Browser check (controller)**: HD shows the rooftop, sun with stripes, lit skyline, crowd, two fighters; walking strides, punches extend the front arm toward the opponent, kicks raise the front leg, crouch drops the hips, blocks raise both arms, specials push both hands forward; switch to Retro mid-move — limbs agree; jump over the opponent: facing flips and near limbs stay near; a KO lays the loser flat, head away from the hit; context loss → Retro, same health/clock/round.

---

### Task 4: Drama — specials with trails and a flare, dust, camera beats, seasons

**Files:**
- Modify: `lib/fighter3d.ts`

- [ ] **Step 1: Add after the balls pool:**

```ts
  // Each ball leaves a trail of fading sparks; a big one also carries a lens flare.
  const trail = st.sparks(200, 2.4);
  const trailPts: { x: number; y: number; c: string; life: number }[] = [];
  const flareTex = paint(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.2, "rgba(255,255,255,0.35)"); r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    g.fillStyle = "rgba(255,255,255,0.5)"; g.fillRect(0, 62, 128, 4); // the streak
  });
  const flares = balls.map(() => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshBasicMaterial({ map: flareTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, color: new THREE.Color(2, 2, 2) }));
    m.visible = false; scene.add(m); return m;
  });

  // Dust rings where a fighter lands.
  const rings = Array.from({ length: 4 }, () => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.3, 8, 40), new THREE.MeshBasicMaterial({ color: 0xd8c8e8, transparent: true, opacity: 0, depthWrite: false }));
    m.rotation.x = Math.PI / 2; m.visible = false; scene.add(m); return { m, age: 99 };
  });

  // Seasons: a Halloween moon and cape, a Christmas hat for The PO.
  if (f0Season.halloween) {
    skyMat.uniforms.top.value.set("#07041a"); skyMat.uniforms.mid.value.set("#3b1a5a"); skyMat.uniforms.bot.value.set("#ff8c1a");
    sunDisc.material = glowMat(hot("#f3f0d0", 1.6)); sunDisc.position.set(W / 2 + 60, -30, -400); sunStripes.visible = false;
    const cape = new THREE.Mesh(new THREE.PlaneGeometry(6, 18), new THREE.MeshStandardMaterial({ color: 0x2a0a1a, side: THREE.DoubleSide, roughness: 0.6 }));
    cape.position.set(-2.4, 2, 0); cape.rotation.y = Math.PI / 2; rigs[1].torso.add(cape);
  }
  if (f0Season.christmas) {
    const hat = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 5, 16), new THREE.MeshStandardMaterial({ color: 0xff3b3b, roughness: 0.7 }));
    const brim = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.6, 8, 20), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }));
    cone.position.y = 3.6; brim.rotation.x = Math.PI / 2; brim.position.y = 1.3; hat.add(cone, brim); rigs[0].head.add(hat);
  }
```

Seasons are known when the view mounts: change the signature to `mountFighter(canvas, W, H, GROUND, season: { halloween: boolean; christmas: boolean }, onLost?)`, name the parameter `f0Season`, and in `components/SprintFighter.tsx` pass `{ halloween: SEASON === "halloween", christmas: SEASON === "christmas" }` before `drop`.

- [ ] **Step 2: Drive them in `draw`**, replacing the balls loop and adding before the camera block:

```ts
      balls.forEach((o, i) => {
        const b = f.balls[i];
        o.g.visible = flares[i].visible = !!b;
        if (!b) return;
        const c = b.mine ? "#5fd0ff" : "#ff7ac6";
        o.core.color.copy(hot("#ffffff", 3)); o.halo.color.copy(hot(c, 2.2));
        o.g.position.set(X(b.x), Y(b.y), 2);
        o.g.scale.setScalar((b.big ? 1.7 : 1) * (1 + Math.sin(t * 30 + i) * 0.08));
        if (dt > 0) trailPts.push({ x: X(b.x) - Math.sign(b.vx) * 2, y: Y(b.y) + (Math.random() - 0.5) * 2, c, life: 0.35 });
        flares[i].visible = b.big;
        flares[i].position.set(X(b.x), Y(b.y), 3); flares[i].rotation.z = t * 2;
      });
      for (const p of trailPts) p.life -= dt;
      while (trailPts.length && trailPts[0].life <= 0) trailPts.shift();
      const tn = Math.min(trailPts.length, trail.max);
      for (let i = 0; i < tn; i++) { const p = trailPts[trailPts.length - 1 - i]; trail.set(i, p.x, p.y, 1.5, p.c, p.life * 5); }
      trail.commit(tn);

      f.fighters.forEach((s, i) => {
        const r = rigs[i], air = s.y < 0;
        if (r.wasAir && !air && s.act !== "ko") { const ring = rings.reduce((a, b) => (a.age > b.age ? a : b)); ring.age = 0; ring.m.position.set(X(s.x), Y(GROUND) + 0.3, 0); ring.m.visible = true; }
        r.wasAir = air;
      });
      for (const ring of rings) {
        if (!ring.m.visible) continue;
        ring.age += dt; const k2 = Math.min(1, ring.age / 0.5);
        ring.m.scale.setScalar(1 + k2 * 9); (ring.m.material as T.MeshBasicMaterial).opacity = (1 - k2) * 0.55;
        if (k2 >= 1) ring.m.visible = false;
      }
```

Camera beats — replace the camera block with:

```ts
      const me = f.fighters[0], cpu = f.fighters[1];
      let fr = st.calm ? { x: W / 2, y: -H / 2, zoom: 1 } : framing(me.x, cpu.x, W, H);
      if (!st.calm && f.state === "intro") fr = { ...fr, zoom: fr.zoom * (1 - Math.min(1, Math.max(0, f.stateT - 1)) * 0.12) }; // starts wide, settles in
      if (!st.calm && f.pause > 0) fr = { ...fr, zoom: fr.zoom * 1.04 }; // a punch-in on every hit-stop
      const k = Math.min(1, Math.max(f.dt, 1 / 120) * 4);
      cam.x += (fr.x - cam.x) * k; cam.y += (fr.y - cam.y) * k; cam.zoom += (fr.zoom - cam.zoom) * k;
      const sx = f.shake > 0 ? (Math.random() - 0.5) * 3 : 0, sy = f.shake > 0 ? (Math.random() - 0.5) * 2 : 0;
      // On a KO the camera circles the fallen fighter a little; reduced motion keeps it still.
      const loser = f.fighters.find((s) => s.act === "ko");
      const orbit = !st.calm && f.state === "ko" && loser ? Math.min(0.35, (3 - f.stateT) * 0.12) : 0;
      const dist = D / cam.zoom, lx = loser ? X(loser.x) : cam.x;
      const px = orbit ? lx + Math.sin(orbit) * dist : cam.x + sx, pz = orbit ? Math.cos(orbit) * dist : dist;
      camera.position.set(px, cam.y + sy, pz);
      camera.lookAt(orbit ? lx : cam.x + sx, cam.y + sy, 0);
```

(`k` uses real frame time even during hit-stop so the punch-in shows; `f.dt` is 0 then.)

- [ ] **Step 3: Type-check, test, commit**

Run: `npx tsc --noEmit -p . && npm test` → pass.

```bash
git add lib/fighter3d.ts components/SprintFighter.tsx
git commit -m "Sprint Fighter drama: ball trails and flares, landing dust, punch-ins, a KO orbit, seasonal touches

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Browser check (controller)**: specials leave a trail; a MEGA special carries a spinning flare; landing puffs a ring; hits punch the camera in; a KO slowly circles the fallen fighter, both fighters stay in frame; `?season=halloween` moon, purple sky, cape; `?season=christmas` Santa hat + HUD snow; reduced motion: no zoom changes or orbit.

---

### Task 5: Verification pass (controller)

- [ ] `npx tsc --noEmit -p . && npm test && npm run build` pass; `npm run assets:check` exit 0.
- [ ] `?perf`: ≥ 55 fps high, ≥ 30 fps low (`?tier=low`).
- [ ] Full match in HD to a win and to a loss; rematch; Retro full match; GPU loss mid-round keeps health/clock/round/wins.
- [ ] Close/reopen the arcade into Sprint Fighter 10×: no false toasts, no context warnings.
