import { clientIp, kv, kvReady } from "@/lib/kv";
import { ideas } from "@/content/roadmap";

// Roadmap votes: one per visitor per idea, counted in Upstash. Only ideas from content/roadmap.ts can be voted on.
export const dynamic = "force-dynamic";
const IDS = ideas.map((i) => i.id) as string[];

const counts = async () => {
  const raw = await kv<(string | null)[]>("MGET", ...IDS.map((id) => `rm:votes:${id}`));
  return Object.fromEntries(IDS.map((id, i) => [id, Number(raw[i]) || 0]));
};

export async function GET() {
  if (!kvReady) return Response.json({ ready: false });
  return Response.json({ ready: true, votes: await counts() });
}

export async function POST(req: Request) {
  if (!kvReady) return Response.json({ ready: false });
  const { id } = await req.json().catch(() => ({}));
  if (!IDS.includes(id)) return Response.json({ error: "That idea isn’t on the roadmap." }, { status: 400 });
  const first = (await kv("SET", `rm:voted:${id}:${clientIp(req)}`, 1, "NX")) === "OK";
  if (first) await kv("INCR", `rm:votes:${id}`);
  return Response.json({ ok: true, votes: await counts() });
}
