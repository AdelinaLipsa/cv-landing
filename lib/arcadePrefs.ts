// The arcade remembers HD or Retro, and an optional quality tier (?tier=low|medium|high, for testing).
export type Mode = "hd" | "retro";
export type Store = Pick<Storage, "getItem" | "setItem">;
const MODE = "cv-arcade-mode", TIER = "cv-arcade-tier";

export function getMode(store: Store | null, webgl: boolean): Mode {
  if (!webgl) return "retro";
  try { return store?.getItem(MODE) === "retro" ? "retro" : "hd"; } catch { return "hd"; }
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
  try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; }
}
