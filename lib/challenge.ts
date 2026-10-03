// Arcade challenges: a shared link that says "ABC scored 1234 in Space shooter. Beat it."
// The link carries everything in its path (/c/space/1234/ABC), so it needs no database and works as a link preview.
// The ceilings are the same ones the leaderboard uses to reject impossible scores.
export const CEILING = { space: 20000, shipit: 30000, fighter: 15000 } as const;
export type GameId = keyof typeof CEILING;
export const TITLES: Record<GameId, string> = { space: "Space shooter", shipit: "Ship It!", fighter: "Sprint Fighter" };
export type Challenge = { game: GameId; score: number; by: string };

export function parseChallenge(game: string, score: string | number, by: string | undefined): Challenge | null {
  if (typeof by !== "string") return null;
  if (!(game in CEILING)) return null;
  const n = Number(score), name = by.toUpperCase();
  if (!Number.isInteger(n) || n <= 0 || n > CEILING[game as GameId] || !/^[A-Z0-9]{1,3}$/.test(name)) return null;
  return { game: game as GameId, score: n, by: name };
}
// The query form the home page reads: ?challenge=space.1234.ABC
export const fromQuery = (q: string | null) => (q ? parseChallenge(...(q.split(".") as [string, string, string])) : null);
export const toQuery = (c: Challenge) => `${c.game}.${c.score}.${c.by}`;
export const challengePath = (c: Challenge) => `/c/${c.game}/${c.score}/${c.by}`;
