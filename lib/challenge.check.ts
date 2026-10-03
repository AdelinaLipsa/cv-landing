import { test } from "node:test";
import assert from "node:assert/strict";
import { parseChallenge, fromQuery, toQuery } from "./challenge.ts";

test("a fair challenge parses, initials uppercased", () => assert.deepEqual(parseChallenge("space", "1234", "abc"), { game: "space", score: 1234, by: "ABC" }));
test("unknown game, impossible score, or odd initials are refused", () => {
  assert.equal(parseChallenge("tetris", 10, "ABC"), null);
  assert.equal(parseChallenge("space", 20001, "ABC"), null);
  assert.equal(parseChallenge("space", 0, "ABC"), null);
  assert.equal(parseChallenge("space", "12.5", "ABC"), null);
  assert.equal(parseChallenge("space", 100, "<b>"), null);
  assert.equal(parseChallenge("space", 100, "ABCD"), null);
});
test("query round trip", () => { const c = parseChallenge("fighter", 900, "ZZ")!; assert.deepEqual(fromQuery(toQuery(c)), c); });
test("missing or broken query is no challenge", () => { assert.equal(fromQuery(null), null); assert.equal(fromQuery("space"), null); });
