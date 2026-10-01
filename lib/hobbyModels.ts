import type * as T from "three";

type Three = typeof import("three");

// Her hobby objects that are built in code, for the 3D room around the retro computer:
// a headless electric guitar with an ocean finish, and an iPad drawing in Procreate.
// Units are the original pixel-ish ones (the guitar is ~210 tall); the caller scales them into its scene.
export function buildHobbies(THREE: Three, reduce: boolean) {
  const mat = (color: number, rough = 0.45, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
  const box = (w: number, h: number, d: number, m: T.Material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  const rounded = (w: number, h: number, r: number, depth: number, m: T.Material) => {
    const sh = new THREE.Shape();
    sh.moveTo(-w / 2 + r, -h / 2);
    sh.lineTo(w / 2 - r, -h / 2); sh.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    sh.lineTo(w / 2, h / 2 - r); sh.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    sh.lineTo(-w / 2 + r, h / 2); sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    sh.lineTo(-w / 2, -h / 2 + r); sh.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelSize: 2, bevelThickness: 2, bevelSegments: 3 });
    g.translate(0, 0, -depth / 2);
    return new THREE.Mesh(g, m);
  };

  // Headless electric guitar with an ocean finish: no headstock (a small cap ends the neck), tuners
  // at the bridge, black hardware, a dark fretboard, two humbuckers. The finish is painted in code.
  const ocean = document.createElement("canvas");
  ocean.width = ocean.height = 256;
  {
    const og = ocean.getContext("2d")!;
    const grad = og.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, "#06203d"); grad.addColorStop(0.45, "#0d5c80"); grad.addColorStop(0.75, "#1aa3b8"); grad.addColorStop(1, "#7fe0e0");
    og.fillStyle = grad; og.fillRect(0, 0, 256, 256);
    og.lineCap = "round";
    for (let k = 0; k < 14; k++) { // wave crests
      og.strokeStyle = `rgba(255,255,255,${0.08 + (k % 3) * 0.06})`;
      og.lineWidth = 1.5 + (k % 4);
      og.beginPath();
      for (let x = -10; x <= 266; x += 4) {
        const y = 12 + k * 18 + Math.sin(x / 22 + k * 1.7) * 6 + Math.sin(x / 9 + k) * 2;
        if (x === -10) og.moveTo(x, y); else og.lineTo(x, y);
      }
      og.stroke();
    }
  }
  const oceanTex = new THREE.CanvasTexture(ocean);
  oceanTex.colorSpace = THREE.SRGBColorSpace;
  oceanTex.wrapS = oceanTex.wrapT = THREE.RepeatWrapping;
  oceanTex.repeat.set(1 / 110, 1 / 120); // extrude UVs are shape coordinates: one tile across the body
  oceanTex.offset.set(0.5, 0.5);

  const guitar = new THREE.Group();
  {
    const body = new THREE.Shape(); // compact, ergonomic headless body
    body.moveTo(-6, -58);
    body.bezierCurveTo(30, -62, 50, -40, 46, -14);
    body.bezierCurveTo(44, 2, 34, 10, 36, 26);
    body.bezierCurveTo(38, 42, 26, 52, 14, 40);
    body.bezierCurveTo(8, 33, 2, 30, -6, 32);
    body.bezierCurveTo(-18, 34, -26, 48, -36, 40);
    body.bezierCurveTo(-46, 30, -38, 14, -40, 0);
    body.bezierCurveTo(-44, -24, -40, -54, -6, -58);
    const bg = new THREE.ExtrudeGeometry(body, { depth: 12, bevelEnabled: true, bevelSize: 3, bevelThickness: 3, bevelSegments: 4 });
    bg.translate(0, 0, -6);
    guitar.add(new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ map: oceanTex, roughness: 0.18, metalness: 0.1 })));
    const hw = mat(0x111114, 0.35, 0.6); // black hardware
    [-24, -2].forEach((y) => { const p = rounded(26, 9, 3, 3, mat(0x17153a, 0.5)); p.position.set(0, y, 10.5); guitar.add(p); });
    const bridge = box(30, 9, 4, hw); bridge.position.set(0, -44, 10.5); guitar.add(bridge);
    for (let k = 0; k < 6; k++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 5, 10), hw); t.position.set(-12.5 + k * 5, -50, 10.5); guitar.add(t); }
    const neck = box(13, 120, 7, mat(0x1c1714, 0.5)); neck.position.set(0, 88, 5); guitar.add(neck);
    [40, 60, 80, 100, 124].forEach((y) => { const d = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 1, 10), mat(0xe8f7f7, 0.3)); d.rotation.x = Math.PI / 2; d.position.set(0, y, 8.8); guitar.add(d); });
    const cap = rounded(16, 9, 3, 7, hw); cap.position.set(0, 151, 5); guitar.add(cap);
    for (let k = 0; k < 6; k++) { const st = box(0.7, 196, 0.7, mat(0xd9e6ea, 0.2, 0.9)); st.position.set(-4.5 + k * 1.8, 50, 10.5); guitar.add(st); }
    [[22, -34], [26, -16]].forEach(([x, y]) => { const kn = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 4, 16), hw); kn.rotation.x = Math.PI / 2; kn.position.set(x, y, 11); guitar.add(kn); });
    guitar.scale.setScalar(0.9);
  }

  // iPad: dark aluminium slab, a Procreate canvas drawing itself, and an Apple Pencil following the stroke.
  const ipad = new THREE.Group();
  const paint = document.createElement("canvas");
  paint.width = 360; paint.height = 480;
  const pg = paint.getContext("2d")!;
  const tex = new THREE.CanvasTexture(paint);
  tex.colorSpace = THREE.SRGBColorSpace;
  const curve = (t: number) => ({ x: 60 + 240 * t, y: 300 - 110 * Math.sin(t * Math.PI * 1.6) * (0.6 + 0.4 * t) }); // the stroke, in canvas px
  const drawPaint = (t: number) => {
    pg.fillStyle = "#fbfaf7"; pg.fillRect(0, 0, 360, 480);
    pg.fillStyle = "#2b2b30"; pg.fillRect(0, 0, 360, 34); // Procreate's top bar
    ["#9a9aa3", "#9a9aa3", "#9a9aa3"].forEach((c, i) => { pg.fillStyle = c; pg.beginPath(); pg.arc(20 + i * 22, 17, 5, 0, Math.PI * 2); pg.fill(); });
    pg.fillStyle = "#3355ff"; pg.beginPath(); pg.arc(336, 17, 8, 0, Math.PI * 2); pg.fill(); // the colour dot
    pg.fillStyle = "#2b2b30"; pg.fillRect(6, 150, 12, 90); // the brush size slider
    pg.lineCap = "round"; pg.lineJoin = "round"; pg.strokeStyle = "#3355ff"; pg.lineWidth = 14;
    pg.beginPath();
    for (let k = 0; k <= 60 * t; k++) { const p = curve(k / 60); if (k) pg.lineTo(p.x, p.y); else pg.moveTo(p.x, p.y); }
    pg.stroke();
    tex.needsUpdate = true;
  };
  {
    ipad.add(rounded(120, 160, 12, 6, mat(0x2a2a30, 0.35, 0.6)));
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(108, 144), new THREE.MeshBasicMaterial({ map: tex }));
    screen.position.z = 5.2; ipad.add(screen);
  }
  const pencil = new THREE.Group();
  {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 110, 16), mat(0xf4f4f6, 0.35)); shaft.position.y = 60; pencil.add(shaft);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(3.2, 10, 16), mat(0xdedee4, 0.4)); tip.rotation.x = Math.PI; tip.position.y = 0; pencil.add(tip);
    pencil.rotation.z = -0.55; pencil.rotation.x = 0.6; // leans toward the viewer, so it rests on the glass
    ipad.add(pencil);
  }
  drawPaint(reduce ? 1 : 0);

  // The drawing: the stroke grows, holds, wipes; the pencil tip rides it.
  const update = (t: number) => {
    const d = reduce ? 1 : Math.min(1, (t * 0.35) % 1.4);
    if (!reduce) drawPaint(d);
    const p = curve(d);
    pencil.position.set((p.x / 360 - 0.5) * 108, (0.5 - p.y / 480) * 144, 9);
  };
  update(0);

  const dispose = () => { tex.dispose(); oceanTex.dispose(); };
  return { guitar, ipad, update, dispose };
}
