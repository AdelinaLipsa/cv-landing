// Halloween on the page: October's look is CSS plus components/Halloween (pumpkin, candles).
// All year: type boo and the lights flicker and a ghost rises.
import { sfx } from "./sfx";
import { toast, unlock } from "./achievements";

const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// boo: the lights flicker, a ghost rises from the bottom of the screen.
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
}
