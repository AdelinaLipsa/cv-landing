import { test } from "node:test";
import assert from "node:assert/strict";
import { newBoard, reveal, flag } from "./mines.ts";

// A seeded random, so boards repeat
const seeded = (s: number) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;

test("the first click is never a mine, and opens an area", () => {
  for (let seed = 1; seed < 50; seed++) {
    const b = reveal(newBoard(), 40, seeded(seed));
    assert.equal(b.state === "lost", false);
    assert.equal(b.cells.filter((c) => c.mine).length, 10);
    assert.ok(b.cells.filter((c) => c.open).length > 1);
  }
});
test("clicking a mine loses and shows every mine", () => {
  let b = reveal(newBoard(), 0, seeded(7));
  const mine = b.cells.findIndex((c) => c.mine);
  b = reveal(b, mine);
  assert.equal(b.state, "lost");
  assert.ok(b.cells.filter((c) => c.mine).every((c) => c.open));
});
test("opening every safe cell wins", () => {
  let b = reveal(newBoard(), 40, seeded(3));
  b.cells.forEach((c, i) => { if (!c.mine && !c.open) b = reveal(b, i); });
  assert.equal(b.state, "won");
});
test("a flagged cell can't be opened until unflagged", () => {
  let b = flag(newBoard(), 5);
  assert.equal(reveal(b, 5).cells[5].open, false);
  b = flag(b, 5);
  assert.equal(reveal(b, 5, seeded(2)).cells[5].open, true);
});
