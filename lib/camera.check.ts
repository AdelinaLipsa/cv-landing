import test from "node:test";
import assert from "node:assert/strict";
import { frame, holePath } from "./camera.ts";

const view = { w: 1440, h: 900 }, safe = { top: 80, bottom: 200 };
test("centres the target in the safe band", () => {
  const { dy } = frame({ x: 100, y: 700, w: 400, h: 100 }, view, safe, 1.25);
  assert.equal(dy, 700 + 50 - (80 + (900 - 80 - 200) / 2));
});
test("small targets zoom to the cap, wide ones not at all", () => {
  assert.equal(frame({ x: 0, y: 0, w: 200, h: 80 }, view, safe, 1.25).s, 1.25);
  assert.equal(frame({ x: 0, y: 0, w: 1300, h: 400 }, view, safe, 1.25).s, 1);
});
test("a subject taller than the band zooms out to fit it, centred", () => {
  const f = frame({ x: 0, y: 100, w: 600, h: 640 }, view, safe, 1.25); // band 620, fits at (620 - 28) / 640
  assert.ok(f.s < 1 && f.s >= 0.85);
  assert.equal(f.s, 592 / 640);
  assert.equal(f.cy, 80 + 310);
});
test("past 0.85 a tall subject sits at the top of the band", () => {
  const f = frame({ x: 0, y: 100, w: 600, h: 1000 }, view, safe, 1.25);
  assert.equal(f.s, 0.85);
  assert.equal(f.cy, 80 + 14 + 0.85 * 500);
  assert.equal(f.dy, 100 + 500 - f.cy);
});
test("hole path: evenodd, viewport first", () => assert.match(holePath(view, { x: 10, y: 10, w: 100, h: 50 }, 16, 8), /^evenodd, M0 0H1440V900H0Z M/));
test("a tiny target clamps the corner radius to half the inner box", () => assert.match(holePath(view, { x: 100, y: 100, w: 2, h: 2 }, 18, 14), /A15 15 0 0 1 .*A15 15 0 0 1 .*A15 15 0 0 1 .*A15 15 0 0 1/));
