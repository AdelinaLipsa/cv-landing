// What the arcade's 3D views share (lib/space3d, lib/shipit3d, lib/fighter3d): a renderer with reflections,
// bloom that only catches lights hotter than white, a perspective camera that frames a W × H game grid
// exactly at z = 0 (so hitboxes stay where you see them), and additive sparks.
import type * as T from "three";
import { TIERS, pickTier, lower, fpsGovernor, type Tier } from "./quality";
import { getTierOverride } from "./arcadePrefs";
import { finishShader } from "./finishPass";

export const FOV = 30;

export async function stage(canvas: HTMLCanvasElement, W: number, H: number, opts: { bloom?: [number, number, number]; shadows?: boolean; env?: number; onLost?: () => void } = {}) {
  const [THREE, { RoomEnvironment }, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }, { ShaderPass }, { SMAAPass }] = await Promise.all([
    import("three"),
    import("three/examples/jsm/environments/RoomEnvironment.js"),
    import("three/examples/jsm/postprocessing/EffectComposer.js"),
    import("three/examples/jsm/postprocessing/RenderPass.js"),
    import("three/examples/jsm/postprocessing/UnrealBloomPass.js"),
    import("three/examples/jsm/postprocessing/OutputPass.js"),
    import("three/examples/jsm/postprocessing/ShaderPass.js"),
    import("three/examples/jsm/postprocessing/SMAAPass.js"),
  ]);
  const touch = matchMedia("(pointer: coarse)").matches;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = (() => { try { return localStorage; } catch { return null; } })(); // the property itself throws when storage is blocked
  let tier = pickTier({ touch, cores: navigator.hardwareConcurrency || 4, memoryGB: (navigator as { deviceMemory?: number }).deviceMemory, dpr: devicePixelRatio }, getTierOverride(store));
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: TIERS[tier].antialias, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.info.autoReset = false; // manually reset before composer.render() for accurate draw call counts
  // The GPU can take the context back (a phone backgrounding the tab). Say so; the game drops to Retro.
  const onContextLost = (e: Event) => { e.preventDefault(); opts.onLost?.(); };
  canvas.addEventListener("webglcontextlost", onContextLost, { once: true });

  const scene = new THREE.Scene();
  const D = H / 2 / Math.tan((FOV / 2) * (Math.PI / 180)); // the distance at which the grid exactly fills the frame
  const camera = new THREE.PerspectiveCamera(FOV, W / H, 1, 1200);
  camera.position.set(0, 0, D);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = opts.env ?? 0.45;

  // Colours brighter than white glow under bloom; toneMapped off keeps them hot.
  const hot = (hex: string, k: number) => new THREE.Color(hex).multiplyScalar(k);
  const glowMat = (c: T.Color, opacity = 1) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: opacity < 1, opacity, blending: opacity < 1 ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: opacity === 1 });

  // A soft round dot for stars and sparks.
  const dotCanvas = document.createElement("canvas");
  dotCanvas.width = dotCanvas.height = 64;
  const dg = dotCanvas.getContext("2d")!, grad = dg.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)"); grad.addColorStop(0.25, "rgba(255,255,255,0.8)"); grad.addColorStop(1, "rgba(255,255,255,0)");
  dg.fillStyle = grad; dg.fillRect(0, 0, 64, 64);
  const dot = new THREE.CanvasTexture(dotCanvas);

  // Sparks: additive points; set() each live one, then commit() how many.
  const sparks = (max: number, size: number) => {
    max = Math.max(32, Math.round(max * TIERS[tier].particles));
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(max * 3), col = new Float32Array(max * 3), c = new THREE.Color();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    pts.frustumCulled = false;
    scene.add(pts);
    return {
      max,
      set(i: number, x: number, y: number, z: number, color: string, k: number) {
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
        c.set(color).multiplyScalar(k);
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      },
      commit(n: number) { geo.setDrawRange(0, n); geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = true; },
    };
  };

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const [strength, radius, threshold] = opts.bloom ?? [0.7, 0.4, 1.6]; // by default only the hot lights glow, never lit metal
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 160), strength, radius, threshold));
  composer.addPass(new OutputPass());
  const finish = new ShaderPass(finishShader);
  composer.addPass(finish);
  const smaa = new SMAAPass();
  composer.addPass(smaa);

  const fit = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
  };
  // Tiers apply live: pixel ratio, shadows (materials recompile), SMAA, the finishing pass.
  const applyTier = (t: Tier) => {
    tier = t;
    const s = TIERS[t];
    renderer.setPixelRatio(Math.min(devicePixelRatio, s.pixelRatio));
    const shadows = !!opts.shadows && s.shadows;
    if (renderer.shadowMap.enabled !== shadows) {
      renderer.shadowMap.enabled = shadows;
      scene.traverse((o) => { const m = (o as T.Mesh).material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => (x.needsUpdate = true)); });
    }
    smaa.enabled = s.smaa;
    finish.enabled = s.finish;
    fit();
  };
  applyTier(tier);
  // ?perf: a small readout for tuning and leak hunting. Never shown otherwise.
  let perf: HTMLPreElement | null = null, frames = 0, since = performance.now();
  if (new URLSearchParams(location.search).has("perf")) {
    perf = document.createElement("pre");
    Object.assign(perf.style, { position: "fixed", right: "8px", bottom: "8px", zIndex: "99", margin: "0", padding: "6px 8px", font: "11px/1.4 ui-monospace, monospace", color: "#b6ffcf", background: "rgba(0,0,0,0.7)", borderRadius: "6px", pointerEvents: "none" });
    document.body.append(perf);
  }
  const govern = fpsGovernor(() => { const t = lower(tier); if (t) applyTier(t); });
  const ro = new ResizeObserver(fit);
  ro.observe(canvas);

  return {
    THREE, renderer, scene, camera, D, touch, calm,
    get tier() { return tier; },
    get settings() { return TIERS[tier]; },
    shadows: !!opts.shadows,
    hot, glowMat, dot, sparks,
    render(dt: number) {
      govern(dt);
      finish.uniforms.time.value += dt;
      renderer.info.reset();
      composer.render();
      if (perf && ++frames && performance.now() - since > 500) {
        const i = renderer.info, fps = (frames * 1000) / (performance.now() - since);
        perf.textContent = `${fps.toFixed(0)} fps · ${tier}\n${i.render.calls} calls · ${(i.render.triangles / 1000).toFixed(1)}k tris\n${i.memory.geometries} geo · ${i.memory.textures} tex`;
        frames = 0; since = performance.now();
      }
    },
    info: () => ({ tier, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, ...renderer.info.memory }),
    dispose(...extra: { dispose(): void }[]) {
      perf?.remove();
      ro.disconnect();
      scene.traverse((o) => {
        const m = o as T.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((mt) => { (mt as T.MeshStandardMaterial).map?.dispose(); mt.dispose(); });
      });
      extra.forEach((x) => x.dispose());
      dot.dispose(); env.dispose(); pmrem.dispose();
      composer.passes.forEach((p) => (p as { dispose?: () => void }).dispose?.());
      composer.dispose(); renderer.dispose();
      canvas.removeEventListener("webglcontextlost", onContextLost); // our own release is not a loss
      renderer.forceContextLoss();
    },
  };
}
