import { test } from "node:test";
import assert from "node:assert/strict";
import { heroClip, lookAhead, squash } from "./shipitMotion.ts";

test("standing still is Idle", () => assert.equal(heroClip({ won: false, ground: true, vx: 0 }), "Idle"));
test("moving on the ground is Running", () => assert.equal(heroClip({ won: false, ground: true, vx: -62 }), "Running"));
test("in the air is Jump, whatever the speed", () => assert.equal(heroClip({ won: false, ground: false, vx: 62 }), "Jump"));
test("winning beats everything", () => assert.equal(heroClip({ won: true, ground: false, vx: 62 }), "ThumbsUp"));
test("tiny drift is not running", () => assert.equal(heroClip({ won: false, ground: true, vx: 0.5 }), "Idle"));

test("look-ahead eases toward 16 units in the running direction", () => {
  let x = 0;
  for (let i = 0; i < 120; i++) x = lookAhead(x, 1, 62, 1 / 60, false);
  assert.ok(x > 15 && x <= 16, `got ${x}`);
  for (let i = 0; i < 120; i++) x = lookAhead(x, -1, -62, 1 / 60, false);
  assert.ok(x < -15 && x >= -16, `got ${x}`);
});
test("look-ahead returns to centre when you stop", () => {
  let x = 16;
  for (let i = 0; i < 180; i++) x = lookAhead(x, 1, 0, 1 / 60, false);
  assert.ok(Math.abs(x) < 0.1, `got ${x}`);
});
test("the boss room locks the camera: look-ahead goes to 0", () => {
  let x = 16;
  for (let i = 0; i < 180; i++) x = lookAhead(x, 1, 62, 1 / 60, true);
  assert.ok(Math.abs(x) < 0.1, `got ${x}`);
});
test("a huge dt never overshoots", () => assert.equal(lookAhead(0, 1, 62, 10, false), 16));

test("a hard landing squashes, then springs back", () => {
  let { s, y } = squash(1, true, true, 0, 0);
  assert.equal(y, 0.7);
  for (let i = 0; i < 60; i++) ({ s, y } = squash(s, false, true, 0, 1 / 60));
  assert.ok(y > 0.99, `got ${y}`);
});
test("in the air it stretches with speed, at most 20%", () => {
  assert.equal(squash(1, false, false, 0, 1 / 60).y, 1);
  assert.equal(squash(1, false, false, 450, 1 / 60).y, 1.2);
  assert.ok(squash(1, false, false, -90, 1 / 60).y > 1.09);
});
