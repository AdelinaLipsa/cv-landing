// Sprint Fighter as it was: a pixel rooftop at sunset, the crowd, two fighters made of thick pixel limbs.
// Retro mode, and the fallback when WebGL isn't there or the GPU takes it back.
import { POSES, PO, SH, poseName, type Look } from "../fighterMotion";

type Fighter = { x: number; y: number; face: number; act: string; actT: number; low: boolean; look: Look };
export type FighterFrame = {
  t: number; dt: number; shake: number; pause: number; halloween: boolean; christmas: boolean;
  state: "intro" | "fight" | "ko" | "end"; stateT: number;
  fighters: Fighter[]; // [me, cpu]
  balls: { x: number; y: number; vx: number; mine: boolean; big: boolean }[];
  sparks: { x: number; y: number; life: number; color: string }[];
};
export type FighterView = { draw(f: FighterFrame): void; dispose(): void };

export function retroFighter(ctx: CanvasRenderingContext2D, W: number, H: number, GROUND: number): FighterView {
  let f!: FighterFrame; // the frame being drawn, for the helpers below
  const crowd = Array.from({ length: 34 }, (_, i) => ({ x: i * 6 - 4, h: 5 + ((i * 7) % 4), c: ["#2a1f4f", "#33255e", "#241a45"][i % 3], ph: i * 0.7 }));
  // Draw a fighter from a pose: thick pixel limbs, a head with hair and the look's extra (headband or tie).
    const limb = (x: number, y: number, a: number, len: number, face: number, color: string, th = 2) => {
      ctx.fillStyle = color;
      const ex = x + Math.sin(a) * len * face, ey = y + Math.cos(a) * len;
      for (let i = 0; i <= len; i++) { const k = i / len; ctx.fillRect(Math.round(x + (ex - x) * k - th / 2), Math.round(y + (ey - y) * k - th / 2), th, th); }
      return [ex, ey] as const;
    };
    const draw = (g: Fighter) => {
      const L = g.look, face = g.face;
      const gx = Math.round(g.x), gy = GROUND + Math.round(g.y);
      ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(gx - 7, GROUND, 14, 2); // shadow
      if (g.act === "ko" && g.y === 0) {
        // Flat on the floor, head away from the hit: legs, body, head along one line.
        const d = -face;
        ctx.fillStyle = L.legs; ctx.fillRect(gx + (d > 0 ? -12 : 0), GROUND - 3, 12, 3);
        ctx.fillStyle = L.top; ctx.fillRect(gx + (d > 0 ? 0 : -12), GROUND - 4, 12, 4);
        ctx.fillStyle = L.skin; ctx.fillRect(gx + (d > 0 ? 12 : -17), GROUND - 5, 5, 5);
        return;
      }
      const name = poseName(g, f.t);
      const [lean, fa, ba, fl, bl, drop] = POSES[name] ?? POSES.idle;
      const hip = [gx, gy - 13 + drop] as const;
      if (f.halloween && L === SH) { ctx.fillStyle = "#2a0a1a"; ctx.fillRect(gx - face * 7 - 2, gy - 25 + drop, 6, 22); ctx.fillStyle = "#b8335f"; ctx.fillRect(gx - face * 7 - 2, gy - 25 + drop, 6, 2); } // the cape
      const [bkx, bky] = limb(hip[0], hip[1], bl[0], 7, face, L.legs, 3); limb(bkx, bky, bl[1], 7, face, L.legs, 3);
      const neckX = hip[0] + Math.sin(lean) * 10 * face, neckY = hip[1] - Math.cos(lean) * 10;
      const sh = [hip[0] + Math.sin(lean) * 8 * face, hip[1] - Math.cos(lean) * 8] as const;
      const [bex, bey] = limb(sh[0], sh[1], ba[0], 6, face, L.sleeve); limb(bex, bey, ba[1], 6, face, L.skin);
      // torso
      ctx.fillStyle = L.top;
      for (let i = 0; i <= 10; i++) ctx.fillRect(Math.round(hip[0] + Math.sin(lean) * i * face) - 2, Math.round(hip[1] - Math.cos(lean) * i) - 1, 5, 2);
      if (L === SH) { ctx.fillStyle = "#ffffff"; ctx.fillRect(Math.round(neckX) - 1, Math.round(neckY) + 1, 2, 4); ctx.fillStyle = L.extra; ctx.fillRect(Math.round(neckX), Math.round(neckY) + 2, 1, 5); }
      else { ctx.fillStyle = "#17153a"; ctx.fillRect(Math.round(hip[0]) - 3, Math.round(hip[1]) - 2, 6, 1); } // the belt
      const [fx, fy] = limb(hip[0], hip[1], fl[0], 7, face, L.legs, 3); limb(fx, fy, fl[1], 7, face, L.legs, 3);
      // head
      const hx = Math.round(neckX + Math.sin(lean) * 3 * face), hy = Math.round(neckY - 3);
      ctx.fillStyle = L.skin; ctx.fillRect(hx - 2, hy - 2, 5, 5);
      ctx.fillStyle = L.hair; ctx.fillRect(hx - 3, hy - 3, 6, 2); ctx.fillRect(face > 0 ? hx - 3 : hx + 2, hy - 2, 1, 3);
      if (L === PO) { ctx.fillStyle = L.extra; ctx.fillRect(hx - 3, hy - 1, 6, 1); ctx.fillRect(face > 0 ? hx - 5 : hx + 3, hy - 1 + (Math.floor(f.t * 8) % 2), 2, 1); } // headband tails
      if (L === PO && f.christmas) { ctx.fillStyle = "#ff5a5a"; ctx.fillRect(hx - 3, hy - 6, 6, 3); ctx.fillRect(hx - 3 - face * 2, hy - 7, 3, 2); ctx.fillStyle = "#ffffff"; ctx.fillRect(hx - 3, hy - 3, 6, 1); ctx.fillRect(hx - 4 - face * 3, hy - 7, 2, 2); } // Santa hat
      ctx.fillStyle = "#17153a"; ctx.fillRect(hx + face, hy, 1, 1); // eye
      const [fex, fey] = limb(sh[0], sh[1], fa[0], 6, face, L.sleeve); limb(fex, fey, fa[1], 6, face, L.skin);
      if (g.act === "hit" && Math.floor(f.t * 20) % 2) { ctx.globalAlpha = 0.5; ctx.fillStyle = "#ff5a5a"; ctx.fillRect(gx - 8, gy - 28, 16, 28); ctx.globalAlpha = 1; }
    };
  return {
    draw(frame) {
      f = frame;
      ctx.save();
      if (f.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 3));
      const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
      const spooky = f.halloween;
      sky.addColorStop(0, spooky ? "#07041a" : "#1b1040"); sky.addColorStop(0.55, spooky ? "#3b1a5a" : "#b8335f"); sky.addColorStop(1, spooky ? "#ff8c1a" : "#F5B53F");
      ctx.fillStyle = sky; ctx.fillRect(-4, -4, W + 8, H + 8);
      if (spooky) {
        ctx.fillStyle = "#f3f0d0"; ctx.beginPath(); ctx.arc(W / 2 + 40, 34, 13, 0, Math.PI * 2); ctx.fill(); // full moon
        ctx.fillStyle = "#07041a";
        for (let i = 0; i < 4; i++) { const bx = ((f.t * 18 + i * 53) % (W + 20)) - 10, by = 18 + i * 9 + Math.sin(f.t * 3 + i) * 3, wing = Math.floor(f.t * 8 + i) % 2 ? 2 : -1; ctx.fillRect(Math.round(bx) - 3, Math.round(by + wing), 3, 1); ctx.fillRect(Math.round(bx), Math.round(by), 2, 2); ctx.fillRect(Math.round(bx) + 2, Math.round(by + wing), 3, 1); }
      } else {
        ctx.fillStyle = "#ffd27a"; ctx.beginPath(); ctx.arc(W / 2, 74, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#b8335f"; for (let y = 64; y < 90; y += 4) ctx.fillRect(W / 2 - 18, y, 36, 1); // sun stripes
      }
      ctx.fillStyle = "#2a1640";
      for (let i = 0; i < 16; i++) { const h = 14 + ((i * 37) % 19); ctx.fillRect(i * 13 - 4, 86 - h, 12, h + 4); }
      ctx.fillStyle = "#ffd27a"; for (let i = 0; i < 16; i++) if ((i * 7) % 3 === 0) ctx.fillRect(i * 13 + 1, 76 - ((i * 37) % 19) / 2, 1, 1); // lit windows
      for (const c of crowd) { const bob = Math.round(Math.sin(f.t * 6 + c.ph) * (f.state === "ko" ? 2 : 1)); ctx.fillStyle = c.c; ctx.fillRect(c.x, 92 - c.h + bob, 5, c.h + 4); ctx.fillRect(c.x + 1, 89 - c.h + bob, 3, 3); }
      ctx.fillStyle = "#3a2350"; ctx.fillRect(-4, 94, W + 8, 2); // railing
      ctx.fillStyle = "#4b2f66"; ctx.fillRect(-4, GROUND, W + 8, H - GROUND + 4);
      ctx.fillStyle = "#5c3a7d"; for (let x = -4; x < W; x += 16) ctx.fillRect(x + ((f.t * 0) | 0), GROUND, 1, H - GROUND);
      ctx.fillStyle = "#6e4a92"; ctx.fillRect(-4, GROUND, W + 8, 1);

      for (const g of [f.fighters[1], f.fighters[0]]) draw(g);
      for (const b of f.balls) {
        const r = b.big ? 5 : 3, x = Math.round(b.x), y = b.y;
        ctx.fillStyle = b.mine ? "#5fd0ff" : "#ff7ac6"; ctx.fillRect(x - r, y - r + 1, r * 2, r * 2 - 2); ctx.fillRect(x - r + 1, y - r, r * 2 - 2, r * 2);
        ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 1, y - 1, 2, 2);
        ctx.fillStyle = b.mine ? "#2f6bff" : "#b8335f"; ctx.fillRect(x - Math.sign(b.vx) * (r + 2), y - 1, 2, 2);
      }
      for (const sp of f.sparks) { ctx.globalAlpha = Math.min(1, sp.life * 3); ctx.fillStyle = sp.color; ctx.fillRect(Math.round(sp.x), Math.round(sp.y), 1, 1); }
      ctx.globalAlpha = 1;
      ctx.restore();
    },
    dispose() { },
  };
}
