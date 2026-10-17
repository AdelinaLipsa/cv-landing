"use client";
import { motion, useAnimate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type * as T from "three";
import { ease } from "@/lib/motion";
import { useCalm } from "@/lib/useCalm";
import s from "./Boot.module.css";
import DecryptedText from "./DecryptedText";

// The C64 monitor (public/models/c64-monitor.glb), glTF units, Y up. Its front faces -Z: the glass is a flat square
// (25.88, corners r 0.72) centred at (0, 24.5, 17.86), recessed in stepped bezels behind the body's front face (z 14.2).
// The model is turned 180° so the front faces the camera, which looks straight at the glass's centre: the glass
// projects to a clean square, and the 2003 page is a plain DOM square laid on it.
// Below, z is measured towards the camera from the glass (the body's front face is 3.66 in front of it).
const GLASS = { half: 12.94, cy: 24.5, z: 17.86 }, BODY = { half: 19.74, top: 44.07, z: 3.66 };
const HULL = [[BODY.half, -3.44, 45.28, -46.65, 4.06], [23, -3.44, -3.44, -44, 9]]; // the body, its shadow on the desk: [half x, y0, y1, z0, z1]
const DIST = 160; // camera to glass
const depth = (z: number) => DIST / (DIST - z); // perspective scale at z (1 on the glass)
// The frame the canvas covers: the hull projected onto the glass's plane, centred on the glass horizontally.
const F = (() => {
  let r = 0, bot = Infinity, top = -Infinity;
  for (const [hx, y0, y1, z0, z1] of HULL) for (const y of [y0, y1]) for (const z of [z0, z1]) {
    const k = depth(z), v = (y - GLASS.cy) * k;
    r = Math.max(r, hx * k); bot = Math.min(bot, v); top = Math.max(top, v);
  }
  return { r, top, bot, w: 2 * r, h: top - bot };
})();
const FACE = depth(BODY.z); // the body's front face, where the note is stuck
// The room behind it: a Cycles render of her desk corner from this same camera (art/scripts/boot_plate.py), the C64
// standing in it unseen so only its shadow and the tube's light on the desk are baked. It spans PLATE frame widths
// from the glass's centre (x: each side, top: up, bot: down); keep it in step with PLATE in the script.
const PLATE = { x: 1.75, top: 1.5, bot: 1.21 };
const n = (x: number) => +x.toFixed(5);
const RIG = {
  "--ar": n(F.w / F.h), // the frame's aspect
  "--oy": `${n((F.top / F.h) * 100)}%`, // the glass's centre (horizontally it's the middle)
  "--glass": n((GLASS.half * 2) / F.w), // the glass's side, in frame widths
  "--m": n(FACE / F.w), // one model unit on the bezel, in frame widths
  "--note-x": `${n(((F.r + 7.5 * FACE) / F.w) * 100)}%`, // the note's corner, stuck over the top edge
  "--note-x-phone": `${n(((F.r + 1 * FACE) / F.w) * 100)}%`, // phones start close in: nearer the middle, in shot
  "--note-y": `${n(((F.top - (BODY.top + 1.6 - GLASS.cy) * FACE) / F.h) * 100)}%`,
  "--px": PLATE.x, "--pt": PLATE.top, "--pb": PLATE.bot,
} as React.CSSProperties;
const ready = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.dataset.ready = ""; };
const lit = (img: HTMLImageElement | null) => { if (img?.complete && img.naturalWidth) img.dataset.ready = ""; }; // loaded before hydration: no load event
const BODY_W = (BODY.half * 2 * FACE) / F.w; // the monitor's width, in frame widths: phones pull back until it fits

// The model around the page: loads after first paint and fades in. The screen's light on the plastic goes out with the tube.
async function monitor(el: HTMLDivElement, alive: () => boolean) {
  const [THREE, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
    import("three"), import("three/examples/jsm/loaders/GLTFLoader.js"), import("three/examples/jsm/environments/RoomEnvironment.js"),
  ]);
  if (!alive()) return null;
  const gltf = await new GLTFLoader().loadAsync("/models/c64-monitor.glb"); // the model as authored, untouched
  if (!alive()) return null;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping; // lit as authored: the night is the room around it, not a tint on it
  renderer.toneMappingExposure = 0.7; // untinted, a touch less studio light: it stands in a room lit by the tube and fairy lights
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera();
  const pmrem = new THREE.PMREMGenerator(renderer), env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environment = env;
  gltf.scene.rotation.y = Math.PI; // front to the camera
  gltf.scene.position.set(0, -GLASS.cy, GLASS.z); // the glass's centre at the origin
  scene.add(gltf.scene);
  // A soft contact shadow where it stands on the desk.
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d")!, grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(6,4,18,.85)"); grad.addColorStop(0.6, "rgba(6,4,18,.45)"); grad.addColorStop(1, "rgba(6,4,18,0)");
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(46, 52), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(0, -3.4 - GLASS.cy, -17.5); // under the body
  scene.add(shadow);

  // Neutral studio light (the env above), and a faint cool spill from the tube onto the bezel that goes out with it.
  const tube = new THREE.PointLight("#dfe6ff", 45, 0, 2); tube.position.set(0, 0, 1.5); scene.add(tube);
  const TUBE = tube.intensity;

  camera.position.set(0, 0, DIST);
  const k = 1 / DIST; // the frustum is the frame, through the glass's plane
  camera.projectionMatrix.makePerspective(-F.r * k, F.r * k, F.top * k, F.bot * k, 1, 1000);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  const render = () => renderer.render(scene, camera);
  const fit = () => { renderer.setSize(el.clientWidth, el.clientHeight, false); render(); };
  const ro = new ResizeObserver(fit); ro.observe(el);
  fit();
  el.dataset.ready = "";

  let raf = 0;
  return {
    off() { // the tube's light leaves the plastic as the picture collapses
      const t0 = performance.now();
      const step = (t: number) => { const p = Math.min(1, (t - t0) / 260); tube.intensity = TUBE * (1 - p) ** 2; render(); if (p < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect();
      scene.traverse((o) => {
        const m = o as T.Mesh;
        m.geometry?.dispose();
        if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((mt) => { for (const v of Object.values(mt)) if ((v as T.Texture)?.isTexture) (v as T.Texture).dispose(); mt.dispose(); });
      });
      env.dispose(); renderer.dispose(); renderer.domElement.remove();
    },
  };
}

type Leave = (pull: number) => void; // pull: how long (ms) the pull-back runs once Boot starts unmounting

// The 2003 unbuilt page, on her teenage PC at night. Both buttons switch the CRT off, then the shell pulls back
// from the monitor (Boot's exit, under Shell's AnimatePresence). gate: still on the server's first render.
export default function Boot({ onBuild, onSkip, gate }: { onBuild: Leave; onSkip: Leave; gate?: boolean }) {
  const calm = useCalm();
  const [scope, animate] = useAnimate();
  const cam = useRef<HTMLDivElement>(null), pic = useRef<HTMLDivElement>(null), flash = useRef<HTMLDivElement>(null), dot = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState(0); // set on click: the exit reads it
  const [off, setOff] = useState(false);
  const model = useRef<HTMLDivElement>(null), set = useRef<Awaited<ReturnType<typeof monitor>>>(null);

  useEffect(() => {
    if (document.documentElement.dataset.built) return; // returning visitors, deep links, challenges: Boot is hidden, no model
    let dead = false;
    monitor(model.current!, () => !dead).then((m) => { if (dead) m?.dispose(); else set.current = m; }).catch(() => {}); // no model: the page still works, floating in the dark
    return () => { dead = true; set.current?.dispose(); };
  }, []);

  const leave = async (then: Leave, k: number) => {
    if (pull) return;
    const phone = matchMedia("(max-width: 640px)").matches;
    const ms = Math.round((calm ? 400 : phone ? 600 : 900) * k);
    setPull(ms);
    if (!calm) {
      // Phones start pushed in on the glass: first the camera backs off until the whole monitor is on the desk.
      const c = cam.current!, fit = Math.min(1, (innerWidth - 32) / (c.offsetWidth * BODY_W));
      if (phone && fit < 0.98) await animate(c, { scale: fit }, { duration: 0.6 * k, ease });
      setOff(true);
      set.current?.off();
      // The tube switching off: the picture blows out to white as it squeezes to a line, the line to a dot, the dot fades.
      await animate([
        [flash.current!, { opacity: 1 }, { duration: 0.1 * k, ease: "easeOut" }],
        [pic.current!, { scaleY: 0.004 }, { duration: 0.2 * k, ease: [0.55, 0, 1, 0.45], at: 0 }],
        [pic.current!, { scaleX: 0 }, { duration: 0.12 * k, ease: [0.55, 0, 1, 0.45] }],
        [dot.current!, { opacity: [0, 1, 0], scale: [1, 1.3, 0] }, { duration: 0.16 * k, ease: "easeIn", at: "-0.04" }],
      ]);
    } else await new Promise(requestAnimationFrame); // let the pull render before Shell unmounts Boot: the exit reads it
    then(ms);
  };

  const t = { duration: pull / 1000, ease };
  return (
    <motion.div ref={scope} className={`${s.room} ${gate ? "gate-boot" : ""}`} style={RIG} data-off={off || undefined} exit={calm ? { opacity: 0, transition: t } : undefined}>
      <motion.div className={s.night} aria-hidden="true" exit={calm ? undefined : { opacity: 0, transition: t }} />

      {/* The camera pulls back: the monitor drops away into the dark while the page comes up around it. */}
      <motion.div className={s.rig} exit={calm ? undefined : { scale: 0.26, y: "-4%", opacity: [1, 1, 0], transition: { ...t, opacity: { ...t, times: [0, 0.55, 1] } } }}>
        <div ref={cam} className={s.cam}>
        {/* Her desk corner at night: a tiny blurred copy paints at once, the render fades in over it; with the tube
            off, the screen's light leaves the desk (the "off" render under it shows through). */}
        <div className={s.plate} aria-hidden="true">
          <img ref={lit} src="/media/boot/room-off.webp" alt="" fetchPriority="low" onLoad={ready} />
          <img ref={lit} className={s.on} src="/media/boot/room-on.webp" alt="" onLoad={ready} />
        </div>
        <div className={s.glow} aria-hidden="true" />
        <div ref={model} className={s.model} aria-hidden="true" />
          <div className={s.screen}>
            <div ref={pic} className={s.pic}>
              <main className={s.boot}>
                <h1 className={s.h1}>
                  {/* The real text reserves the space, so the scramble never reflows the page. */}
                  <span className={s.ghost} aria-hidden="true">This CV doesn’t exist yet.</span>
                  <span className={s.decrypt}><DecryptedText text="This CV doesn’t exist yet." animateOn="hover" sequential revealDirection="start" speed={45} characters="01<>/{}[]#;" encryptedClassName={s.enc} /></span>
                </h1>
                <p>
                  Adelina Lipșa<br />Technical Product Owner<br />Full-stack developer<br />Bucharest, Romania
                </p>
                <div className={s.actions}>
                  <button type="button" className={`${s.button} ${s.build}`} onClick={() => leave(onBuild, 1)}>Watch me build it</button>
                  <button type="button" className={s.button} onClick={() => leave(onSkip, 0.5)}>Skip to the finished CV</button>
                </div>
                <div className={s.boxes} aria-hidden="true">
                  <div className={s.box} style={{ height: 140 }}>[ what I built, and what I own ]</div>
                  <div className={s.pair}>
                    <div className={s.box} style={{ height: 110 }}>[ career ]</div>
                    <div className={s.box} style={{ height: 110 }}>[ skills ]</div>
                  </div>
                  <div className={s.box} style={{ height: 90 }}>[ contact ]</div>
                </div>
                {/* The joke lives on the sticky note now; screen readers still get it here. */}
                <p className={s.sr}>&lt;!-- TODO: make this look like something --&gt;</p>
              </main>
              <div ref={flash} className={s.flash} aria-hidden="true" />
            </div>
            <div ref={dot} className={s.dot} aria-hidden="true" />
            <div className={s.glass} aria-hidden="true" />
          </div>
          <div className={s.note} aria-hidden="true">TODO: make this look like something</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
