import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkBudget } from "./asset-budget.mjs";

const make = (files) => {
  const root = mkdtempSync(join(tmpdir(), "arcade-"));
  for (const [path, bytes] of Object.entries(files)) { mkdirSync(join(root, path, ".."), { recursive: true }); writeFileSync(join(root, path), Buffer.alloc(bytes)); }
  return root;
};

test("within budget: no problems", () => assert.deepEqual(checkBudget(make({ "space/ship.glb": 1000 }), { file: 2000, game: 5000 }), []));
test("a file over the per-file limit is named", () => {
  const p = checkBudget(make({ "space/ship.glb": 3000 }), { file: 2000, game: 5000 });
  assert.equal(p.length, 1);
  assert.match(p[0], /space\/ship\.glb/);
});
test("a game over its total is named", () => {
  const p = checkBudget(make({ "shipit/a.glb": 1500, "shipit/b.glb": 1500 }), { file: 2000, game: 2500 });
  assert.deepEqual(p.map((x) => x.split(":")[0]), ["shipit"]);
});
test("a missing folder is not an error", () => assert.deepEqual(checkBudget(join(tmpdir(), "nope-arcade")), []));
