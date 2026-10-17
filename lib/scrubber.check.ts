import test from "node:test";
import assert from "node:assert/strict";
import { fit } from "./scrubber.ts";

test("labels far apart all fit", () => assert.deepEqual(fit([0, 50, 100], 30), [true, true, true]));
test("a label too close to the one before it is dropped", () => assert.deepEqual(fit([0, 20, 40, 100], 30), [true, false, true, true]));
test("the last label always stays; the one before it gives way", () => assert.deepEqual(fit([0, 40, 55], 30), [true, false, true]));
test("the first label stays even when the last one crowds it", () => assert.deepEqual(fit([0, 10], 30), [true, true]));
