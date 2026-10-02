import { allowed, clientIp, kv, kvReady } from "@/lib/kv";

// Arcade high scores, one table per game: three-letter initials, like the old cabinets.
// Scores above a game's ceiling are rejected; one submission every 10s per visitor. Top 100 kept.
export const dynamic = "force-dynamic";
const GAMES = { space: 20000, shipit: 30000, fighter: 15000 } as const;
type Game = keyof typeof GAMES;

const top = async (game: Game) => {
  const flat = await kv<string[]>("ZRANGE", `scores:${game}`, 0, 9, "REV", "WITHSCORES");
  const rows: { name: string; score: number }[] = [];
  for (let i = 0; i < flat.length; i += 2) rows.push({ name: flat[i].split("#")[0], score: Number(flat[i + 1]) });
  return rows;
};

export async function GET(req: Request) {
  if (!kvReady) return Response.json({ ready: false });
  const game = new URL(req.url).searchParams.get("game") as Game;
  if (!(game in GAMES)) return Response.json({ error: "Unknown game." }, { status: 400 });
  return Response.json({ ready: true, top: await top(game) });
}

export async function POST(req: Request) {
  if (!kvReady) return Response.json({ ready: false });
  const body = await req.json().catch(() => ({}));
  const game = body.game as Game, score = Math.floor(Number(body.score));
  const name = typeof body.name === "string" ? body.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) : "";
  if (!(game in GAMES) || !name || !Number.isFinite(score) || score <= 0 || score > GAMES[game]) return Response.json({ error: "That score doesn’t look right." }, { status: 400 });
  if (!(await allowed(`score:${game}`, clientIp(req), 10))) return Response.json({ error: "Easy, champ. One every 10 seconds." }, { status: 429 });
  await kv("ZADD", `scores:${game}`, score, `${name}#${Date.now().toString(36)}`);
  await kv("ZREMRANGEBYRANK", `scores:${game}`, 0, -101);
  return Response.json({ ok: true, top: await top(game) });
}
