// Keeps the arcade light: no single model over 1.5 MB, no game over 4 MB. `npm run assets:check`.
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

const MB = 1024 * 1024;
export function checkBudget(dir, limits = { file: 1.5 * MB, game: 4 * MB }) {
  if (!existsSync(dir)) return [];
  const problems = [];
  for (const game of readdirSync(dir)) {
    const root = join(dir, game);
    if (!statSync(root).isDirectory()) continue;
    let total = 0;
    const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f), s = statSync(p); if (s.isDirectory()) walk(p); else { total += s.size; if (s.size > limits.file) problems.push(`${relative(dir, p)}: ${(s.size / MB).toFixed(2)} MB, over the per-file limit`); } } };
    walk(root);
    if (total > limits.game) problems.push(`${game}: ${(total / MB).toFixed(2)} MB in all, over the per-game limit`);
  }
  return problems;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = checkBudget(process.argv[2] ?? "public/arcade");
  problems.forEach((p) => console.error(p));
  process.exit(problems.length ? 1 : 0);
}
