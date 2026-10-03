import { test } from "node:test";
import assert from "node:assert/strict";
import { POSES, poseName, lerpPose, limbDir, framing } from "./fighterMotion.ts";

const near = (a: number, b: number, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} vs ${b}`);

test("poseName matches the Retro choice", () => {
  assert.equal(poseName({ act: "walk", low: false, y: 0 }, 0.2), "walk1");
  assert.equal(poseName({ act: "walk", low: false, y: 0 }, 0.0), "walk2");
  assert.equal(poseName({ act: "idle", low: false, y: 0 }, 0.5), "idle");
  assert.equal(poseName({ act: "idle", low: false, y: 0 }, 0.0), "idle2");
  assert.equal(poseName({ act: "punch", low: true, y: 0 }, 0), "lowpunch");
  assert.equal(poseName({ act: "kick", low: false, y: -10 }, 0), "airkick");
  assert.equal(poseName({ act: "kick", low: false, y: 0 }, 0), "kick");
  assert.equal(poseName({ act: "ko", low: false, y: -5 }, 0), "hit");
  assert.equal(poseName({ act: "block", low: false, y: 0 }, 0), "block");
});
test("every name poseName can return has a pose", () => {
  for (const act of ["idle", "walk", "crouch", "jump", "punch", "kick", "special", "hit", "block", "ko", "win"])
    for (const low of [false, true]) for (const y of [0, -8]) for (const t of [0, 0.2, 0.5])
      assert.ok(POSES[poseName({ act, low, y }, t)], `${act} ${low} ${y} ${t}`);
});
test("lerpPose: 0 is a, 1 is b, halfway is the midpoint", () => {
  const a = POSES.idle, b = POSES.punch;
  assert.deepEqual(lerpPose(a, b, 0), a);
  assert.deepEqual(lerpPose(a, b, 1), b);
  near(lerpPose(a, b, 0.5)[0], (a[0] + b[0]) / 2);
  near(lerpPose(a, b, 0.5)[1][1], (a[1][1] + b[1][1]) / 2);
});
test("limbDir: straight down, forward for each facing, Retro's y-down flipped to y-up", () => {
  const [dx, dy] = limbDir(0, 1); near(dx, 0); near(dy, -1);
  const [fx, fy] = limbDir(Math.PI / 2, 1); near(fx, 1); near(fy, 0, 1e-12);
  const [bx] = limbDir(Math.PI / 2, -1); near(bx, -1);
});
test("framing keeps both fighters in view with a margin", () => {
  for (const [a, b] of [[10, 182], [56, 136], [90, 102], [10, 30], [170, 182]]) {
    const { x, zoom } = framing(a, b, 192, 120);
    assert.ok(zoom >= 1 && zoom <= 1.25, `zoom ${zoom}`);
    const half = 192 / zoom / 2;
    assert.ok(Math.min(a, b) >= x - half && Math.max(a, b) <= x + half, `${a},${b} in [${x - half}, ${x + half}]`);
    assert.ok(x - half >= -1e-9 && x + half <= 192 + 1e-9, "never shows past the arena");
  }
});
test("framing keeps the floor at the bottom of the screen", () => {
  const { y, zoom } = framing(90, 102, 192, 120);
  near(y - 120 / zoom / 2, -120); // bottom edge of the view sits on grid row 120
});
