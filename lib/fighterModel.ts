// Sprint Fighter's 3D fighters, modelled in code: The PO in a classic fighting gi (crossed lapels over an open chest,
// sleeves to the elbow, a black belt with hanging tails, the red headband with long tails, red fingerless gloves,
// bare feet), The Stakeholder in a sharp grey suit (lapels, shirt and red tie, cuffs, polished shoes).
// Bodies are lathed from muscle and cloth profiles, not capsules: broad shoulders, tapered waist, forearms
// that narrow to the wrist, calves, wide gi trousers. Joints and lengths match the game's poses exactly:
// hip 13 up, shoulders 8 up the torso, thigh 7, shin 7, upper arm 6, forearm 6. Built facing +x; +z is the near side.
import type * as T from "three";
import type { Look } from "./fighterMotion";

type Three = typeof import("three");
export type Rig = {
  root: T.Group; hips: T.Group; torso: T.Group; head: T.Group; mats: T.MeshPhysicalMaterial[];
  arms: { sh: T.Group; el: T.Group }[]; legs: { hip: T.Group; knee: T.Group }[];
  wave: (t: number, speed: number) => void; // cloth: headband and belt tails
};

export function buildFighter(THREE: Three, look: Look, gi: boolean, shadows: boolean): Rig {
  const V = (x: number, y: number) => new THREE.Vector2(x, y);
  const cloth = (hex: string, rough = 0.85) => new THREE.MeshPhysicalMaterial({ color: hex, roughness: rough, sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color(hex).offsetHSL(0, -0.1, 0.25) });
  const skin = new THREE.MeshPhysicalMaterial({ color: look.skin, roughness: 0.48, sheen: 0.35, sheenColor: new THREE.Color("#ffb4a0") });
  const top = cloth(look.top), sleeve = cloth(look.sleeve), legs = cloth(look.legs);
  const hair = new THREE.MeshPhysicalMaterial({ color: look.hair, roughness: 0.6, sheen: 0.5, sheenColor: new THREE.Color(look.hair).offsetHSL(0, 0, 0.2) });
  const extra = new THREE.MeshPhysicalMaterial({ color: look.extra, roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color(look.extra).offsetHSL(0, 0, 0.2) });
  const dark = new THREE.MeshPhysicalMaterial({ color: gi ? "#111018" : "#1b1a24", roughness: gi ? 0.8 : 0.25, clearcoat: gi ? 0 : 1, clearcoatRoughness: 0.15 });
  const trim = gi ? cloth(new THREE.Color(look.top).offsetHSL(0, 0.05, -0.12).getStyle()) : cloth("#3b3f52");
  const shirt = cloth("#f2f0ea", 0.7);
  const mats = [skin, top, sleeve, legs, hair, extra, trim, dark, shirt]; // everything the hit flash tints

  const mesh = (geo: T.BufferGeometry, mat: T.Material) => { const m = new THREE.Mesh(geo, mat); m.castShadow = shadows; m.receiveShadow = shadows; return m; };
  // A limb segment hanging from its pivot: a lathe profile from the pivot (y = 0) down to -len.
  // Lathe profiles must run bottom to top for outward-facing triangles; limbs are written top-down, so flip those.
  const lathe = (profile: [number, number][], mat: T.Material, depth = 1, seg = 18) => {
    const up = profile[0][1] <= profile[profile.length - 1][1] ? profile : [...profile].reverse();
    const m = mesh(new THREE.LatheGeometry(up.map(([r, y]) => V(r, y)), seg), mat);
    m.scale.set(depth, 1, 1);
    return m;
  };

  const root = new THREE.Group(), hips = new THREE.Group(), torso = new THREE.Group(), head = new THREE.Group();
  hips.position.y = 13; root.add(hips); hips.add(torso);

  // Torso: waist → chest → broad shoulders → neck. Depth (x) shallower than width (z).
  const torsoProfile: [number, number][] = gi
    ? [[0.01, -2.2], [2.75, -2.2], [2.55, -0.2], [2.7, 2.5], [3.25, 5.2], [3.5, 7.4], [3.2, 8.6], [1.4, 9.5], [0.01, 9.6]]
    : [[0.01, -2.6], [2.9, -2.6], [2.6, -0.4], [2.6, 2.6], [3.1, 5.4], [3.35, 7.6], [3.1, 8.7], [1.3, 9.5], [0.01, 9.6]];
  torso.add(lathe(torsoProfile, top, 0.7, 24));
  // Front details on the +x face (chest depth ≈ 0.7 × radius).
  const front = (w: number, h: number, mat: T.Material, x: number, y: number, tilt: number, z = 0, d = 0.18) => {
    const m = mesh(new THREE.BoxGeometry(d, h, w), mat); m.position.set(x, y, z); m.rotation.x = tilt; torso.add(m); return m;
  };
  if (gi) {
    // The open V of the chest, then the crossed lapels framing it.
    const v = new THREE.Shape([V(-1.5, 0), V(1.5, 0), V(0, -4.2)]);
    const chest = mesh(new THREE.ExtrudeGeometry(v, { depth: 0.12, bevelEnabled: false }), skin);
    chest.rotation.y = Math.PI / 2; chest.position.set(2.32, 8.3, 0); torso.add(chest);
    front(0.7, 6.4, trim, 2.42, 6.3, 0.36, 0.95, 0.22);
    front(0.7, 6.4, trim, 2.46, 6.1, -0.36, -0.95, 0.22);
    // The belt, its knot and two tails that sway.
    const belt = mesh(new THREE.TorusGeometry(2.62, 0.42, 6, 28), dark); belt.rotation.x = Math.PI / 2; belt.scale.set(0.72, 1, 1); belt.position.y = 0.1; torso.add(belt);
    front(1.3, 0.9, dark, 2.05, 0.1, 0, 0, 0.6);
  } else {
    // Shirt, tie, and lapels of the jacket; two buttons.
    const v = new THREE.Shape([V(-1.2, 0), V(1.2, 0), V(0, -4.8)]);
    const s = mesh(new THREE.ExtrudeGeometry(v, { depth: 0.12, bevelEnabled: false }), shirt);
    s.rotation.y = Math.PI / 2; s.position.set(2.26, 8.4, 0); torso.add(s);
    const tie = mesh(new THREE.ExtrudeGeometry(new THREE.Shape([V(-0.32, 0), V(0.32, 0), V(0.55, -3.6), V(0, -4.4), V(-0.55, -3.6)]), { depth: 0.14, bevelEnabled: false }), extra);
    tie.rotation.y = Math.PI / 2; tie.position.set(2.4, 8.2, 0); torso.add(tie);
    front(0.8, 5.6, trim, 2.4, 6.6, 0.3, 0.85, 0.24);
    front(0.8, 5.6, trim, 2.44, 6.4, -0.3, -0.85, 0.24);
    for (const y of [3.2, 1.6]) { const b = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.15, 10), dark); b.rotation.z = Math.PI / 2; b.position.set(1.95, y, -0.35); torso.add(b); }
  }
  const neck = mesh(new THREE.CylinderGeometry(0.95, 1.15, 1.6, 12), skin); neck.position.y = 10; torso.add(neck);

  // Head: a squared jaw under a smaller cranium, brow, nose, ears; hair and headband.
  head.position.y = 12.3; head.scale.setScalar(1.12); torso.add(head);
  head.add(lathe([[0.01, -2.3], [1.35, -2.2], [1.85, -1.2], [2.0, 0.4], [1.85, 1.6], [1.2, 2.3], [0.01, 2.45]], skin, 0.95, 20));
  const jaw = mesh(new THREE.BoxGeometry(2.4, 1.5, 2.6), skin); jaw.position.set(0.45, -1.35, 0); head.add(jaw);
  const nose = mesh(new THREE.ConeGeometry(0.3, 0.75, 4), skin); nose.rotation.z = -Math.PI / 2; nose.position.set(1.95, -0.25, 0); head.add(nose);
  const brow = mesh(new THREE.BoxGeometry(0.5, 0.42, 3.2), hair); brow.position.set(1.75, 0.75, 0); brow.rotation.z = -0.12; head.add(brow);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x15131f });
  for (const z of [0.8, -0.8]) { const e = mesh(new THREE.BoxGeometry(0.2, 0.32, 0.5), eyeMat); e.position.set(1.86, 0.25, z); head.add(e); }
  for (const z of [1.95, -1.95]) { const ear = mesh(new THREE.SphereGeometry(0.5, 8, 6), skin); ear.scale.set(0.7, 1, 0.45); ear.position.set(-0.1, 0, z); head.add(ear); }
  if (gi) {
    // Spiky dark hair: a cap and a crown of swept spikes.
    const cap = mesh(new THREE.SphereGeometry(2.08, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.1), hair); cap.position.y = 0.55; head.add(cap);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2, s = mesh(new THREE.ConeGeometry(0.62, 2.1, 4), hair);
      s.position.set(Math.cos(a) * 1.3 - 0.4, 2.25, Math.sin(a) * 1.3); s.rotation.set(Math.sin(a) * 0.6, 0, Math.cos(a) * 0.5 + 0.5); head.add(s);
    }
  } else {
    // Slicked-back grey hair with a side part.
    const cap = mesh(new THREE.SphereGeometry(2.1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.3), hair); cap.position.set(-0.2, 0.5, 0); cap.scale.set(1.08, 0.9, 1); head.add(cap);
    const back = mesh(new THREE.BoxGeometry(1.4, 2.4, 3.6), hair); back.position.set(-1.6, 0.2, 0); head.add(back);
  }
  // The headband (gi) with two long tails that stream behind.
  const tails: T.Group[] = [];
  if (gi) {
    const band = mesh(new THREE.TorusGeometry(2.02, 0.32, 6, 28), extra); band.rotation.x = Math.PI / 2; band.scale.set(0.96, 1, 1); band.position.y = 0.95; head.add(band);
    for (const z of [0.35, -0.35]) {
      let parent: T.Object3D = head;
      const first = new THREE.Group(); first.position.set(-2.0, 0.95, z); head.add(first); parent = first; tails.push(first);
      for (let k = 0; k < 3; k++) {
        const seg = new THREE.Group(); seg.position.set(k === 0 ? 0 : -1.5, 0, 0); parent.add(seg);
        const strip = mesh(new THREE.BoxGeometry(1.6, 0.55, 0.08), extra); strip.position.x = -0.75; seg.add(strip);
        parent = seg; if (k > 0) tails.push(seg);
      }
    }
  }
  // Belt tails, hanging from the knot.
  const beltTails: T.Group[] = [];
  if (gi) for (const z of [0.3, -0.3]) {
    const g = new THREE.Group(); g.position.set(2.2, -0.2, z); torso.add(g); beltTails.push(g);
    const strip = mesh(new THREE.BoxGeometry(0.16, 3.2, 0.7), dark); strip.position.y = -1.6; g.add(strip);
  }

  // Arms: deltoid, sleeve (gi: wide to the elbow; suit: full length), forearm, glove or cuff, fist.
  const arm = (z: number) => {
    const sh = new THREE.Group(); sh.position.set(0, 8, z); torso.add(sh);
    const delt = mesh(new THREE.SphereGeometry(gi ? 1.75 : 1.5, 14, 10), gi ? sleeve : top); delt.scale.set(1.1, 1, 1.05); sh.add(delt);
    sh.add(lathe(gi ? [[0.01, 0], [1.55, -0.2], [1.7, -3.0], [1.95, -5.6], [1.85, -6.2], [0.01, -6.2]] : [[0.01, 0], [1.3, -0.2], [1.25, -3], [1.18, -6.2], [0.01, -6.2]], gi ? sleeve : top, 1, 16));
    const el = new THREE.Group(); el.position.y = -6; sh.add(el);
    // Forearm: broad below the elbow, narrow at the wrist (a muscle, not a tube).
    el.add(lathe(gi ? [[0.01, 0.3], [1.3, 0.2], [1.45, -1.3], [1.08, -3.6], [0.8, -5.0], [0.01, -5.1]] : [[0.01, 0.3], [1.15, 0.2], [1.12, -2.5], [1.0, -4.8], [0.01, -4.9]], gi ? skin : top, 0.9, 16));
    if (!gi) { const cuff = mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.5, 14), shirt); cuff.position.y = -5.0; el.add(cuff); }
    const fist = mesh(new THREE.BoxGeometry(1.8, 1.7, 1.55), skin); fist.position.y = -5.95; el.add(fist);
    if (gi) { const glove = mesh(new THREE.BoxGeometry(1.95, 1.0, 1.7), extra); glove.position.y = -5.55; el.add(glove); const wrap = mesh(new THREE.CylinderGeometry(0.85, 0.8, 0.9, 12), extra); wrap.position.y = -4.85; el.add(wrap); }
    return { sh, el };
  };
  // Legs: gi trousers wide and flaring at the ankle with bare feet; suit trousers straight with polished shoes.
  const leg = (z: number) => {
    const hip = new THREE.Group(); hip.position.set(0, 0, z); hips.add(hip);
    hip.add(lathe(gi ? [[0.01, 0.6], [1.9, 0.4], [1.95, -2.5], [1.7, -7.3], [0.01, -7.3]] : [[0.01, 0.6], [1.6, 0.4], [1.55, -3], [1.35, -7.3], [0.01, -7.3]], legs, 1, 16));
    const knee = new THREE.Group(); knee.position.y = -7; hip.add(knee);
    knee.add(lathe(gi ? [[0.01, 0.3], [1.65, 0.2], [1.75, -2.4], [2.0, -5.6], [2.05, -6.3], [0.01, -6.3]] : [[0.01, 0.3], [1.35, 0.2], [1.3, -3], [1.3, -6.3], [0.01, -6.3]], legs, 1, 16));
    if (gi) {
      const ankle = mesh(new THREE.CylinderGeometry(0.62, 0.7, 1.0, 10), skin); ankle.position.y = -6.6; knee.add(ankle);
      const foot = mesh(new THREE.ExtrudeGeometry(new THREE.Shape([V(-0.9, 0), V(2.6, 0), V(2.9, 0.45), V(1.2, 1.05), V(-0.9, 1.15)]), { depth: 1.5, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.15, bevelSegments: 2 }), skin);
      foot.position.set(0, -7.15, -0.75); knee.add(foot);
    } else {
      const shoe = mesh(new THREE.ExtrudeGeometry(new THREE.Shape([V(-1.0, 0), V(2.7, 0), V(3.0, 0.5), V(1.6, 1.1), V(-1.0, 1.25)]), { depth: 1.55, bevelEnabled: true, bevelSize: 0.18, bevelThickness: 0.18, bevelSegments: 3 }), dark);
      shoe.position.set(0, -7.25, -0.78); knee.add(shoe);
    }
    return { hip, knee };
  };
  const arms = [arm(3.05), arm(-3.05)], legsR = [leg(1.5), leg(-1.5)];

  // Cloth motion: headband tails stream back and ripple; belt tails sway with movement.
  const wave = (t: number, speed: number) => {
    tails.forEach((g, i) => { const k = i % 3; g.rotation.z = (k === 0 ? 0.35 : 0.12) + Math.sin(t * 9 + i * 1.3) * (0.12 + speed * 0.004); g.rotation.y = Math.sin(t * 6 + i) * 0.15; });
    beltTails.forEach((g, i) => { g.rotation.z = Math.sin(t * 4 + i * 2) * 0.12 - speed * 0.003; });
  };
  return { root, hips, torso, head, mats, arms, legs: legsR, wave };
}
