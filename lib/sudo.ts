// sudo, typed anywhere (or sudo() in the console): the page takes it personally, and it escalates.
// 1st: shake, a stern banner, an incident report. 2nd: louder, your manager is cc'd. 3rd: the page flips. Then it starts over.
import { sfx } from "./sfx";
import { toast, unlock } from "./achievements";

const STEPS = [
  { title: "Did you just sudo me?", sub: "adelina is not in the sudoers file. This incident will be reported.", toast: { icon: "🚨", title: "Incident reported", body: "To: Adelina. Severity: rude." } },
  { title: "Again?", sub: "Incident #2 filed. Your manager has been cc’d.", toast: { icon: "📎", title: "Incident #2", body: "Escalated to: your manager, their manager, HR." } },
  { title: "Fine. Have it your way.", sub: "Root access granted. Root is upside down.", toast: { icon: "🙃", title: "Privileges revoked", body: "The page has forgiven you. Barely." } },
];

let count = 0, busy = false;

export function sudo() {
  if (busy) return;
  busy = true;
  unlock("sudo");
  const step = STEPS[count++ % STEPS.length];
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  const banner = document.createElement("div");
  banner.innerHTML = `<b></b><span></span>`;
  banner.querySelector("b")!.textContent = step.title;
  banner.querySelector("span")!.textContent = step.sub;
  Object.assign(banner.style, {
    position: "fixed", left: "50%", top: "38%", zIndex: "62", transform: "translate(-50%, -50%) scale(1.6)", opacity: "0", pointerEvents: "none",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "18px 26px", borderRadius: "14px", maxWidth: "min(560px, calc(100vw - 32px))",
    background: "#07061a", color: "#ff8a8f", border: "3px solid #E5484D", boxShadow: "0 0 0 4px #07061a, 0 0 60px rgba(229,72,77,0.55)",
    font: "800 clamp(18px, 5vw, 32px)/1.15 ui-monospace, monospace", textAlign: "center",
    transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s",
  });
  (banner.lastElementChild as HTMLElement).style.cssText = "font-size: 0.48em; font-weight: 500; color: #f4f2ff";
  document.body.append(banner);
  requestAnimationFrame(() => { banner.style.opacity = "1"; banner.style.transform = "translate(-50%, -50%) scale(1)"; });

  const shake = (px: number, ms: number) => root.animate([0, -1, 1, -1, 1, 0].map((d, i) => ({ transform: `translate(${d * px}px, ${i % 2 ? px / 2 : -px / 2}px)` })), { duration: ms });
  let hold = 2400;
  if (step === STEPS[0]) { sfx.hurt(); if (!calm) shake(6, 380); }
  else if (step === STEPS[1]) { sfx.warning(); if (!calm) shake(12, 700); }
  else {
    sfx.lose();
    if (!calm) {
      hold = 3600;
      root.animate([{ transform: "rotate(0)" }, { transform: "rotate(180deg)", offset: 0.15 }, { transform: "rotate(180deg)", offset: 0.85 }, { transform: "rotate(360deg)" }], { duration: 3600, easing: "ease-in-out" });
    }
  }

  setTimeout(() => { banner.style.opacity = "0"; banner.style.transform = "translate(-50%, -50%) scale(0.8)"; }, hold - 400);
  setTimeout(() => { banner.remove(); toast(step.toast); busy = false; }, hold);
}
