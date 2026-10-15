import { test } from "node:test";
import assert from "node:assert/strict";
import { drawers } from "./partsCabinet.ts";

const layers = [
  { name: "PM", chips: ["a", "b"] },
  { name: "Agile", chips: ["c", "d", "e", "f"] },
  { name: "Pay", chips: ["g"] },
];

test("everything picked: every drawer is shut", () => {
  assert.deepEqual(drawers(layers, [], true).map((d) => d.open), [0, 0, 0]);
});
test("a role opens only the drawers it used, by how much it used", () => {
  const d = drawers(layers, ["a", "b", "c"], false);
  assert.equal(d[0].open, 1);              // used both of 2
  assert.equal(d[1].open, 0.35 + 0.65 / 4); // used 1 of 4: still clearly open
  assert.equal(d[2].open, 0);              // untouched
  assert.equal(d[1].used, 1);
});
test("the first drawer is wide on top, the rest go in pairs", () => {
  const d = drawers(layers, [], true);
  assert.deepEqual(d.map((x) => [x.wide, x.row, x.col]), [[true, 0, 0], [false, 1, 0], [false, 1, 1]]);
});

test("five drawers: rows 0,1,1,2,2 and columns alternate", () => {
  const five = ["A", "B", "C", "D", "E"].map((name) => ({ name, chips: ["x"] }));
  const d = drawers(five, [], true);
  assert.deepEqual(d.map((x) => [x.row, x.col]), [[0, 0], [1, 0], [1, 1], [2, 0], [2, 1]]);
});
test("all picked beats a non-empty used list: every drawer shut", () => {
  assert.deepEqual(drawers(layers, ["a", "c", "g"], true).map((d) => d.open), [0, 0, 0]);
});
