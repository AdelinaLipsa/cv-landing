// What the arcade's 3D views share (lib/space3d, lib/shipit3d, lib/fighter3d): a renderer with reflections,
// bloom that only catches lights hotter than white, a perspective camera that frames a W × H game grid
// exactly at z = 0 (so hitboxes stay where you see them), and additive sparks.
import type * as T from "three";

export const FOV = 30;

export async function stage(canvas: HTMLCanvasElement, W: number, H: number, opts: { bloom?: [number, number, number]; shadows?: boolean; env?: number } = {}) {
  const [THREE, { RoomEnvironment }, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
    import("three"),
    import("three/examples/jsm/environments/RoomEnvironment.js"),
    import("three/examples/jsm/postprocessing/EffectComposer.js"),
    import("three/examples/jsm/postprocessing/RenderPass.js"),
    import("three/examples/jsm/postprocessing/UnrealBloomPass.js"),
    import("three/examples/jsm/postprocessing/OutputPass.js"),
  ]);
  // Phones: fewer pixels, no antialias, no shadows.
  const touch = matchMedia("(pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !touch, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const shadows = !!opts.shadows && !touch;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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
  const fit = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
  };
  fit();
  const ro = new ResizeObserver(fit);
  ro.observe(canvas);

  return {
    THREE, renderer, scene, camera, D, touch, shadows, hot, glowMat, dot, sparks,
    render: () => composer.render(),
    dispose(...extra: { dispose(): void }[]) {
      ro.disconnect();
      scene.traverse((o) => {
        const m = o as T.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((mt) => { (mt as T.MeshStandardMaterial).map?.dispose(); mt.dispose(); });
      });
      extra.forEach((x) => x.dispose());
      dot.dispose(); env.dispose(); pmrem.dispose(); composer.dispose(); renderer.dispose();
    },
  };
}
