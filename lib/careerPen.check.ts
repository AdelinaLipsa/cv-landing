import test from "node:test";
import assert from "node:assert/strict";
import { penAt, segments, tipOf } from "./careerPen.ts";

// The real graph: merge, yomali, siterocket, fork, ubisoft, fabelx, innovational, agrocity.
const N = 8, FORK = 4;

test("the tip is the highest built row", () => {
  assert.equal(tipOf([false, false, false, false, false, false, false, false], FORK), -1);
  assert.equal(tipOf([false, false, false, false, false, true, true, true], FORK), 2); // fabelx
  assert.equal(tipOf([true, true, true, true, true, true, true, true], FORK), 7);
});

test("at the fork the pen runs on into the product curve, short of SiteRocket", () => {
  const s = tipOf([false, false, false, true, true, true, true, true], FORK);
  assert.ok(s > FORK && s < FORK + 1);
  assert.equal(Math.floor(s), FORK); // the fork is stamped, SiteRocket not yet
  assert.equal(penAt(s, FORK, N).lane, "product");
});

test("dev draws to the highest built dev row, then waits at the fork", () => {
  assert.equal(penAt(-1, FORK, N).dev, 0);
  assert.equal(penAt(-1, FORK, N).head, 0);
  assert.equal(penAt(2, FORK, N).dev, 2 / 7);
  assert.equal(penAt(4, FORK, N).dev, 4 / 7);
  assert.equal(penAt(6, FORK, N).dev, 4 / 7); // yomali: dev still stops at the fork
  assert.equal(penAt(7, FORK, N).dev, 1); // the merge: both lines reach the top
});

test("product leaves the fork, HEAD follows it", () => {
  assert.equal(penAt(4, FORK, N).prod, 0);
  assert.equal(penAt(4, FORK, N).lane, "dev");
  assert.equal(penAt(5, FORK, N).prod, 1);
  assert.equal(penAt(5, FORK, N).lane, "product");
  assert.equal(penAt(6.5, FORK, N).merge, 0.5);
});

test("the pen moves a row at a time; Innovational lands 0.5s before Fabel X", () => {
  assert.deepEqual(segments(0, 2, N), [{ to: 1, dur: 0.5 }, { to: 2, dur: 0.5 }]);
  assert.deepEqual(segments(5, 7, N), [{ to: 6, dur: 0.5 }, { to: 7, dur: 0.8 }]);
});

test("scrubbing back retracts faster, from wherever the pen is", () => {
  const back = segments(6.5, 5, N);
  assert.equal(back.length, 2);
  assert.equal(back[0].to, 6);
  assert.ok(Math.abs(back[0].dur - 0.11) < 1e-9);
  assert.deepEqual(back[1], { to: 5, dur: 0.22 });
  assert.deepEqual(segments(3, 3, N), []);
});
