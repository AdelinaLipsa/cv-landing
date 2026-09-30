// Run: node lib/battle.check.ts — the battle loop must produce wins and never throw.
import { createBattle, step } from "./battle.ts";

const s = createBattle();
let wins = 0;
for (let i = 0; i < 20000; i++) {
  step(s);
  if (s.banner === 50 && s.bannerText === "YOU WIN") wins++;
  if (s.pHp < 0 || s.eHp < 0 || s.pRow < 0 || s.pRow > 2 || s.eCol < 3 || s.eCol > 5) throw new Error("state out of range at " + i);
}
if (wins === 0) throw new Error("the robot never wins");
console.log(`ok: ${wins} wins in 20000 ticks`);
