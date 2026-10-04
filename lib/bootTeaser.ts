// The retro computer's attract mode, drawn on its 160 × 144 screen between battle rounds.
// A rainbow marquee runs along the bottom; then the picture glitches into a tiny Windows 95 desktop where a pixel
// cursor glides over and clicks BOOT ME: it shows what clicking the screen does instead of only saying it.
// `s` is seconds since the screen switched on. Everything is drawn from the clock: no state to keep.
const RAINBOW = ["#ff5a5a", "#F5B53F", "#fff1a8", "#5fd897", "#5fd0ff", "#b46bff", "#ff7ac6"];
const MARQUEE = "★ CLICK THE SCREEN ★ THERE'S A WINDOWS 95 IN HERE ★ ";
export const TEASE_AT = 4.2, TEASE_END = 7.6; // when the desktop takes over, and hands back

// The classic arrow, 7 × 11: k outline, w fill.
const CURSOR = ["k......", "kk.....", "kwk....", "kwwk...", "kwwwk..", "kwwwwk.", "kwwwwwk", "kwwkkkk", "kwk.k..", "kk..kk.", "k....k."];

// Bottom strip: letters scroll left, each one its own colour, bobbing a pixel like an old demo scroller.
export function marquee(ctx: CanvasRenderingContext2D, s: number, W: number, H: number, still = false) {
  ctx.fillStyle = "rgba(7, 6, 26, 0.9)";
  ctx.fillRect(0, H - 13, W, 13);
  ctx.font = "bold 8px monospace";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const cw = 5, total = MARQUEE.length * cw;
  const off = still ? 0 : (s * 34) % total;
  for (let i = 0; i < Math.ceil(W / cw) + MARQUEE.length; i++) {
    const x = i * cw - off;
    if (x < -cw || x > W) continue;
    const ch = MARQUEE[i % MARQUEE.length];
    ctx.fillStyle = RAINBOW[(i + Math.floor(s * 6)) % RAINBOW.length];
    ctx.fillText(ch, x, H - 6 + (still ? 0 : Math.round(Math.sin(s * 8 + i * 0.6))));
  }
}

// Shove horizontal slices sideways and tint some: a bad-signal glitch over whatever is on screen.
function glitch(ctx: CanvasRenderingContext2D, k: number, W: number, H: number) {
  const img = ctx.getImageData(0, 0, W, H);
  ctx.fillStyle = "#07061a";
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 4) {
    const shift = Math.round(Math.sin(y * 12.9 + k * 40) * 18 * k);
    ctx.putImageData(img, shift, 0, 0, y, W, 4);
  }
  ctx.globalAlpha = 0.35 * k;
  for (let y = 0; y < H; y += 9) { ctx.fillStyle = RAINBOW[(y / 9) % RAINBOW.length | 0]; ctx.fillRect(0, y, W, 2); }
  ctx.globalAlpha = 1;
}

// The tiny desktop: teal, a waving four-colour flag, a bevelled BOOT ME button, and the cursor that clicks it.
function desktop(ctx: CanvasRenderingContext2D, s: number, W: number, H: number) {
  ctx.fillStyle = "#008080";
  ctx.fillRect(0, 0, W, H);
  // Waving flag: four panes in 2 × 2 blocks, each column lifted by a sine.
  const fx = 52, fy = 18, cols = 14, rows = 12;
  for (let c = 0; c < cols; c++) {
    const lift = Math.round(Math.sin(s * 6 - c * 0.55) * 2);
    for (let r = 0; r < rows; r++) {
      const left = c < cols / 2, top = r < rows / 2;
      if (c === cols / 2 || r === rows / 2) continue; // the cross between the panes
      ctx.fillStyle = top ? (left ? "#ff3b30" : "#34c759") : left ? "#2f6bff" : "#ffcc00";
      ctx.fillRect(fx + c * 4, fy + r * 4 + lift, 4, 4);
    }
  }
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fff";
  ctx.fillText("Windows 95", W / 2, 70);

  // The cursor glides in from the corner, lands on the button, clicks twice.
  const t = s - TEASE_AT;
  const bx = 44, by = 88, bw = 72, bh = 20;
  const glide = Math.min(1, Math.max(0, (t - 0.5) / 1.1)), ease = 1 - (1 - glide) ** 3;
  const cx = Math.round(150 + (bx + bw * 0.62 - 150) * ease), cy = Math.round(136 + (by + bh * 0.6 - 136) * ease);
  const down = (t > 1.75 && t < 1.9) || (t > 2.05 && t < 2.2); // a double-click
  // Button: grey bevel, pressed in while the cursor clicks; a flash ring on each click.
  ctx.fillStyle = "#c0c0c0"; ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = down ? "#000" : "#fff"; ctx.fillRect(bx, by, bw, 1); ctx.fillRect(bx, by, 1, bh);
  ctx.fillStyle = down ? "#fff" : "#000"; ctx.fillRect(bx, by + bh - 1, bw, 1); ctx.fillRect(bx + bw - 1, by, 1, bh);
  ctx.fillStyle = "#000";
  ctx.font = "bold 10px monospace";
  ctx.textBaseline = "middle";
  ctx.fillText("▶ BOOT ME", bx + bw / 2 + (down ? 1 : 0), by + bh / 2 + (down ? 1 : 0));
  if (down) { ctx.strokeStyle = "#fff1a8"; ctx.lineWidth = 1; ctx.strokeRect(bx - 3, by - 3, bw + 6, bh + 6); }
  for (let y = 0; y < CURSOR.length; y++) for (let x = 0; x < 7; x++) {
    const p = CURSOR[y][x];
    if (p === ".") continue;
    ctx.fillStyle = p === "k" ? "#000" : "#fff";
    ctx.fillRect(cx + x, cy + y, 1, 1);
  }
  ctx.textAlign = "left";
}

// The takeover window: glitch in, the desktop, glitch out. Returns false when it isn't the teaser's turn.
export function teaser(ctx: CanvasRenderingContext2D, s: number, W: number, H: number) {
  if (s < TEASE_AT || s > TEASE_END) return false;
  const into = (s - TEASE_AT) / 0.3, out = (TEASE_END - s) / 0.3;
  desktop(ctx, s, W, H);
  if (into < 1) glitch(ctx, 1 - into, W, H);
  else if (out < 1) glitch(ctx, 1 - out, W, H);
  return true;
}
