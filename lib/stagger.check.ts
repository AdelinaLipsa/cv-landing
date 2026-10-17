import test from "node:test";
import assert from "node:assert/strict";
import { afterHero, hold } from "./stagger.ts";

const tick = () => new Promise((r) => setTimeout(r, 60));

test("jobs wait for the hero, then run one per idle slice, cancelled ones skipped", async () => {
  const ran: string[] = [];
  const release = hold();
  afterHero(() => ran.push("rays"));
  const cancel = afterHero(() => ran.push("gone"));
  afterHero(() => ran.push("border"));
  cancel();
  await tick(); await tick();
  assert.deepEqual(ran, []); // the room still holds
  release(); release(); // twice is harmless
  await tick(); await tick(); await tick();
  assert.deepEqual(ran, ["rays", "border"]);
});
