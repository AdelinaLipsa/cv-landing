// Seasons the games dress up for: Halloween all of October, Christmas from 1 December to 6 January.
// ?season=halloween|christmas|none in the URL forces one, for testing.
export type Season = "halloween" | "christmas" | null;
export const season = (): Season => {
  if (typeof window === "undefined") return null;
  const forced = new URLSearchParams(location.search).get("season");
  if (forced) return forced === "halloween" || forced === "christmas" ? forced : null;
  const d = new Date(), m = d.getMonth(), day = d.getDate();
  if (m === 9) return "halloween";
  if (m === 11 || (m === 0 && day <= 6)) return "christmas";
  return null;
};

// Snowfall for Christmas, drawn from the clock alone: no state to keep.
export const drawSnow = (ctx: CanvasRenderingContext2D, t: number, w: number, h: number) => {
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 46; i++) {
    const speed = 10 + (i % 3) * 7;
    const x = (((i * 47 + Math.sin(t * 0.8 + i) * 6) % w) + w) % w, y = (i * 31 + t * speed) % h;
    ctx.globalAlpha = 0.5 + (i % 3) * 0.2;
    ctx.fillRect(Math.round(x), Math.round(y), i % 5 ? 1 : 2, i % 5 ? 1 : 2);
  }
  ctx.globalAlpha = 1;
};
