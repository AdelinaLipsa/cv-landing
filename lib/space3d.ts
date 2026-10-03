// The space shooter's 3D view. The game still plays on its 192 × 120 grid (components/SpaceGame);
// this draws that grid as a real scene: lit metal ships, a nebula, glowing shots, bloom.
// The camera looks straight down the z axis and frames the grid exactly, so hitboxes stay where you see them.
import type * as T from "three";
import { FOV, stage } from "./arcade3d";

export type SpaceFrame = {
  t: number; dt: number; warp: number; shake: number;
  ship: { x: number; visible: boolean; trim: string; shield: boolean };
  aliens: { x: number; y: number; alive: boolean; diving: boolean }[]; kind: number;
  boss: { x: number; y: number; hit: boolean } | null;
  shots: { x: number; y: number; vx: number; vy: number }[];
  bombs: { x: number; y: number }[];
  drops: { x: number; y: number; color: string }[];
  sparks: { x: number; y: number; life: number; max: number; color: string }[];
};
export type SpaceView = { draw: (f: SpaceFrame) => void; boom: (x: number, y: number, color: string, power: number) => void; dispose: () => void };

export async function mountSpace(canvas: HTMLCanvasElement, W: number, H: number, tint: string[], bossColor: string, onLost?: () => void): Promise<SpaceView> {
  const st = await stage(canvas, W, H, { onLost });
  const { THREE, scene, camera, D, hot, glowMat, dot } = st;
  scene.background = new THREE.Color(0x05040f);
  const X = (x: number) => x - W / 2, Y = (y: number) => H / 2 - y;

  scene.add(new THREE.HemisphereLight(0x9fb4ff, 0x1a0f2e, 0.7));
  const key = new THREE.DirectionalLight(0xfff0dd, 1.8);
  key.position.set(-60, 90, 140);
  const rim = new THREE.DirectionalLight(0x5fd0ff, 1.6);
  rim.position.set(90, -50, -80);
  const flashLight = new THREE.PointLight(0xffffff, 0, 90, 0); // explosions light up whatever is near them
  flashLight.position.z = 12;
  scene.add(key, rim, flashLight);

  const hull = new THREE.MeshPhysicalMaterial({ color: 0xd9dde9, metalness: 0.85, roughness: 0.38, clearcoat: 0.3, clearcoatRoughness: 0.35 });
  // Flat panels face the camera head-on: mirror metal there reflects the studio light at full blast, so they get satin paint.
  const paint = new THREE.MeshStandardMaterial({ color: 0x8f98b4, metalness: 0.55, roughness: 0.6 });
  const gunmetal = new THREE.MeshPhysicalMaterial({ color: 0x4a5068, metalness: 0.9, roughness: 0.32, clearcoat: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x262a3c, metalness: 0.7, roughness: 0.45 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x0a1430, metalness: 0, roughness: 0.04, clearcoat: 1, emissive: 0x1a3a7a, emissiveIntensity: 0.5 });
  const accent = (hex: string, k = 2.2) => new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: k, metalness: 0.3, roughness: 0.4 });


  // Deep space: a slow nebula painted by a noise shader on a far plane.
  const nebula = new THREE.Mesh(
    new THREE.PlaneGeometry(420, 270),
    new THREE.ShaderMaterial({
      uniforms: { t: { value: 0 } },
      depthWrite: false,
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `
        varying vec2 vUv; uniform float t;
        float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
        float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * n(p); p *= 2.03; a *= 0.5; } return v; }
        void main() {
          vec2 p = vUv * vec2(3.2, 2.0) + vec2(0.0, t * 0.015);
          float a = fbm(p + fbm(p * 1.7 + t * 0.01)), b = fbm(p * 2.3 - 4.0);
          vec3 c = vec3(0.012, 0.01, 0.04);
          c += vec3(0.22, 0.07, 0.38) * smoothstep(0.45, 0.95, a);
          c += vec3(0.04, 0.16, 0.42) * smoothstep(0.5, 1.0, b) * 0.9;
          c += vec3(0.6, 0.25, 0.4) * pow(smoothstep(0.62, 1.0, a * b * 1.6), 3.0);
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  );
  nebula.position.z = -220;
  scene.add(nebula);

  // Three layers of stars at different depths: real parallax.
  const layers = [{ z: -40, n: 110, size: 1.1, speed: 6 }, { z: -110, n: 120, size: 1.5, speed: 10 }, { z: -190, n: 200, size: 2, speed: 14 }].map((L) => {
    const half = (D - L.z) * Math.tan((FOV / 2) * (Math.PI / 180)), hw = half * (W / H);
    const pos = new Float32Array(L.n * 3), col = new Float32Array(L.n * 3);
    for (let i = 0; i < L.n; i++) {
      pos.set([(Math.random() * 2 - 1) * hw, (Math.random() * 2 - 1) * half, L.z], i * 3);
      const c = new THREE.Color().setHSL(0.6 + Math.random() * 0.15, 0.4, 0.5 + Math.random() * 0.5);
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: L.size, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(pts);
    return { pts, half, speed: L.speed * (D - L.z) / D };
  });

  // The player's ship: a lathed fuselage, swept wings, a glass canopy, twin engines.
  const player = new THREE.Group();
  const fuselage = new THREE.Mesh(new THREE.LatheGeometry([[0, -4], [1.1, -3.6], [1.5, -1.2], [1.25, 1.8], [0.55, 3.9], [0, 4.7]].map(([x, y]) => new THREE.Vector2(x, y)), 28), hull);
  const wingShape = new THREE.Shape([[0, 1.4], [1.2, 1], [4.8, -2.3], [4.6, -3.2], [0, -2.6], [-4.6, -3.2], [-4.8, -2.3], [-1.2, 1]].map(([x, y]) => new THREE.Vector2(x, y)));
  const wings = new THREE.Mesh(new THREE.ExtrudeGeometry(wingShape, { depth: 0.3, bevelThickness: 0.18, bevelSize: 0.18, bevelSegments: 3 }), paint);
  wings.position.z = -0.15;
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 14), glass);
  canopy.scale.set(1, 1.9, 0.85); canopy.position.set(0, 1.2, 0.95);
  const trim = accent("#5fd897");
  const tips = [-1, 1].map((s) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), trim); m.position.set(s * 4.6, -2.6, 0.2); return m; });
  const flameMat = glowMat(hot("#ffb347", 2.2), 0.9);
  const engines = [-1, 1].map((s) => {
    const g = new THREE.Group();
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 1.8, 18), dark);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.6, 16), flameMat);
    flame.rotation.x = Math.PI; flame.position.y = -2.1;
    g.add(pod, flame); g.position.set(s * 1.45, -3.3, 0);
    return Object.assign(g, { flame });
  });
  const shieldMat = new THREE.ShaderMaterial({
    uniforms: { c: { value: hot("#5fd0ff", 1.6) }, t: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: "varying vec3 vN, vV; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
    fragmentShader: "varying vec3 vN, vV; uniform vec3 c; uniform float t; void main() { float f = pow(1.0 - abs(dot(vN, vV)), 2.2); gl_FragColor = vec4(c * (f + 0.06 + 0.05 * sin(t * 6.0)), 1.0); }",
  });
  const shield = new THREE.Mesh(new THREE.SphereGeometry(7, 32, 20), shieldMat);
  player.add(fuselage, wings, canopy, ...tips, ...engines, shield);
  player.scale.setScalar(1);
  scene.add(player);

  // Three alien makes, one per wave, coloured by the wave (or the season).
  const makeAlien = (kind: number) => {
    const g = new THREE.Group(), c = tint[kind];
    if (kind === 0) {
      // A saucer: lathed hull, a lit glass dome, a ring of running lights.
      const disc = new THREE.Mesh(new THREE.LatheGeometry([[0, -0.8], [1.6, -0.7], [3.6, -0.15], [3.9, 0.05], [3.4, 0.35], [1.4, 0.7], [0, 0.75]].map(([x, y]) => new THREE.Vector2(x, y)), 32), gunmetal);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(1.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: c, metalness: 0, roughness: 0.05, clearcoat: 1, transmission: 0, emissive: c, emissiveIntensity: 0.35, transparent: true, opacity: 0.8 }));
      const pilot = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8), glowMat(hot(c, 2)));
      dome.position.y = pilot.position.y = 0.6;
      g.add(pilot);
      g.add(disc, dome);
      for (let i = 0; i < 10; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), glowMat(hot(c, 2.8))); const a = (i / 10) * Math.PI * 2; l.position.set(Math.cos(a) * 3.75, 0.05, Math.sin(a) * 3.75); g.add(l); }
    } else if (kind === 1) {
      // A crab: armoured shell, a glowing visor slit, pincers that snap.
      const shell = new THREE.Mesh(new THREE.SphereGeometry(2.2, 28, 18), dark);
      shell.scale.set(1.35, 0.85, 0.75);
      const visor = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 2.2, 4, 10), glowMat(hot(c, 2.8)));
      visor.rotation.z = Math.PI / 2; visor.position.set(0, -0.4, 1.45);
      const plate = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2.4), accent(c, 0.6));
      plate.rotation.x = Math.PI / 2.6; plate.position.set(0, 0.3, 0.6);
      g.add(shell, visor, plate);
      const claw = new THREE.Shape(); claw.absarc(0, 0, 1.5, 0.3, Math.PI * 1.6, false); claw.absarc(0, 0, 0.8, Math.PI * 1.6, 0.3, true);
      const clawGeo = new THREE.ExtrudeGeometry(claw, { depth: 0.4, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 2 });
      const claws = [-1, 1].map((s) => { const m = new THREE.Mesh(clawGeo, paint); m.position.set(s * 3.2, -0.6, 0); m.scale.x = s; return m; });
      g.add(...claws);
      g.userData.claws = claws;
    } else {
      // A crystal: faceted, iridescent, a white-hot core and an orbiting ring.
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(2.6, 0), new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.2, roughness: 0.08, iridescence: 1, clearcoat: 1, emissive: c, emissiveIntensity: 0.25, flatShading: true }));
      gem.scale.set(1, 1.25, 1);
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 0), glowMat(hot(c, 3)));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.12, 8, 48), glowMat(hot(c, 2)));
      ring.rotation.x = 1.2;
      g.add(gem, core, ring);
      g.userData.ring = ring;
    }
    g.scale.setScalar(kind === 1 ? 1.1 : 0.95);
    return g;
  };
  let alienKind = -1;
  let alienPool: T.Group[] = [];
  const alienRoot = new THREE.Group();
  scene.add(alienRoot);

  // The boss, The Backlog: a mothership with a red eye and a ring of lights.
  const boss = new THREE.Group();
  const bossHull = new THREE.MeshPhysicalMaterial({ color: 0x3a3f55, metalness: 0.9, roughness: 0.35, clearcoat: 0.4, emissive: 0xffffff, emissiveIntensity: 0 });
  const mother = new THREE.Mesh(new THREE.LatheGeometry([[0, -1.6], [3, -1.5], [8.4, -0.4], [8.8, 0], [8, 0.5], [4, 1.4], [2.4, 2.6], [0, 2.8]].map(([x, y]) => new THREE.Vector2(x, y)), 48), bossHull);
  const bossRing = new THREE.Mesh(new THREE.TorusGeometry(8.6, 0.3, 10, 64), accent(bossColor, 0.7));
  bossRing.rotation.x = Math.PI / 2;
  const eye = new THREE.Mesh(new THREE.SphereGeometry(1.5, 24, 16), glowMat(hot("#ff3b3b", 3.5)));
  eye.position.y = -1.6;
  boss.add(mother, bossRing, eye);
  for (let i = 0; i < 16; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), glowMat(hot(bossColor, 2.6))); const a = (i / 16) * Math.PI * 2; l.position.set(Math.cos(a) * 7.2, 0.6, Math.sin(a) * 7.2); boss.add(l); }
  boss.scale.setScalar(1.25);
  boss.visible = false;
  scene.add(boss);

  // Shots, bombs: instanced, so a screen full of lasers is one draw call each.
  const MAX = 300;
  const shots = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.3, 2.8, 4, 8), glowMat(new THREE.Color(1.6, 2.6, 3.2)), MAX);
  const bombs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.75, 12, 8), glowMat(hot("#ff4a4a", 3)), MAX);
  const bombHalo = new THREE.InstancedMesh(new THREE.SphereGeometry(1.6, 12, 8), glowMat(hot("#ff4a4a", 0.6), 0.5), MAX);
  for (const m of [shots, bombs, bombHalo]) { m.frustumCulled = false; scene.add(m); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), zAxis = new THREE.Vector3(0, 0, 1), pulse = new THREE.Vector3();

  // Power-ups: spinning glass gems with a hot core in the drop's colour.
  const dropPool = Array.from({ length: 12 }, () => {
    const outer = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.05, clearcoat: 1, emissive: 0xffffff, emissiveIntensity: 0.5, transparent: true, opacity: 0.85 });
    const inner = glowMat(new THREE.Color());
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(3, 0), outer), new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 8), inner));
    g.visible = false;
    scene.add(g);
    return { g, outer, inner };
  });

  const sparks = st.sparks(900, 2.2);

  let lastShipX = W / 2, bank = 0, flashPower = 0;

  return {
    boom(x, y, color, power) {
      flashLight.color.set(color);
      flashLight.position.set(X(x), Y(y), 12);
      flashPower = Math.max(flashPower, power);
    },
    draw(f) {
      const { t, dt } = f;
      (nebula.material as T.ShaderMaterial).uniforms.t.value = t;
      for (const L of layers) {
        const p = L.pts.geometry.attributes.position as T.BufferAttribute;
        for (let i = 0; i < p.count; i++) { let y = p.getY(i) - L.speed * f.warp * dt; if (y < -L.half) y += L.half * 2; p.setY(i, y); }
        p.needsUpdate = true;
      }

      // The ship banks into its turns and its engines flicker.
      player.visible = f.ship.visible;
      const vx = dt > 0 ? (f.ship.x - lastShipX) / dt : 0;
      lastShipX = f.ship.x;
      bank += (Math.max(-0.7, Math.min(0.7, vx * 0.012)) - bank) * Math.min(1, dt * 10);
      player.position.set(X(f.ship.x), Y(H - 6.5), 0);
      player.rotation.set(-0.35, bank, 0);
      trim.color.set(f.ship.trim); trim.emissive.set(f.ship.trim);
      for (const e of engines) e.flame.scale.set(1, 0.8 + Math.random() * 0.45 + (f.warp > 1 ? 0.8 : 0), 1);
      shield.visible = f.ship.shield;
      shieldMat.uniforms.t.value = t;

      if (alienKind !== f.kind || alienPool.length < f.aliens.length) {
        alienRoot.clear();
        alienKind = f.kind;
        alienPool = f.aliens.map(() => makeAlien(f.kind));
        if (alienPool.length) alienRoot.add(...alienPool);
      }
      alienPool.forEach((g, i) => {
        const a = f.aliens[i];
        g.visible = !!a?.alive;
        if (!g.visible) return;
        const phase = t * 2 + i * 0.7;
        g.position.set(X(a.x + 3.5), Y(a.y + 2.5) + Math.sin(phase) * 0.4, 0);
        if (f.kind === 0) g.rotation.set(0.62, t * 1.6 + i, a.diving ? -0.5 : 0); // seen three-quarters on, spinning
        else if (f.kind === 1) { g.rotation.set(-0.5 + (a.diving ? 0.6 : 0), Math.sin(phase) * 0.25, 0); (g.userData.claws as T.Mesh[]).forEach((c, k) => (c.rotation.z = (k ? 1 : -1) * (0.1 + Math.abs(Math.sin(phase * 2)) * 0.35))); }
        else { g.rotation.set(0.3, t * 1.2 + i, 0); (g.userData.ring as T.Mesh).rotation.z = t * 2; }
      });

      boss.visible = !!f.boss;
      if (f.boss) {
        boss.position.set(X(f.boss.x + 7.5), Y(f.boss.y + 4), 0);
        boss.rotation.set(0.5, t * 0.5, Math.sin(t * 0.9) * 0.12); // tilted toward you, turning, rocking
        bossHull.emissiveIntensity = f.boss.hit ? 0.8 : 0;
        eye.scale.setScalar(1 + Math.sin(t * 6) * 0.12);
      }

      shots.count = Math.min(f.shots.length, MAX);
      for (let i = 0; i < shots.count; i++) {
        const s = f.shots[i];
        q.setFromAxisAngle(zAxis, -Math.atan2(s.vx, -s.vy));
        shots.setMatrixAt(i, m4.compose(v.set(X(s.x), Y(s.y + 1.5), 0), q, one));
      }
      shots.instanceMatrix.needsUpdate = true;
      bombs.count = bombHalo.count = Math.min(f.bombs.length, MAX);
      q.identity();
      for (let i = 0; i < bombs.count; i++) {
        const b = f.bombs[i], s = 1 + Math.sin(t * 14 + i) * 0.2;
        bombs.setMatrixAt(i, m4.compose(v.set(X(b.x), Y(b.y + 1), 0), q, one));
        bombHalo.setMatrixAt(i, m4.compose(v, q, pulse.setScalar(s)));
      }
      bombs.instanceMatrix.needsUpdate = bombHalo.instanceMatrix.needsUpdate = true;

      dropPool.forEach((d, i) => {
        const drop = f.drops[i];
        d.g.visible = !!drop;
        if (!drop) return;
        d.g.position.set(X(drop.x), Y(drop.y), 0);
        d.g.rotation.set(t * 1.3, t * 2 + i, 0);
        d.outer.emissive.set(drop.color);
        d.inner.color.copy(hot(drop.color, 3));
      });

      const n = Math.min(f.sparks.length, sparks.max);
      for (let i = 0; i < n; i++) { const p = f.sparks[i]; sparks.set(i, X(p.x), Y(p.y), 2, p.color, (p.life / p.max) * 2.4); }
      sparks.commit(n);

      flashPower = Math.max(0, flashPower - dt * 4);
      flashLight.intensity = flashPower * 6;
      const k = f.shake > 0 && !st.calm ? 3 : 0;
      camera.position.set((Math.random() - 0.5) * k, (Math.random() - 0.5) * k, D);
      st.render(dt);
    },
    dispose: () => st.dispose(),
  };
}
