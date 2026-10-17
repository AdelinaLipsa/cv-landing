import test from "node:test";
import assert from "node:assert/strict";
import { createRain, add, step } from "./rainGlass.ts";

const opts = { w: 400, h: 600, max: 64, rate: 0, minR: 2, maxR: 10, mist: 0, run: true };
const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

test("a heavy drop runs down, leaves a trail, and leaves the glass", () => {
  const s = createRain(opts, seeded());
  const i = add(s, 200, 50, 14);
  let ran = false;
  for (let t = 0; t < 600 && s.alive[i]; t++) { step(s, 1 / 60); ran ||= s.y[i] > 60; }
  assert.ok(ran, "it ran");
  assert.ok(s.trailN >= 3, `trail droplets: ${s.trailN}`);
  for (let t = 0; t < s.trailN; t++) assert.ok(s.trail[t * 3 + 2] < 14 * 0.4, "trail droplets are small");
});

test("a running drop swallows the drop in its path", () => {
  const s = createRain(opts, seeded(7));
  add(s, 200, 50, 14); const small = add(s, 200, 120, 6);
  for (let t = 0; t < 120; t++) step(s, 1 / 60);
  assert.equal(s.alive[small], 0);
});

test("calm: nothing runs", () => {
  const s = createRain({ ...opts, run: false, rate: 30 }, seeded(3));
  add(s, 200, 50, 14);
  for (let t = 0; t < 300; t++) step(s, 1 / 60);
  assert.equal([...s.run].filter(Boolean).length, 0);
});

test("drops that land on each other merge", () => {
  const s = createRain({ ...opts, rate: 0 }, seeded(5));
  const a = add(s, 100, 100, 5);
  s.o.rate = 60; let landed = false;
  for (let t = 0; t < 600 && !landed; t++) { step(s, 1 / 60); landed = s.r[a] > 5.01; }
  assert.ok(landed, "a drop grew by another landing on it");
});
