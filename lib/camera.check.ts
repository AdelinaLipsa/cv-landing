import test from "node:test";
import assert from "node:assert/strict";
import { frame, holePath } from "./camera.ts";

const view = { w: 1440, h: 900 }, safe = { top: 80, bottom: 200 };
test("centres the target in the safe band", () => {
  const { dy } = frame({ x: 100, y: 700, w: 400, h: 100 }, view, safe, 1.25);
  assert.equal(dy, 700 + 50 - (80 + (900 - 80 - 200) / 2));
});
test("small targets zoom to the cap, tall ones not at all", () => {
  assert.equal(frame({ x: 0, y: 0, w: 200, h: 80 }, view, safe, 1.25).s, 1.25);
  assert.equal(frame({ x: 0, y: 0, w: 1200, h: 800 }, view, safe, 1.25).s, 1);
});
test("hole path: evenodd, viewport first", () => assert.match(holePath(view, { x: 10, y: 10, w: 100, h: 50 }, 16, 8), /^evenodd, M0 0H1440V900H0Z M/));
