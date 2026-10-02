// Tiny Upstash Redis client over its REST API: no dependency. Connect it from Vercel → Storage → Upstash (Redis),
// which sets KV_REST_API_URL and KV_REST_API_TOKEN. Without them, the guestbook and high scores hide themselves.
const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
export const kvReady = Boolean(url && token);

export async function kv<T = unknown>(...command: (string | number)[]): Promise<T> {
  const res = await fetch(url!, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(command), cache: "no-store" });
  const json = (await res.json()) as { result?: T; error?: string };
  if (json.error) throw new Error(json.error);
  return json.result as T;
}

export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
// One action per window per visitor: SET NX with an expiry. True if allowed.
export const allowed = async (kind: string, ip: string, seconds: number) => (await kv("SET", `rl:${kind}:${ip}`, 1, "EX", seconds, "NX")) === "OK";
