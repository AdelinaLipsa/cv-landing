import { allowed, clientIp, kv, kvReady } from "@/lib/kv";

// The 2003 guestbook, for real: one line per visitor, newest first, plus a "liked this site" counter.
// Guarded: length limits, no links, one entry a minute per visitor. Entries can be deleted in the Upstash console (list "gb").
export const dynamic = "force-dynamic";
const clean = (s: unknown, max: number) => (typeof s === "string" ? s.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : "");

export async function GET() {
  if (!kvReady) return Response.json({ ready: false });
  const [raw, likes] = await Promise.all([kv<string[]>("LRANGE", "gb", 0, 49), kv<string | null>("GET", "gb:likes")]);
  return Response.json({ ready: true, likes: Number(likes) || 0, entries: raw.map((r) => JSON.parse(r)) });
}

export async function POST(req: Request) {
  if (!kvReady) return Response.json({ ready: false });
  const ip = clientIp(req);
  const body = await req.json().catch(() => ({}));
  if (body.like) {
    const first = (await kv("SET", `gb:liked:${ip}`, 1, "NX")) === "OK";
    const likes = first ? await kv<number>("INCR", "gb:likes") : Number(await kv("GET", "gb:likes")) || 0;
    return Response.json({ likes });
  }
  const name = clean(body.name, 24), message = clean(body.message, 140);
  if (!name || !message) return Response.json({ error: "Name and message, please." }, { status: 400 });
  if (/https?:|www\.|\.(com|net|ru|xyz)\b/i.test(name + message)) return Response.json({ error: "No links, sorry. It’s 2003, links are scary." }, { status: 400 });
  if (!(await allowed("gb", ip, 60))) return Response.json({ error: "One entry a minute. Grab a ramen." }, { status: 429 });
  const entry = { name, message, at: Date.now() };
  await kv("LPUSH", "gb", JSON.stringify(entry));
  await kv("LTRIM", "gb", 0, 199);
  return Response.json({ ok: true, entry });
}
