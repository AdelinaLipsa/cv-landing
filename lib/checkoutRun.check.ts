import { test } from "node:test";
import assert from "node:assert/strict";
import { timeline, states } from "./checkoutRun.ts";

const end = (fail: Parameters<typeof timeline>[1]) => { const ev = timeline(5, fail); return states(5, ev, ev.length); };

test("happy path: every step done", () => assert.deepEqual(end(null), ["done", "done", "done", "done", "done"]));
test("a stop ends the run at the failed step, the rest never start", () =>
  assert.deepEqual(end({ step: 2, code: "x", stop: "held" }), ["done", "done", "failed", "todo", "todo"]));
test("a recovery keeps going after the failed step", () =>
  assert.deepEqual(end({ step: 1, code: "x", recover: "rerouted" }), ["done", "recovered", "done", "done", "done"]));
test("mid-run: the current step is now, the earlier ones done", () => {
  const ev = timeline(5, { step: 1, code: "x", recover: "r" });
  assert.deepEqual(states(5, ev, 3), ["done", "failed", "todo", "todo", "todo"]); // now(0), now(1), failed(1)
  assert.deepEqual(states(5, ev, 5), ["done", "recovered", "now", "todo", "todo"]);
});
