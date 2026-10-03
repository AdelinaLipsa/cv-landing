import { test } from "node:test";
import assert from "node:assert/strict";
import { POSES, poseName } from "./fighterMotion.ts";

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
