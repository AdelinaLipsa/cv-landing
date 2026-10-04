import { test } from "node:test";
import assert from "node:assert/strict";
import { deal, draw, move, autoFound, pick, won, type Game, type Card } from "./solitaire.ts";

const seeded = (s: number) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
const C = (suit: Card["suit"], rank: number, up = true): Card => ({ suit, rank, up });
const empty = (): Game => ({ stock: [], waste: [], found: [[], [], [], []], tab: [[], [], [], [], [], [], []], moves: 0 });

test("a deal has 52 cards: 28 on the tableau (top ones face up), 24 in the stock", () => {
  const g = deal(seeded(5));
  assert.equal(g.tab.flat().length, 28);
  assert.equal(g.stock.length, 24);
  assert.ok(g.tab.every((t, i) => t.length === i + 1 && t[i].up && t.slice(0, i).every((c) => !c.up)));
  assert.equal(new Set([...g.tab.flat(), ...g.stock].map((c) => c.suit + c.rank)).size, 52);
});
test("drawing turns one card; an empty stock takes the waste back face down", () => {
  let g: Game = { ...empty(), stock: [C("♠", 2, false), C("♥", 9, false)] };
  g = draw(draw(g));
  assert.deepEqual(g.waste.map((c) => c.rank), [9, 2]);
  g = draw(g);
  assert.deepEqual(g.stock.map((c) => [c.rank, c.up]), [[2, false], [9, false]]);
});
test("tableau takes alternating colours one lower, and only a king on an empty pile", () => {
  const g: Game = { ...empty(), waste: [C("♥", 6)], tab: [[C("♠", 7)], [], [C("♣", 7)], [], [], [], []] };
  assert.equal(move(g, { pile: "waste" }, { pile: "tab", i: 0 }).tab[0].length, 2); // red 6 on black 7
  assert.equal(move(g, { pile: "waste" }, { pile: "tab", i: 1 }), g); // not a king
  const k: Game = { ...g, waste: [C("♦", 13)] };
  assert.equal(move(k, { pile: "waste" }, { pile: "tab", i: 1 }).tab[1].length, 1);
});
test("moving a run flips the card it uncovered; foundations build by suit from the ace", () => {
  const g: Game = { ...empty(), tab: [[C("♣", 3, false), C("♥", 8), C("♠", 7)], [C("♣", 9)], [], [], [], [], []] };
  const n = move(g, { pile: "tab", i: 0, at: 1 }, { pile: "tab", i: 1 });
  assert.deepEqual(n.tab[1].map((c) => c.rank), [9, 8, 7]);
  assert.equal(n.tab[0][0].up, true);
  const f: Game = { ...empty(), waste: [C("♠", 1)], tab: [[C("♠", 2)], [], [], [], [], [], []] };
  const a = autoFound(f, { pile: "waste" });
  assert.equal(a.found[0].length, 1);
  assert.equal(autoFound(a, { pile: "tab", i: 0, at: 0 }).found[0].length, 2);
  assert.equal(pick(f, { pile: "tab", i: 0, at: 5 }).length, 0);
});
test("all four foundations full is a win", () => {
  const g = empty();
  g.found = ["♠", "♥", "♦", "♣"].map((s) => Array.from({ length: 13 }, (_, k) => C(s as Card["suit"], k + 1)));
  assert.ok(won(g));
});
