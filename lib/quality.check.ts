import { test } from "node:test";
import assert from "node:assert/strict";
import { pickTier, lower, fpsGovernor, TIERS } from "./quality.ts";

const desktop = { touch: false, cores: 10, memoryGB: 16, dpr: 2 };

test("a strong desktop gets high", () => assert.equal(pickTier(desktop), "high"));
test("a phone gets medium", () => assert.equal(pickTier({ ...desktop, touch: true, cores: 6, memoryGB: 6 }), "medium"));
test("few cores or little memory gets low", () => {
  assert.equal(pickTier({ ...desktop, cores: 4 }), "low");
  assert.equal(pickTier({ ...desktop, memoryGB: 4 }), "low");
});
test("unknown memory is not held against the device", () => assert.equal(pickTier({ ...desktop, memoryGB: undefined }), "high"));
test("a saved choice wins; junk is ignored", () => {
  assert.equal(pickTier(desktop, "low"), "low");
  assert.equal(pickTier(desktop, "ultra"), "high");
});
test("lower steps down and stops at low", () => {
  assert.equal(lower("high"), "medium");
  assert.equal(lower("medium"), "low");
  assert.equal(lower("low"), null);
});
test("low never casts shadows; high does", () => {
  assert.equal(TIERS.low.shadows, false);
  assert.equal(TIERS.high.shadows, true);
});
test("the governor drops after a slow window, skipping warm-up frames", () => {
  let drops = 0;
  const tick = fpsGovernor(() => drops++, 60, 45);
  for (let i = 0; i < 30; i++) tick(1); // warm-up: ignored, however slow
  assert.equal(drops, 0);
  for (let i = 0; i < 60; i++) tick(1 / 30); // 30 fps for a full window
  assert.equal(drops, 1);
});
test("the governor stays quiet at 60 fps", () => {
  let drops = 0;
  const tick = fpsGovernor(() => drops++, 60, 45);
  for (let i = 0; i < 600; i++) tick(1 / 60);
  assert.equal(drops, 0);
});
test("after a drop it waits before judging again", () => {
  let drops = 0;
  const tick = fpsGovernor(() => drops++, 60, 45);
  for (let i = 0; i < 30 + 60; i++) tick(1 / 30);
  for (let i = 0; i < 60; i++) tick(1 / 30); // still inside the post-drop grace period
  assert.equal(drops, 1);
});
