// The hero room starts first. Every other heavy start (another WebGL context, a big shader) waits until the room is on
// screen and the page has loaded, then gets an idle slice of its own, one per slice: never two in the same frame.
type Job = () => void;
const queue: Job[] = [];
let holds = 0, busy = false;
let ready = typeof document === "undefined" || document.readyState === "complete";
if (!ready) addEventListener("load", () => setTimeout(() => { ready = true; pump(); }, 300), { once: true }); // grace: the room's first look holds by then

const idle = (f: () => void) => (typeof requestIdleCallback === "function" ? requestIdleCallback(f, { timeout: 1500 }) : setTimeout(f, 30));

function pump() {
  if (busy || !ready || holds || !queue.length) return;
  busy = true;
  idle(() => { busy = false; if (!holds) queue.shift()!(); pump(); });
}

/** The hero holds the rest back until it is on screen; call the result to let them start (calling it twice is fine). */
export function hold() {
  holds++;
  let on = true;
  return () => { if (on) { on = false; holds--; pump(); } };
}

/** Run `job` once the hero is in, in an idle slice of its own. Returns a cancel. */
export function afterHero(job: Job) {
  let on = true;
  queue.push(() => { if (on) job(); });
  pump();
  return () => { on = false; };
}
