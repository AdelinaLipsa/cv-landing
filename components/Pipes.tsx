"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

// The 3D Pipes screen saver: shiny pipes grow through a grid, one segment at a time, turning at ball joints,
// until the screen is full, then it clears and starts over. Loaded only when the saver starts.
const N = 12; // grid cells per side
const R = 0.27; // pipe radius
const COLORS = [0xd62828, 0x2a9d3a, 0x1f5fd6, 0xf2c200, 0x1fb5c9, 0xc43bd1, 0xe6e6e6, 0xf07a1a];
const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]] as const;

export default function Pipes() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
    camera.position.set(0, 0, 17);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(6, 9, 12);
    scene.add(sun);

    const world = new THREE.Group();
    world.rotation.set(0.35, -0.5, 0);
    scene.add(world);
    const tube = new THREE.CylinderGeometry(R, R, 1, 16);
    const ball = new THREE.SphereGeometry(R * 1.45, 18, 14);
    const mats = COLORS.map((color) => new THREE.MeshPhongMaterial({ color, shininess: 90, specular: 0x888888 }));

    const taken = new Set<string>();
    const key = (p: number[]) => p.join(",");
    const at = (p: number[]) => new THREE.Vector3(p[0] - N / 2 + 0.5, p[1] - N / 2 + 0.5, p[2] - N / 2 + 0.5);
    const free = (p: number[]) => p.every((v) => v >= 0 && v < N) && !taken.has(key(p));
    let pos: number[] = [], dir = -1, mat = mats[0], pipes = 0, pieces = 0;

    const joint = (p: number[]) => { const m = new THREE.Mesh(ball, mat); m.position.copy(at(p)); world.add(m); };
    const startPipe = () => {
      for (let tries = 0; tries < 50; tries++) {
        const p = [0, 0, 0].map(() => Math.floor(Math.random() * N));
        if (!free(p)) continue;
        pos = p; dir = -1; mat = mats[pipes % mats.length]; pipes++;
        taken.add(key(p)); joint(p);
        return true;
      }
      return false;
    };
    const clear = () => {
      world.clear(); taken.clear(); pipes = 0; pieces = 0;
      world.rotation.set(0.2 + Math.random() * 0.4, Math.random() * Math.PI * 2, 0);
    };
    // One segment: mostly straight on, sometimes a turn; a dead end ends the pipe and the next one starts elsewhere.
    const grow = () => {
      if (pipes === 0 || pieces > 700 || (dir === -2 && pipes >= 7)) { if (pipes) clear(); startPipe(); return; }
      if (dir === -2) { if (!startPipe()) clear(); return; }
      const options = DIRS.map((d, i) => ({ i, p: pos.map((v, k) => v + d[k]) })).filter((o) => free(o.p));
      if (!options.length) { joint(pos); dir = -2; return; }
      const straight = options.find((o) => o.i === dir);
      const next = straight && Math.random() < 0.78 ? straight : options[Math.floor(Math.random() * options.length)];
      if (dir >= 0 && next.i !== dir) joint(pos);
      const a = at(pos), b = at(next.p);
      const m = new THREE.Mesh(tube, mat);
      m.position.copy(a).add(b).multiplyScalar(0.5);
      if (next.i < 2) m.rotation.z = Math.PI / 2;
      else if (next.i > 3) m.rotation.x = Math.PI / 2;
      world.add(m);
      taken.add(key(next.p));
      pos = next.p; dir = next.i; pieces++;
    };

    let raf = 0, last = 0;
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (t - last > 2000) last = t - 28; // back from a hidden tab: carry on, don't fast-forward
      const due = Math.min(12, Math.floor((t - last) / 28)); // catch up after a slow or throttled frame, a little at a time
      if (!due) return;
      last = last ? last + due * 28 : t;
      for (let k = 0; k < due; k++) grow();
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);
    const resize = () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      tube.dispose(); ball.dispose(); mats.forEach((m) => m.dispose());
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={host} style={{ position: "absolute", inset: 0, zIndex: 9500, cursor: "none" }} aria-label="Screen saver: 3D pipes. Move the mouse to wake the computer." role="img" />;
}
