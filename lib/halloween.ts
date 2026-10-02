// Halloween on the page (the games and the cat dress up on their own, see season.ts).
// In October: a bat flaps across the page now and then; catch one (click or tap) for an achievement.
// All year: type boo and the lights flicker, a ghost rises, and the bats come out.
import { sfx } from "./sfx";
import { toast, unlock } from "./achievements";

const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
let caught = 0;

// One bat, crossing the screen in a wobbly line. Clicks on the bat catch it; the rest of the page clicks as usual.
export function bat(delay = 0) {
  if (calm()) return;
  const el = document.createElement("span");
  el.textContent = "🦇";
  el.setAttribute("aria-hidden", "true");
  const size = 22 + Math.random() * 16, ltr = Math.random() < 0.5;
  Object.assign(el.style, { position: "fixed", left: "0", top: "0", zIndex: "55", fontSize: `${size}px`, lineHeight: "1", padding: "8px", cursor: "pointer", userSelect: "none", touchAction: "manipulation" });
  document.body.append(el);

  const W = innerWidth, y0 = innerHeight * (0.08 + Math.random() * 0.45), amp = 20 + Math.random() * 40;
  const from = ltr ? -60 : W + 20, to = ltr ? W + 20 : -60;
  const path = Array.from({ length: 9 }, (_, i) => {
    const k = i / 8;
    return { transform: `translate(${from + (to - from) * k}px, ${y0 + Math.sin(k * Math.PI * 3) * amp}px) scaleX(${ltr ? -1 : 1})` };
  });
  const fly = el.animate(path, { duration: 6500 + Math.random() * 3500, delay, easing: "linear", fill: "both" });
  const flap = el.animate([{ scale: "1 1" }, { scale: "1 0.55" }, { scale: "1 1" }], { duration: 220, iterations: Infinity });
  fly.onfinish = () => el.remove();

  el.addEventListener("pointerdown", (e) => {
    e.preventDefault(); e.stopPropagation();
    fly.pause(); flap.cancel();
    el.textContent = "💨";
    el.style.pointerEvents = "none";
    el.animate([{ opacity: 1, scale: "1" }, { opacity: 0, scale: "1.8" }], { duration: 400, fill: "forwards" }).onfinish = () => el.remove();
    sfx.pop();
    caught++;
    unlock("bat");
    if (caught === 5) toast({ icon: "🦇", title: "Five bats caught", body: "That’s a colony. Batman has questions." });
  });
}

// The ambient bats: a small flock to say hello, then one every 20 to 40 seconds while the tab is visible.
export function bats() {
  document.documentElement.dataset.season = "halloween";
  if (calm()) return () => { delete document.documentElement.dataset.season; };
  const hello = setTimeout(() => { bat(); bat(500); bat(1100); }, 2500);
  let next: ReturnType<typeof setTimeout>;
  const loop = () => { next = setTimeout(() => { if (!document.hidden) bat(); loop(); }, 20000 + Math.random() * 20000); };
  loop();
  return () => { clearTimeout(hello); clearTimeout(next); delete document.documentElement.dataset.season; };
}

// boo: the lights flicker, a ghost rises from the bottom of the screen, bats scatter.
let booing = false;
export function boo() {
  unlock("boo");
  if (calm()) { toast({ icon: "👻", title: "Boo.", body: "A gentle one, since you prefer less motion." }); return; }
  if (booing) return;
  booing = true;
  const dark = document.createElement("div");
  Object.assign(dark.style, { position: "fixed", inset: "0", zIndex: "63", background: "#000", opacity: "0", pointerEvents: "none" });
  const ghost = document.createElement("div");
  ghost.innerHTML = `<span style="font-size: clamp(90px, 22vw, 180px); line-height: 1">👻</span><b>BOO!</b>`;
  Object.assign(ghost.style, {
    position: "fixed", left: "50%", top: "50%", zIndex: "64", pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center",
    font: "900 clamp(28px, 7vw, 56px)/1 ui-monospace, monospace", color: "#fff", textShadow: "0 0 30px #b46bff, 0 0 60px #ff8c1a", letterSpacing: "0.1em",
  });
  document.body.append(dark, ghost);
  sfx.lose();
  dark.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.08 }, { opacity: 0.2, offset: 0.14 }, { opacity: 0.85, offset: 0.2 }, { opacity: 0.35, offset: 0.26 }, { opacity: 0.8, offset: 0.32 }, { opacity: 0.8, offset: 0.8 }, { opacity: 0 }], { duration: 2800, fill: "forwards" });
  ghost.animate([
    { transform: "translate(-50%, 60vh) scale(0.6)", opacity: 0, easing: "cubic-bezier(0.34, 1.4, 0.64, 1)" },
    { transform: "translate(-50%, -50%) scale(1)", opacity: 1, offset: 0.3 },
    { transform: "translate(-50%, -56%) scale(1.05)", opacity: 1, offset: 0.8, easing: "ease-in" },
    { transform: "translate(-50%, -90%) scale(0.9)", opacity: 0 },
  ], { duration: 2800, fill: "forwards" }).onfinish = () => { dark.remove(); ghost.remove(); booing = false; };
  for (let i = 0; i < 7; i++) bat(600 + i * 140);
}
