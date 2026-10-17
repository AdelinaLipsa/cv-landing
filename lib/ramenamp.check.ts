import { test } from "node:test";
import assert from "node:assert/strict";
import { ampScale, bandEdges, bands, glyph, W } from "./ramenamp.ts";

test("the skin scales by whole device pixels and never past the room it has", () => {
  for (const [css, dpr, want] of [[560, 2, 2], [560, 1, 2], [374, 3, 4 / 3], [200, 1, 1], [374, 2, 1]] as const) {
    const k = ampScale(css, dpr);
    assert.equal(k, want);
    assert.ok(W * k <= Math.max(css, W));
    assert.equal(Number.isInteger(Math.round(k * dpr * 1e6) / 1e6), true);
  }
});
test("19 log-spaced bars cover bins 0 to 32, every bar at least one bin", () => {
  const e = bandEdges();
  assert.equal(e.length, 20);
  assert.equal(e[0], 0);
  assert.equal(e[19], 32);
  for (let i = 1; i < e.length; i++) assert.ok(e[i] > e[i - 1]);
  const out = bands(new Uint8Array(128).fill(255), e, new Array(19).fill(0));
  assert.ok(out.every((v) => v === 1));
});
test("every glyph is 4 x 5, and unknown characters are blank", () => {
  for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.:()*/%',!?&+ ") {
    const g = glyph(ch);
    assert.equal(g.length, 5, ch);
    assert.ok(g.every((r) => r.length === 4), ch);
  }
  assert.deepEqual(glyph("ș"), glyph(" "));
});
