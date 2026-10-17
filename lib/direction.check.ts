import test from "node:test";
import assert from "node:assert/strict";
import { builtAt, resolveBuilt, wordsShown, cueAt, jobOf, rewindAt, TYPE_CPS } from "./direction.ts";
import { steps, ALL_BUILT, type BuildKey } from "../content/tour.ts";

test("nothing is built at the start", () => assert.equal(builtAt(0).size, 0));
test("a step builds its own keys and keeps the earlier ones", () => {
  const b = builtAt(5);
  for (const k of ["home.offduty", "career.edu-web", "career.agrocity", "career.innovational", "career.fabelx"]) assert.ok(b.has(k as BuildKey));
  assert.ok(!b.has("career.ubisoft"));
});
test("scrubbing back un-builds", () => assert.ok(!builtAt(3).has("career.agrocity")));
test("the last step has every key", () => assert.deepEqual([...builtAt(steps.length - 1)].sort(), [...ALL_BUILT].sort()));
test("closed guide: everything built", () => assert.equal(resolveBuilt(false, 0), ALL_BUILT));
test("words appear as their last letter is typed", () => {
  assert.equal(wordsShown("ab cd", 0), 0);
  assert.equal(wordsShown("ab cd", 2 / TYPE_CPS), 1);
  assert.equal(wordsShown("ab cd", 99), 2);
});
test("a cue goes live once its first word shows, the latest wins", () => {
  const room = steps.find((s) => s.title === "My room")!;
  assert.equal(cueAt(room, 0), null);
  assert.equal(cueAt(room, 99), "rolodex");
});
test("job ids come from the target", () => {
  assert.equal(jobOf(steps.find((s) => s.title === "2020")!), "agrocity");
  assert.equal(jobOf(steps[0]), null);
});
test("rewind steps the eras back, un-building after the first quarter", () => {
  assert.deepEqual(rewindAt(0), { era: 3, all: true });
  assert.deepEqual(rewindAt(0.3), { era: 2, all: false });
  assert.deepEqual(rewindAt(1), { era: 0, all: false });
});
