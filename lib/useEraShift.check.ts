import test from "node:test";
import assert from "node:assert/strict";
import { shiftFor } from "./useEraShift.ts";

test("each era change uses the reveal of the era being left", () => {
  assert.equal(shiftFor(0, 1), "dial");
  assert.equal(shiftFor(1, 0), "undial");
  assert.equal(shiftFor(1, 2), "gloss");
  assert.equal(shiftFor(2, 1), "gloss");
  assert.equal(shiftFor(2, 3), "morph");
  assert.equal(shiftFor(3, 2), "morph");
});
test("jumps across eras morph", () => {
  assert.equal(shiftFor(0, 3), "morph");
  assert.equal(shiftFor(3, 1), "morph");
});
