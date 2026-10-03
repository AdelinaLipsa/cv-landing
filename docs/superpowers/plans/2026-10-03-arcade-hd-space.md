# Arcade HD, Plan 2: Space Shooter, Final Quality — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The space shooter's HD view (Plan 1 v1) gets the rest of the Vision: explosions with flying debris, smoke and a shockwave ring; a planet with an atmosphere and rings behind a drifting asteroid belt; engine ribbon trails that bend as you strafe; a ripple across the shield when it absorbs a hit; and a boss that smokes and sheds its side pods as it takes damage.

**Architecture:** All in `lib/space3d.ts` (the view), driven only by the frame. One frame field is added: `boss.hp` (0..1) — view data, read from the game's existing `boss.hp / BOSS_HP`. Explosions hang off the existing `boom(x, y, color, power)` call (the game already calls it for every burst of 8+ sparks). The shield ripple is detected in the view (shield on → off).

**Tech Stack:** three 0.186 on the shared stage (`lib/arcade3d.ts`).

**Spec:** `docs/superpowers/plans/2026-10-03-arcade-hd.md` → Vision → "Space shooter (Plan 2)" and its Global Constraints.

## Global Constraints

- Parent plan constraints apply (rules/hitboxes unchanged; views read state only; reduced motion: no shake/flash; Retro unchanged; seasons keep working; commits end with a Co-Authored-By trailer).
- Space grid: `W = 192`, `H = 120`; world `x = gridX − W/2`, `y = H/2 − gridY`; gameplay plane z = 0. Background objects only at z ≤ −40 so they never cover play.
- Performance: ≥ 55 fps on high with a full wave and a boss explosion; ≥ 30 fps on low. Particle counts scale with `st.settings.particles`.
- No new assets: everything procedural.

## Review Focus

1. **Explosion storms** (bomb power-up kills six aliens at once; boss death fires six bursts): pools must cap, not grow; fps holds. Pinned in Task 1 (fixed pools, oldest recycled) and Task 6.
2. **Background never hides play**: planet, rings and asteroids stay behind z = −40 and dim enough that shots and bombs read over them. Task 2's browser check.
3. **Trails on teleport**: a new game re-centres the ship; trails must not draw a streak across the screen. Task 3 (reset on jumps > 20 units).
4. **Shield ripple without logic changes**: detected from the frame only. Task 4.
5. **Boss damage states reset** on a new game (pods back on, smoke off). Task 5.

---

### Task 1: Explosions — debris, smoke, shockwave

**Files:** Modify `lib/space3d.ts`.

- [ ] **Step 1: Build the pools** (after `const sparks = st.sparks(900, 2.2);`):

```ts
  // Explosions: hull shards that tumble outward, soft smoke that swells and fades, a shockwave ring.
  // Fixed pools; the oldest entry is recycled, so a bomb power-up or the boss's death can't grow them.
  const scale = st.settings.particles;
  const SHARDS = Math.round(160 * scale), PUFFS = Math.round(90 * scale);
  const shardGeo = new THREE.TetrahedronGeometry(0.7, 0);
  const shards = new THREE.InstancedMesh(shardGeo, new THREE.MeshStandardMaterial({ color: 0x9aa0bd, metalness: 0.8, roughness: 0.35, emissive: 0xff7a2a, emissiveIntensity: 0.6 }), SHARDS);
  shards.frustumCulled = false; scene.add(shards);
  const shardState = Array.from({ length: SHARDS }, () => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, spin: 0, life: 0, size: 1 }));
  let shardNext = 0;
  const puffGeo = new THREE.BufferGeometry();
  const puffPos = new Float32Array(PUFFS * 3), puffA = new Float32Array(PUFFS), puffS = new Float32Array(PUFFS);
  puffGeo.setAttribute("position", new THREE.BufferAttribute(puffPos, 3));
  puffGeo.setAttribute("alpha", new THREE.BufferAttribute(puffA, 1));
  puffGeo.setAttribute("size", new THREE.BufferAttribute(puffS, 1));
  const puffs = new THREE.Points(puffGeo, new THREE.ShaderMaterial({
    uniforms: { map: { value: dot }, scale: { value: 1 } }, transparent: true, depthWrite: false,
    vertexShader: "attribute float alpha; attribute float size; varying float vA; uniform float scale; void main() { vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }",
    fragmentShader: "uniform sampler2D map; varying float vA; void main() { gl_FragColor = vec4(vec3(0.42, 0.4, 0.5), texture2D(map, gl_PointCoord).a * vA * 0.5); }",
  }));
  puffs.frustumCulled = false; scene.add(puffs);
  const puffState = Array.from({ length: PUFFS }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 1 }));
  let puffNext = 0;
  const waves = Array.from({ length: 6 }, () => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.18, 8, 48), glowMat(new THREE.Color(), 0.9));
    m.visible = false; scene.add(m); return { m, age: 99, size: 1 };
  });
  const explode = (x: number, y: number, color: string, power: number) => {
    const n = Math.round(Math.min(24, 6 + power * 8) * scale);
    for (let i = 0; i < n; i++) {
      const s = shardState[shardNext]; shardNext = (shardNext + 1) % SHARDS;
      const a = Math.random() * Math.PI * 2, sp = 18 + Math.random() * 40 * power;
      Object.assign(s, { x, y, z: (Math.random() - 0.5) * 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: (Math.random() - 0.5) * 20, rx: Math.random() * 6, ry: Math.random() * 6, spin: 4 + Math.random() * 10, life: 0.6 + Math.random() * 0.6, size: 0.5 + Math.random() * 1.2 });
    }
    for (let i = 0; i < Math.round(Math.min(10, 3 + power * 3) * scale); i++) {
      const p = puffState[puffNext]; puffNext = (puffNext + 1) % PUFFS;
      const a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 10;
      Object.assign(p, { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 0.9 + Math.random() * 0.8, size: 6 + Math.random() * 6 * power });
    }
    const w = waves.reduce((a, b) => (a.age > b.age ? a : b));
    w.age = 0; w.size = 10 + power * 14; w.m.position.set(x, y, 1); w.m.visible = true;
    (w.m.material as T.MeshBasicMaterial).color.copy(hot(color, 2));
  };
```

- [ ] **Step 2: Trigger and animate.** In `boom(x, y, color, power)`, add as its last line: `explode(X(x), Y(y), color, power);`. In `draw`, before the camera line:

```ts
      // Shards tumble and slow; smoke drifts, swells and fades; shockwaves race out and thin.
      for (let i = 0; i < SHARDS; i++) {
        const s = shardState[i];
        if (s.life > 0) { s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.vx *= 0.97; s.vy *= 0.97; s.rx += s.spin * dt; s.ry += s.spin * 0.7 * dt; }
        const k = Math.max(0, Math.min(1, s.life * 2)) * s.size;
        q.setFromEuler(eul.set(s.rx, s.ry, 0));
        shards.setMatrixAt(i, m4.compose(v.set(s.x, s.y, s.z), q, pulse.setScalar(k)));
      }
      shards.instanceMatrix.needsUpdate = true;
      (puffs.material as T.ShaderMaterial).uniforms.scale.value = st.renderer.domElement.height / 2;
      for (let i = 0; i < PUFFS; i++) {
        const p = puffState[i];
        if (p.life < p.max) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; }
        const u = p.life / p.max;
        puffPos[i * 3] = p.x; puffPos[i * 3 + 1] = p.y; puffPos[i * 3 + 2] = -1;
        puffA[i] = u < 1 ? Math.sin(u * Math.PI) : 0; puffS[i] = p.size * (0.6 + u);
      }
      puffGeo.attributes.position.needsUpdate = puffGeo.attributes.alpha.needsUpdate = puffGeo.attributes.size.needsUpdate = true;
      for (const w of waves) {
        if (!w.m.visible) continue;
        w.age += dt; const u = Math.min(1, w.age / 0.45);
        w.m.scale.setScalar(1 + u * w.size); (w.m.material as T.MeshBasicMaterial).opacity = (1 - u) * 0.9;
        if (u >= 1) w.m.visible = false;
      }
```

Add `eul = new THREE.Euler()` to the `m4, q, v, …` declaration line.

- [ ] **Step 3:** `npx tsc --noEmit -p . && npm test` → pass. Commit: `Space shooter explosions: tumbling shards, smoke, a shockwave ring`.
- [ ] **Step 4 (controller):** kill aliens: shards fly and tumble, smoke swells, a ring races out; bomb power-up (six kills) stays smooth.

---

### Task 2: A planet, its rings, and an asteroid belt

**Files:** Modify `lib/space3d.ts`.

- [ ] **Step 1** (after the star layers):

```ts
  // A gas giant low on the right, behind everything: banded surface, an atmosphere glowing at its rim, rings.
  const planetMat = new THREE.ShaderMaterial({
    uniforms: { t: { value: 0 }, sun: { value: new THREE.Vector3(-0.6, 0.5, 0.6).normalize() } },
    vertexShader: "varying vec3 vN; varying vec3 vP; void main() { vN = normalize(normalMatrix * normal); vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `varying vec3 vN; varying vec3 vP; uniform float t; uniform vec3 sun;
      void main() { float lat = vP.y / 40.0; float bands = sin(lat * 18.0 + sin(vP.x * 0.08 + t * 0.05) * 1.5) * 0.5 + 0.5;
        vec3 base = mix(vec3(0.22, 0.12, 0.38), vec3(0.55, 0.28, 0.5), bands);
        float light = max(dot(vN, sun), 0.0); float rim = pow(1.0 - max(vN.z, 0.0), 3.0);
        gl_FragColor = vec4(base * (0.15 + light * 0.9) + vec3(0.35, 0.55, 1.0) * rim * 1.4, 1.0); }`,
  });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(40, 64, 40), planetMat);
  planet.position.set(110, -75, -170);
  const rings = new THREE.Mesh(new THREE.RingGeometry(52, 78, 96), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: "varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "varying vec2 vP; void main() { float r = length(vP); float b = sin(r * 1.3) * 0.5 + 0.5; gl_FragColor = vec4(vec3(0.75, 0.62, 0.8) * (0.4 + b * 0.6), (0.18 + b * 0.25) * smoothstep(52.0, 56.0, r) * (1.0 - smoothstep(74.0, 78.0, r))); }",
  }));
  rings.position.copy(planet.position); rings.rotation.set(1.25, 0.2, 0.35);
  scene.add(planet, rings);

  // An asteroid belt drifting across the middle distance: lumpy, lit rocks.
  const ROCKS = Math.round(70 * st.settings.particles);
  const rockGeo = new THREE.IcosahedronGeometry(1, 1);
  const rp = rockGeo.attributes.position as T.BufferAttribute;
  for (let i = 0; i < rp.count; i++) { const k = 0.75 + Math.random() * 0.5; rp.setXYZ(i, rp.getX(i) * k, rp.getY(i) * k, rp.getZ(i) * k); }
  rockGeo.computeVertexNormals();
  const rocks = new THREE.InstancedMesh(rockGeo, new THREE.MeshStandardMaterial({ color: 0x6b6478, roughness: 0.95, metalness: 0.05, flatShading: true }), ROCKS);
  const rockState = Array.from({ length: ROCKS }, (_, i) => ({ x: -160 + Math.random() * 320, y: -30 + Math.random() * 70, z: -60 - Math.random() * 60, s: 0.8 + Math.random() * 3.2, rx: Math.random() * 6, ry: Math.random() * 6, spin: 0.2 + Math.random() * 0.8, v: 3 + (i % 5) }));
  scene.add(rocks);
```

- [ ] **Step 2** (in `draw`, after the star layers update):

```ts
      planetMat.uniforms.t.value = t; planet.rotation.y = t * 0.01;
      rockState.forEach((r, i) => {
        r.x += r.v * dt * f.warp; if (r.x > 170) r.x -= 340;
        r.rx += r.spin * dt; r.ry += r.spin * 0.6 * dt;
        q.setFromEuler(eul.set(r.rx, r.ry, 0));
        rocks.setMatrixAt(i, m4.compose(v.set(r.x, r.y, r.z), q, pulse.setScalar(r.s)));
      });
      rocks.instanceMatrix.needsUpdate = true;
```

- [ ] **Step 3:** tsc + tests; commit `Space shooter backdrop: a ringed gas giant and a drifting asteroid belt`.
- [ ] **Step 4 (controller):** planet bottom-right with a blue rim glow and rings; rocks drift behind play and never hide shots; warp speeds them between waves.

---

### Task 3: Engine ribbon trails

**Files:** Modify `lib/space3d.ts`.

- [ ] **Step 1** (after the player is built):

```ts
  // Two glowing ribbons stream from the engines; they bend as the ship strafes and fade toward the tail.
  const TRAIL = 22;
  const trailGeo = new THREE.BufferGeometry();
  const trailPos = new Float32Array(2 * TRAIL * 2 * 3), trailCol = new Float32Array(2 * TRAIL * 2 * 3);
  const idx: number[] = [];
  for (let s = 0; s < 2; s++) for (let i = 0; i < TRAIL - 1; i++) { const a = (s * TRAIL + i) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  trailGeo.setIndex(idx);
  trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
  trailGeo.setAttribute("color", new THREE.BufferAttribute(trailCol, 3));
  const trails = new THREE.Mesh(trailGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide }));
  trails.frustumCulled = false; scene.add(trails);
  const hist = [0, 1].map(() => Array.from({ length: TRAIL }, () => new THREE.Vector2(0, -999)));
  const trailColor = new THREE.Color();
```

- [ ] **Step 2** (in `draw`, after the player is positioned):

```ts
      // Each frame the history shifts back and falls behind (the ship flies "up" through space).
      for (let s = 0; s < 2; s++) {
        const h = hist[s], ex = X(f.ship.x) + (s ? 1.45 : -1.45) * Math.cos(bank), ey = Y(H - 6.5) - 4.6;
        if (Math.abs(h[0].x - ex) > 20 || h[0].y < -500) for (const p of h) p.set(ex, ey); // first frame, or a new game re-centring the ship: no streak
        for (let i = TRAIL - 1; i > 0; i--) h[i].set(h[i - 1].x, h[i - 1].y - 26 * dt * f.warp);
        h[0].set(ex, ey);
        for (let i = 0; i < TRAIL; i++) {
          const w = 0.55 * (1 - i / TRAIL), k = f.ship.visible ? (1 - i / TRAIL) ** 1.6 * 2.2 : 0, a = (s * TRAIL + i) * 2;
          trailPos.set([h[s][i].x - w, h[s][i].y, -0.5, h[s][i].x + w, h[s][i].y, -0.5], a * 3);
          trailColor.set(f.ship.trim).lerp(new THREE.Color(1, 0.7, 0.3), 0.6).multiplyScalar(k);
          trailCol.set([trailColor.r, trailColor.g, trailColor.b, trailColor.r, trailColor.g, trailColor.b], a * 3);
        }
      }
      trailGeo.attributes.position.needsUpdate = trailGeo.attributes.color.needsUpdate = true;
```

Hoist `new THREE.Color(1, 0.7, 0.3)` to a constant `flameTint` next to `trailColor` (no per-frame allocation).

- [ ] **Step 3:** tsc + tests; commit `Space shooter: engine ribbons that bend as you strafe`.
- [ ] **Step 4 (controller):** ribbons trail and curve when strafing; no screen-wide streak after "play again"; invisible while the ship blinks out.

---

### Task 4: Shield ripple

**Files:** Modify `lib/space3d.ts`.

- [ ] **Step 1:** Add a `hit` uniform to `shieldMat` (`hit: { value: 0 }`) and change its fragment shader to add a travelling ring: replace the `gl_FragColor` line with:

```glsl
float f = pow(1.0 - abs(dot(vN, vV)), 2.2); float ring = hit > 0.0 ? smoothstep(0.12, 0.0, abs(f - (1.0 - hit))) * hit : 0.0;
gl_FragColor = vec4(c * (f + 0.06 + 0.05 * sin(t * 6.0) + ring * 2.5), 1.0);
```

(declare `uniform float hit;`).

- [ ] **Step 2:** Detect absorption from the frame: keep `let hadShield = false, ripple = 0;`. In `draw`: `if (hadShield && !f.ship.shield) ripple = 1; hadShield = f.ship.shield; ripple = Math.max(0, ripple - dt * 2.5);`. Keep the shield mesh visible while `ripple > 0` (so the ripple plays as it collapses): `shield.visible = f.ship.shield || ripple > 0;` and `shieldMat.uniforms.hit.value = ripple;`.
- [ ] **Step 3:** tsc + tests; commit `Space shooter: the shield ripples when it takes a hit`.
- [ ] **Step 4 (controller):** pick up S, take a bomb: a bright ring sweeps across the bubble as it collapses.

---

### Task 5: The boss takes damage

**Files:** Modify `lib/space3d.ts`, `components/SpaceGame.tsx` (one frame field).

- [ ] **Step 1:** `SpaceFrame.boss` gains `hp: number` (0..1). In `components/SpaceGame.tsx` where the frame's boss is built, add `hp: boss.hp / BOSS_HP`.
- [ ] **Step 2** (boss build): two side pods that can break off, and a smoke emitter:

```ts
  const pods = [-1, 1].map((s) => {
    const p = new THREE.Group();
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 4.2, 16), gunmetal); pod.rotation.z = Math.PI / 2;
    const glowTip = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), glowMat(hot(bossColor, 2.5))); glowTip.position.x = s * 2.3;
    p.add(pod, glowTip); p.position.set(s * 10.2, 0, 0); boss.add(p);
    return { p, s, off: false, vx: 0, vy: 0, spin: 0 };
  });
```

- [ ] **Step 3** (draw, boss block): pods detach at 0.66 and 0.33 health, fall away spinning (re-attach when a new boss appears at full health); below half, smoke rises from the hull:

```ts
      if (f.boss) {
        if (f.boss.hp > 0.95) for (const pd of pods) if (pd.off) { pd.off = false; boss.add(pd.p); pd.p.position.set(pd.s * 10.2, 0, 0); pd.p.rotation.set(0, 0, 0); }
        pods.forEach((pd, i) => {
          if (!pd.off && f.boss!.hp < (i ? 0.33 : 0.66)) {
            pd.off = true; scene.attach(pd.p); pd.vx = pd.s * 14; pd.vy = 6; pd.spin = 3 + Math.random() * 3;
            explode(pd.p.position.x, pd.p.position.y, bossColor, 1.2);
          }
          if (pd.off) { pd.vy -= 30 * dt; pd.p.position.x += pd.vx * dt; pd.p.position.y += pd.vy * dt; pd.p.rotation.z += pd.spin * dt; }
        });
        if (f.boss.hp < 0.5 && Math.random() < dt * 12) {
          const p = puffState[puffNext]; puffNext = (puffNext + 1) % PUFFS;
          Object.assign(p, { x: boss.position.x + (Math.random() - 0.5) * 12, y: boss.position.y + 2, vx: (Math.random() - 0.5) * 3, vy: 8 + Math.random() * 6, life: 0, max: 1.4, size: 7 });
        }
      } else for (const pd of pods) if (pd.off) { pd.p.position.y -= 40 * dt; }
```

- [ ] **Step 4:** tsc + tests; commit `Space shooter: The Backlog smokes and sheds its pods as it breaks`.
- [ ] **Step 5 (controller):** boss loses one pod at two-thirds health and the other at a third; smoke rises below half; a new game shows a whole boss again.

---

### Task 6: Verification (controller)

- [ ] `npx tsc --noEmit -p . && npm test && npm run build` pass.
- [ ] `?perf`: high ≥ 55 fps during a bomb power-up and the boss death; low ≥ 30 fps.
- [ ] Retro unchanged; context loss mid-wave keeps the run; Halloween/Christmas tints still apply; 10× open/close leak check clean.
