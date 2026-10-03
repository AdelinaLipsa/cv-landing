// Ship It! as it was: pixel sprites on a riveted fortress, drawn on the 2D layer.
export type Level = { tile: (c: number, r: number) => string; rows: number; cols: number; size: number; arena: number };
export type ShipItFrame = {
  t: number; dt: number; cam: number; shake: number; halloween: boolean;
  p: { x: number; y: number; vx: number; vy: number; ground: boolean; face: number; shot: number; charge: number; won: boolean; visible: boolean; beam: number | null };
  enemies: { x: number; y: number; vx: number; kind: "wheel" | "drone" | "hat"; alive: boolean; open: number }[];
  boss: { x: number; y: number; vy: number; ground: boolean; cool: number; hit: boolean } | null;
  calm: boolean;
  door: boolean;
  health: { x: number; y: number; on: boolean }[];
  shots: { x: number; y: number; vx: number; vy: number; big: boolean; foe: boolean }[];
  sparks: { x: number; y: number; life: number; color: string }[];
  impacts: { x: number; y: number; at: number; vx: number }[];
};
export type ShipItView = { draw: (f: ShipItFrame) => void; dispose: () => void };

export const PAL: Record<string, string> = { b: "#2f6bff", l: "#7fe3ff", s: "#f2c29b", k: "#0b0a1f", w: "#ffffff", g: "#5fd897", m: "#8c94c9", p: "#ff7ac6", a: "#F5B53F", r: "#ff5a5a", y: "#fff1a8" };
// The hero: an armoured robot, helmet and visor, arm cannon out when firing. 12 × 14.
const TOP = ["...kkkkk....", "..kbbbbbk...", ".kbllbbbbk..", ".kbbsssssk..", ".kbsskssk...", ".kbbsssssk..", "..kkbbbbk..."];
const ARMS = ["..kllbbbbk..", ".kllbbbbblk.", ".klkbbbbbkk."];
const CANNON = ["..kllbbbbbbk", ".kllbbbbbbll", ".klkbbbbbbk."];
const LEGS = {
  idle: ["..kbbbbbk...", "..kbbkbbk...", ".kbbk.kbbk..", "kbbbk.kbbbk."],
  run: ["..kbbbbbk...", "..kbbk.kbk..", ".kbbk...kbk.", "kbbk.....kbk"],
  jump: ["..kbbbbbk...", ".kbbk.kbbk..", "kbbk...kbk..", "kk......kk.."],
};
const hero = (legs: keyof typeof LEGS, firing: boolean) => [...TOP, ...(firing ? CANNON : ARMS), ...LEGS[legs]];
// Wheel-bots roll the floor, drones chase you, hard-hats hide under their helmets and pop up to fire.
const WHEEL = [["..kkkk..", ".krrrrk.", "krwkrrrk", "krrrrrrk", ".kkkkkk.", "..kmmk..", ".kmkkmk.", "..kkkk.."], ["..kkkk..", ".krrrrk.", "krwkrrrk", "krrrrrrk", ".kkkkkk.", "..kkkk..", ".kmmmmk.", "..kkkk.."]];
const DRONE = [["kkkk.kkkk", "....k....", "..kmmmk..", ".kmrwmmk.", ".kmmmmmk.", "..k.k.k.."], [".kk...kk.", "....k....", "..kmmmk..", ".kmrwmmk.", ".kmmmmmk.", "..k.k.k.."]];
const BAT = [["k.......k", "kk.....kk", "kkkpkpkkk", ".kkkkkkk.", "..k...k.."], ["...k.k...", "..kkkkk..", "kkkpkpkkk", "k.kkkkk.k", "..k...k.."]];
const HAT_SHUT = ["...kkkk...", "..kaaaak..", ".kaaaaaak.", "kaaaaaaaak", "kkkkkkkkkk"];
const HAT_OPEN = ["...kkkk...", "..kaaaak..", ".kaaaaaak.", "kkkkkkkkkk", ".kwkkkkwk.", ".kkkkkkkk.", "..kk..kk.."];
// Scope Creep: the boss, a robot with a visor and an antenna. 16 × 16.
const CREEP = [
  "......kk........",
  "......ka........",
  "...kkkkkkkkkk...",
  "..kaaaaaaaaaak..",
  "..kakkkkkkkkak..",
  "..kakwrkkwrkak..",
  "..kakkkkkkkkak..",
  "..kaaaaaaaaaak..",
  ".kkkkaaaaaakkkk.",
  "kaaakaaaaaakaaak",
  "kaaakaaaaaakaaak",
  "kkk.kaaaaaak.kkk",
  "....kakkkkak....",
  "...kaak..kaak...",
  "..kaaak..kaaak..",
  "..kkkkk..kkkkk..",
];

export function retroShipIt(ctx: CanvasRenderingContext2D, W: number, H: number, level: Level): ShipItView {
  const { tile, cols: COLS, size: T, arena: ARENA } = level;
  const sprite = (rows: string[], x: number, y: number, flip = false, tint?: string) => {
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[flip ? row.length - 1 - i : i]; if (ch !== ".") { ctx.fillStyle = tint ?? PAL[ch]; ctx.fillRect(Math.round(x) + i, Math.round(y) + j, 1, 1); } } });
  };
  return {
    draw(f) {
      const { t, cam, p } = f;
      ctx.save();
      if (f.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 4));
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#0b0a24"); sky.addColorStop(1, "#141238");
      ctx.fillStyle = sky; ctx.fillRect(-4, -4, W + 8, H + 8);
      // The fortress wall: panels, pipes, blinking lights, scrolling slower than you.
      const off = (cam * 0.4) % 32;
      for (let i = -1; i < W / 32 + 2; i++) {
        const x = Math.round(i * 32 - off);
        ctx.fillStyle = "#161437"; ctx.fillRect(x, 0, 31, H);
        ctx.fillStyle = "#1f1c4a"; ctx.fillRect(x + 1, 6, 29, 1); ctx.fillRect(x + 1, 58, 29, 1);
        ctx.fillStyle = "#24215a"; ctx.fillRect(x + 22, 0, 4, H);
        ctx.fillStyle = "#2f2b6e"; for (let y = 10; y < H; y += 20) ctx.fillRect(x + 21, y, 6, 2);
        const id = i + Math.floor((cam * 0.4) / 32);
        ctx.fillStyle = (Math.floor(t * 2) + id) % 3 ? "#2a2560" : f.halloween ? (id % 2 ? "#ff8c1a" : "#b46bff") : id % 2 ? "#ff5a5a" : "#5fd897";
        ctx.fillRect(x + 6, 14 + (id % 3) * 14, 2, 2);
      }
      ctx.fillStyle = "#24215a"; ctx.fillRect(0, 34, W, 3);
      ctx.translate(-Math.round(cam), 0);

      const c0 = Math.floor(cam / T), c1 = Math.min(COLS - 1, c0 + W / T + 1);
      for (let r = 0; r < level.rows; r++) for (let c = c0; c <= c1; c++) {
        const tl = tile(c, r), x = c * T, y = r * T;
        if (tl === "#") {
          // Riveted metal block: bevel light top-left, dark bottom-right, a rivet in each corner.
          ctx.fillStyle = "#3a3f7a"; ctx.fillRect(x, y, T, T);
          ctx.fillStyle = "#6d74b8"; ctx.fillRect(x, y, T, 1); ctx.fillRect(x, y, 1, T);
          ctx.fillStyle = "#1f2048"; ctx.fillRect(x, y + T - 1, T, 1); ctx.fillRect(x + T - 1, y, 1, T);
          ctx.fillStyle = "#9aa1dd"; ctx.fillRect(x + 2, y + 2, 1, 1); ctx.fillRect(x + 5, y + 5, 1, 1);
          if (tile(c, r - 1) !== "#") { ctx.fillStyle = "#F5B53F"; ctx.fillRect(x, y, T, 1); } // hazard trim on top
        } else if (tl === "=") {
          // Girder: two rails and a zigzag.
          ctx.fillStyle = "#c46a1c"; ctx.fillRect(x, y, T, 1); ctx.fillRect(x, y + 4, T, 1);
          ctx.fillStyle = "#ff9e3d"; for (let i = 0; i < 4; i++) ctx.fillRect(x + i + (c % 2 ? 0 : 4), y + 1 + (i % 3), 1, 1);
          ctx.fillStyle = "#ffcf8a"; ctx.fillRect(x, y, T, 1);
        } else if (tl === "^") {
          ctx.fillStyle = "#c9cdf0";
          for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) ctx.fillRect(x + i * 4 + j / 2, y + 4 + j, 4 - j, 1);
          ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 1, y + 4, 1, 1); ctx.fillRect(x + 5, y + 4, 1, 1);
        }
      }
      if (f.door) { ctx.fillStyle = "#ff5a5a"; for (let r = 0; r < 13; r++) ctx.fillRect((ARENA - 1) * T + 3, r * T + ((Math.floor(t * 6) + r) % 2) * 4, 2, 4); } // the locked door

      for (const h of f.health) if (h.on) { ctx.fillStyle = Math.floor(t * 4) % 2 ? PAL.p : PAL.w; ctx.fillRect(h.x, h.y + 1, 4, 2); ctx.fillRect(h.x + 1, h.y, 2, 4); }
      const pose = Math.floor(t * 6) % 2;
      for (const e of f.enemies) if (e.alive) {
        if (e.kind === "hat") e.open > 0 ? sprite(HAT_OPEN, e.x, e.y, false) : sprite(HAT_SHUT, e.x, e.y + 2, false);
        else sprite(e.kind === "wheel" ? WHEEL[pose] : f.halloween ? BAT[pose] : DRONE[pose], e.x, e.y, e.vx > 0);
      }
      if (f.boss) sprite(CREEP, f.boss.x, f.boss.y, false, f.boss.hit ? PAL.w : undefined);
      // READY: you beam down from the top of the screen, then appear.
      if (p.beam !== null) { ctx.fillStyle = PAL.l; ctx.fillRect(Math.round(p.x) + 4, Math.round(p.beam) - 12, 2, 12); ctx.fillStyle = PAL.w; ctx.fillRect(Math.round(p.x) + 4, Math.round(p.beam) - 3, 2, 3); }
      else if (p.visible) {
        const legs = !p.ground ? "jump" : Math.abs(p.vx) > 1 && pose ? "run" : "idle";
        sprite(hero(legs, p.shot > 0 || p.charge > 0.2), p.x - 1, p.y, p.face < 0, p.charge > 0.7 && Math.floor(t * 16) % 2 ? PAL.y : undefined); // flashes when charged
      }
      for (const sh of f.shots) {
        if (sh.big) { ctx.fillStyle = PAL.y; ctx.fillRect(Math.round(sh.x), Math.round(sh.y), 6, 6); ctx.fillStyle = PAL.w; ctx.fillRect(Math.round(sh.x) + 1, Math.round(sh.y) + 1, 4, 4); }
        else { ctx.fillStyle = sh.foe ? PAL.r : PAL.y; ctx.fillRect(Math.round(sh.x), Math.round(sh.y), 3, 2); }
      }
      for (const sp of f.sparks) { ctx.globalAlpha = Math.min(1, sp.life * 2); ctx.fillStyle = sp.color; ctx.fillRect(Math.round(sp.x), Math.round(sp.y), 1, 1); }
      ctx.globalAlpha = 1;
      ctx.restore();
    },
    dispose() { },
  };
}
