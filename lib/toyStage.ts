import type * as T from "three";

// The room every 3D scene on the site lives in: one studio light, one environment, one 90s plastic.
// Off duty's computer was built here first; the ending and the Skills cabinet reuse it so they look like
// they came out of the same room.
// lateEnv: the reflections are made when env() is called, not here (the room's bake doesn't use them; she does).
export async function toyStage(el: HTMLElement, lateEnv = false) {
  const [THREE, { RoomEnvironment }] = await Promise.all([import("three"), import("three/examples/jsm/environments/RoomEnvironment.js")]);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Phones: fewer pixels and no antialias; 3x screens make WebGL the heaviest thing on the page.
  const touch = matchMedia("(pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: !touch, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  // Reflections: a soft studio environment for the plastic and glass to catch. Its room's shaders compile in
  // parallel first (KHR_parallel_shader_compile), so baking it blocks the page for less.
  const pmrem = new THREE.PMREMGenerator(renderer);
  let env: T.Texture | null = null, envP: Promise<void> | null = null, disposed = false;
  const makeEnv = () => envP ??= (async () => {
    if (disposed) return;
    const room = new RoomEnvironment(), rt = new THREE.WebGLRenderTarget(1, 1), tm = renderer.toneMapping, was = renderer.getRenderTarget();
    renderer.setRenderTarget(rt); renderer.toneMapping = THREE.NoToneMapping; // as PMREM renders it
    const ready = renderer.compileAsync(room, camera).catch(() => {});
    renderer.setRenderTarget(was); renderer.toneMapping = tm;
    await ready; rt.dispose();
    if (disposed) return;
    env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
  })();
  scene.environmentIntensity = 0.45;
  if (!lateEnv) await makeEnv();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b6d9, 0.5));
  const key = new THREE.DirectionalLight(0xfff4e0, 1.8);
  key.position.set(4, 6, 5);
  scene.add(key);

  // 90s plastic: satin, not matte. A fine moulded grain drives bump and roughness.
  const grainCanvas = document.createElement("canvas");
  grainCanvas.width = grainCanvas.height = 128;
  const g = grainCanvas.getContext("2d")!;
  const img = g.createImageData(128, 128);
  for (let p = 0; p < img.data.length; p += 4) {
    const v = 150 + Math.random() * 70;
    img.data[p] = img.data[p + 1] = img.data[p + 2] = v;
    img.data[p + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const grain = new THREE.CanvasTexture(grainCanvas);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(6, 6);

  const plastic = (color: number, roughness: number) =>
    new THREE.MeshPhysicalMaterial({
      color, roughness, roughnessMap: grain, bumpMap: grain, bumpScale: 0.6,
      clearcoat: 0.35, clearcoatRoughness: 0.35, sheen: 0.3, sheenRoughness: 0.6, envMapIntensity: 0.9,
    });
  const box = (w: number, h: number, d: number, m: T.Material, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    return mesh;
  };

  // A soft contact shadow: a radial gradient on the floor, cheaper than real shadows and softer.
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 64;
  const sg = shadowCanvas.getContext("2d")!;
  const grad = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(23,21,58,0.35)");
  grad.addColorStop(1, "rgba(23,21,58,0)");
  sg.fillStyle = grad;
  sg.fillRect(0, 0, 64, 64);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const blob = (radius: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.002;
    return m;
  };

  // Frame a bounding sphere from a fixed direction; re-run on every resize.
  let framed: [T.Sphere, T.Vector3, number] | null = null;
  const aim = () => {
    if (!framed) return;
    const [sphere, view, tight] = framed;
    const { width, height } = el.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    camera.position.copy(sphere.center).addScaledVector(view, (sphere.radius / Math.sin(Math.min(vfov, hfov) / 2)) * tight);
    camera.lookAt(sphere.center);
    camera.updateProjectionMatrix();
  };
  const fit = (sphere: T.Sphere, view: T.Vector3, tight = 0.86) => { framed = [sphere, view.clone().normalize(), tight]; aim(); };
  const ro = new ResizeObserver(() => { aim(); renderer.render(scene, camera); });
  ro.observe(el);

  // The loop only runs while the scene is on screen and the tab is visible. Panes slide by transform,
  // so a scene on another tab reads as off screen and stops too.
  // At most 60 frames a second: a 120 Hz screen would otherwise draw every scene twice as often for no visible gain.
  let raf = 0, visible = false, last = 0, frame: ((t: number, dt: number) => boolean | void) | null = null;
  const tick = (now: number) => {
    raf = 0;
    if (!visible || document.hidden || !frame) { last = 0; return; }
    if (last && now - last < 1000 / 60 - 4) { raf = requestAnimationFrame(tick); return; }
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    if (frame(now / 1000, dt) !== false) renderer.render(scene, camera);
    el.dataset.frames = String(Number(el.dataset.frames ?? 0) + 1); // for the off-screen check in the plan
    raf = requestAnimationFrame(tick);
  };
  const wake = () => { if (!raf && visible && !reduce) raf = requestAnimationFrame(tick); };
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake(); });
  io.observe(el);
  const onVis = () => wake();
  document.addEventListener("visibilitychange", onVis);
  const run = (f: (t: number, dt: number) => boolean | void) => {
    frame = f;
    if (reduce) { f(0, 0); renderer.render(scene, camera); } else wake();
  };

  const dispose = () => {
    disposed = true;
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach((mt) => { (mt as T.MeshStandardMaterial).map?.dispose(); mt.dispose(); }); }
    });
    grain.dispose(); shadowTex.dispose(); env?.dispose(); pmrem.dispose(); renderer.dispose();
    renderer.domElement.remove();
  };

  return { THREE, renderer, scene, camera, reduce, touch, plastic, box, blob, fit, run, dispose, env: makeEnv };
}
export type Toy = Awaited<ReturnType<typeof toyStage>>;
