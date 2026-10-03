// The arcade remembers HD or Retro (Retro by default), and an optional quality tier (?tier=low|medium|high, for testing).
export type Mode = "hd" | "retro";
export type Store = Pick<Storage, "getItem" | "setItem">;
const MODE = "cv-arcade-mode-v2", TIER = "cv-arcade-tier";

export function getMode(store: Store | null, webgl: boolean): Mode {
  if (!webgl) return "retro";
  try { return store?.getItem(MODE) === "hd" ? "hd" : "retro"; } catch { return "retro"; }
}
export function setMode(store: Store | null, m: Mode) {
  try { store?.setItem(MODE, m); } catch { }
}
export function getTierOverride(store: Store | null, search = typeof location === "undefined" ? "" : location.search): string | null {
  const q = new URLSearchParams(search).get("tier");
  if (q) return q;
  try { return store?.getItem(TIER) ?? null; } catch { return null; }
}
export function hasWebGL2() {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext(); // release the probe
    return !!gl;
  } catch { return false; }
}
