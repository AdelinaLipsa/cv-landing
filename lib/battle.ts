// A tiny pixel battle for the retro computer's screen. 160 × 144, Game Boy resolution.
// Homage to Battle Network-style grid battles. The navi is hand-drawn fan art, the virus is original.

export const W = 160;
export const H = 144;

const PAL: Record<string, string> = {
  y: "#F5B53F", // broth
  b: "#2E5BFF", // navi blue
  l: "#9DB0FF",
  k: "#17153A", // ink
  w: "#F7F6FB",
  p: "#EE6E9F", // naruto
  d: "#B8497A",
  n: "#1A2A8A", // navi dark blue
  s: "#F6C9A8", // skin
  c: "#BFE3FF", // highlight
  r: "#E0455E", // emblem
};

// Hand-drawn fan-art MegaMan.EXE in a fighting stance, 20 × 25, drawn pixel by pixel from Adelina's reference.
const NAVI = [
  "......nnnn..........",
  ".....nbbbbn.........",
  "....nbllbbbn........",
  "...nbllbbbbbn.......",
  "...nblbbbbbbbn......",
  "...nbbbnnnnbbn......",
  "...nbbnsssssnn......",
  "...nbnssskssn.......",
  "....nnssssssn.......",
  ".....nnsssnn........",
  "....nnbbnnbbnn......",
  "...nbbllbrrbbbnn....",
  "..nbllbbryrbbbbbnn..",
  "..nbbbbbrrbbnbbllbn.",
  "..nnbbbbbbbnn.nbbcln",
  "...nbbnnnbbn...nbbn.",
  "...nbbbbbbbn....nn..",
  "....nnbbbnn.........",
  "....nbbnnbbn........",
  "...nbbn..nbbn.......",
  "...nbln...nbln......",
  "..nbbln...nbbln.....",
  "..nbbbn....nbbbn....",
  ".nlbbbbn...nlbbbbn..",
  ".nnnnnnn...nnnnnnn..",
];

// Original virus blob, 10 × 9.
const VIRUS = [
  "...pppp...",
  ".pppppppp.",
  "ppwkppwkpp",
  "ppwkppwkpp",
  "pppppppppp",
  "ppdppppdpp",
  ".pdddddpp.",
  ".p.p..p.p.",
  "p..p..p..p",
];

const COLS = 6;
const ROWS = 3;
const PW = 24; // panel width
const PH = 14; // panel height
const GX = (W - COLS * PW) / 2;
const GY = 78;

type Shot = { x: number; row: number; dir: 1 | -1 };

export type Battle = {
  t: number;
  pRow: number;
  pCol: number;
  eRow: number;
  eCol: number;
  pHp: number;
  eHp: number;
  shots: Shot[];
  flash: number;
  banner: number; // frames left to show a banner
  bannerText: string;
};

export function createBattle(): Battle {
  return { t: 0, pRow: 1, pCol: 1, eRow: 1, eCol: 4, pHp: 100, eHp: 80, shots: [], flash: 0, banner: 40, bannerText: "BATTLE START" };
}

const cx = (col: number) => GX + col * PW + PW / 2;
const cy = (row: number) => GY + row * PH + PH / 2;

// Deterministic "random" so the loop is watchable, not chaotic.
const pick = (t: number, n: number) => Math.floor(Math.abs(Math.sin(t * 12.9898) * 43758.5453) % n);

export function step(s: Battle) {
  s.t++;
  if (s.banner > 0) { s.banner--; return; }
  if (s.flash > 0) s.flash--;

  // Player lines up with the virus, then fires.
  if (s.t % 18 === 0 && s.pRow !== s.eRow) s.pRow += Math.sign(s.eRow - s.pRow);
  if (s.t % 30 === 0 && s.pRow === s.eRow) s.shots.push({ x: cx(s.pCol) + 8, row: s.pRow, dir: 1 });

  // Virus hops around its side and lobs a slow shot back.
  if (s.t % 45 === 0) { s.eRow = pick(s.t, ROWS); s.eCol = 3 + pick(s.t + 1, 3); }
  if (s.t % 70 === 0) s.shots.push({ x: cx(s.eCol) - 8, row: s.eRow, dir: -1 });

  for (const sh of s.shots) sh.x += sh.dir * (sh.dir === 1 ? 4 : 2);
  s.shots = s.shots.filter((sh) => {
    if (sh.dir === 1 && sh.row === s.eRow && Math.abs(sh.x - cx(s.eCol)) < 6) { s.eHp = Math.max(0, s.eHp - 10); s.flash = 6; return false; }
    if (sh.dir === -1 && sh.row === s.pRow && Math.abs(sh.x - cx(s.pCol)) < 6) { s.pHp = Math.max(0, s.pHp - 5); return false; }
    return sh.x > 0 && sh.x < W;
  });

  // Dodge incoming shots.
  const incoming = s.shots.find((sh) => sh.dir === -1 && sh.row === s.pRow && sh.x - cx(s.pCol) < 30);
  if (incoming && s.t % 6 === 0) s.pRow = s.pRow === 0 ? 1 : s.pRow - 1;

  if (s.eHp === 0) Object.assign(s, createBattle(), { banner: 50, bannerText: "YOU WIN" });
  else if (s.pHp === 0) Object.assign(s, createBattle(), { banner: 50, bannerText: "TRY AGAIN" });
}

function sprite(ctx: CanvasRenderingContext2D, rows: string[], x: number, y: number, tint?: string) {
  rows.forEach((r, j) => {
    for (let i = 0; i < r.length; i++) {
      const c = r[i];
      if (c === ".") continue;
      ctx.fillStyle = tint ?? PAL[c];
      ctx.fillRect(Math.round(x + i), Math.round(y + j), 1, 1);
    }
  });
}

export function draw(ctx: CanvasRenderingContext2D, s: Battle) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#0B0A22";
  ctx.fillRect(0, 0, W, H);

  // Starfield-ish backdrop
  ctx.fillStyle = "#2A2760";
  for (let i = 0; i < 40; i++) ctx.fillRect((i * 37 + s.t / 4) % W, (i * 23) % 60 + 14, 1, 1);

  // HUD
  ctx.font = "8px monospace";
  ctx.textBaseline = "top";
  ctx.fillStyle = PAL.w;
  ctx.fillText(`${s.pHp}`, 6, 4);
  ctx.fillStyle = PAL.p;
  ctx.fillText(`${s.eHp}`, W - 22, 4);

  // Panels: player side blue, virus side pink
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = GX + c * PW;
      const y = GY + r * PH;
      ctx.fillStyle = c < 3 ? "#26307A" : "#6A2A55";
      ctx.fillRect(x + 1, y + 1, PW - 2, PH - 2);
      ctx.fillStyle = c < 3 ? PAL.b : PAL.p;
      ctx.fillRect(x + 1, y + 1, PW - 2, 2);
    }
  }

  // Characters stand on their panel
  sprite(ctx, NAVI, cx(s.pCol) - 10, cy(s.pRow) - 26);
  sprite(ctx, VIRUS, cx(s.eCol) - 5, cy(s.eRow) - 10, s.flash % 2 ? PAL.w : undefined);

  // Shots
  for (const sh of s.shots) {
    ctx.fillStyle = sh.dir === 1 ? PAL.y : PAL.p;
    ctx.fillRect(Math.round(sh.x) - 2, cy(sh.row) - 7, 4, 2);
  }

  if (s.banner > 0) {
    ctx.fillStyle = "rgba(11,10,34,0.7)";
    ctx.fillRect(0, 44, W, 16);
    ctx.fillStyle = PAL.y;
    ctx.textAlign = "center";
    ctx.fillText(s.bannerText, W / 2, 48);
    ctx.textAlign = "left";
  }

  // Scanlines
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);
}
