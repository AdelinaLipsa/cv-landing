import { test } from "node:test";
import assert from "node:assert/strict";
import { getMode, setMode, getTierOverride } from "./arcadePrefs.ts";

const fake = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };
const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };

test("Retro by default", () => assert.equal(getMode(fake(), true), "retro"));
test("remembers HD", () => { const s = fake(); setMode(s, "hd"); assert.equal(getMode(s, true), "hd"); });
test("no WebGL 2 means Retro, whatever was saved", () => { const s = fake(); setMode(s, "hd"); assert.equal(getMode(s, false), "retro"); });
test("blocked storage falls back to Retro and never throws", () => {
  assert.equal(getMode(broken, true), "retro");
  assert.doesNotThrow(() => setMode(broken, "retro"));
  assert.equal(getTierOverride(broken), null);
});
test("no storage at all is fine", () => assert.equal(getMode(null, true), "retro"));
test("tier override comes from ?tier= first, then storage", () => {
  const s = fake(); s.setItem("cv-arcade-tier", "medium");
  assert.equal(getTierOverride(s), "medium");
  assert.equal(getTierOverride(s, "?tier=low"), "low");
});
