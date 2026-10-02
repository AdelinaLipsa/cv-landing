// The ramen storm: food falls with real-ish physics, bounces, piles up at the bottom of the screen.
// Tap or click a piece to slurp it (sparks, a pop). After ~9s it all fades and you get your slurp count.
// Clicks that miss the food go through to the page as usual.
import { sfx } from "./sfx";
import { toast } from "./achievements";

const FOOD = ["🍜", "🍜", "🍜", "🍥", "🥢", "🥚", "🐟", "🍜"];
type Item = { x: number; y: number; vx: number; vy: number; r: number; vr: number; size: number; e: string; gone: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };

let running = false;

export function ramenStorm(count = 42) {
  if (running) return 0;
  running = true;
  const dpr = Math.min(devicePixelRatio, 2);
  const c = document.createElement("canvas");
  Object.assign(c.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh", zIndex: "60", pointerEvents: "none" });
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  document.body.appendChild(c);
  const ctx = c.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const W = innerWidth, H = innerHeight;
  const items: Item[] = Array.from({ length: count }, (_, i) => {
    const size = 26 + Math.random() * 22;
    return { x: Math.random() * W, y: -size - i * 28 - Math.random() * 80, vx: (Math.random() - 0.5) * 120, vy: 0, r: Math.random() * 6, vr: (Math.random() - 0.5) * 8, size, e: FOOD[i % FOOD.length], gone: false };
  });
  let sparks: Spark[] = [];
  let slurped = 0, t = 0, last = performance.now();

  // Slurp: a tap on a piece of food pops it. Capture phase, so we see it before the page does.
  const tap = (e: PointerEvent) => {
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (it.gone || Math.hypot(e.clientX - it.x, e.clientY - it.y) > it.size * 0.6) continue;
      it.gone = true; slurped++;
      for (let k = 0; k < 14; k++) { const a = Math.random() * Math.PI * 2, v = 80 + Math.random() * 160; sparks.push({ x: it.x, y: it.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6, color: ["#F5B53F", "#ff7ac6", "#5fd0ff", "#ffffff"][k % 4] }); }
      sfx.pop();
      e.preventDefault(); e.stopPropagation();
      return;
    }
  };
  document.addEventListener("pointerdown", tap, true);

  const frame = (now: number) => {
    const dt = Math.max(0, Math.min((now - last) / 1000, 0.04));
    last = now; t += dt;
    ctx.clearRect(0, 0, W, H);
    const fade = t > 8 ? Math.max(0, 1 - (t - 8) / 1.2) : 1;
    ctx.globalAlpha = fade;
    for (const it of items) {
      if (it.gone) continue;
      it.vy += 1300 * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.r += it.vr * dt;
      const floor = H - it.size * 0.45;
      if (it.y > floor) { it.y = floor; it.vy *= -0.42; it.vx *= 0.8; it.vr *= 0.7; if (Math.abs(it.vy) < 40) it.vy = 0; } // bounce, settle
      if (it.x < it.size / 2 || it.x > W - it.size / 2) { it.vx *= -0.7; it.x = Math.max(it.size / 2, Math.min(W - it.size / 2, it.x)); }
      ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.r);
      ctx.font = `${it.size}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(it.e, 0, 0);
      ctx.restore();
    }
    sparks = sparks.filter((p) => ((p.x += p.vx * dt), (p.y += p.vy * dt), (p.vy += 500 * dt), (p.life -= dt) > 0));
    for (const p of sparks) { ctx.globalAlpha = fade * Math.min(1, p.life * 2); ctx.fillStyle = p.color; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
    ctx.globalAlpha = 1;
    if (fade > 0) requestAnimationFrame(frame);
    else {
      c.remove(); document.removeEventListener("pointerdown", tap, true); running = false;
      toast(slurped ? { icon: "🍜", title: `You slurped ${slurped} ${slurped === 1 ? "bowl" : "bowls"}.`, body: slurped >= 20 ? "Professional. Respect." : slurped >= 8 ? "Not bad. A raccoon with WiFi would be proud." : "A light snack. There’s always more ramen." } : { icon: "🍜", title: "Ramen storm over.", body: "Psst: you can tap the bowls to slurp them." });
    }
  };
  requestAnimationFrame(frame);
  return count;
}

// The Konami code: flash, a big pixel banner, a fanfare, a page shake, the cat, then the storm.
export function cheatCode() {
  const flash = document.createElement("div");
  Object.assign(flash.style, { position: "fixed", inset: "0", zIndex: "61", background: "#fff", opacity: "0.85", pointerEvents: "none", transition: "opacity 0.5s" });
  const banner = document.createElement("div");
  banner.innerHTML = `<b>CHEAT CODE ACTIVATED</b><span>+30 LIVES · INFINITE RAMEN</span>`;
  Object.assign(banner.style, {
    position: "fixed", left: "50%", top: "38%", zIndex: "62", transform: "translate(-50%, -50%) scale(2.4)", opacity: "0", pointerEvents: "none",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "18px 26px", borderRadius: "14px",
    background: "#07061a", color: "#fff1a8", border: "3px solid #F5B53F", boxShadow: "0 0 0 4px #07061a, 0 0 60px rgba(245,181,63,0.6)",
    font: "800 clamp(18px, 5vw, 34px)/1.1 ui-monospace, monospace", letterSpacing: "0.06em", textAlign: "center",
    transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s",
  });
  (banner.lastElementChild as HTMLElement).style.cssText = "font-size: 0.45em; color: #5fd0ff; letter-spacing: 0.2em";
  document.body.append(flash, banner);
  requestAnimationFrame(() => { flash.style.opacity = "0"; banner.style.opacity = "1"; banner.style.transform = "translate(-50%, -50%) scale(1)"; });
  sfx.power(); setTimeout(sfx.win, 250);
  document.documentElement.animate([{ transform: "translate(0,0)" }, { transform: "translate(-6px,3px)" }, { transform: "translate(5px,-4px)" }, { transform: "translate(-3px,2px)" }, { transform: "translate(0,0)" }], { duration: 380 });
  window.dispatchEvent(new Event("cv:cat")); // the cat comes running
  setTimeout(() => { banner.style.opacity = "0"; banner.style.transform = "translate(-50%, -50%) scale(0.8)"; }, 2200);
  setTimeout(() => { flash.remove(); banner.remove(); }, 2700);
  setTimeout(() => ramenStorm(56), 500);
}
