import { ImageResponse } from "next/og";
import { parseChallenge, TITLES } from "@/lib/challenge";
import { font } from "@/lib/ogFont";

// The challenge's link preview: an arcade screen with the score to beat.
export const alt = "An arcade challenge on Adelina Lipșa’s CV";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ game: string; score: string; by: string }> }) {
  const { game, score, by } = await params;
  const c = parseChallenge(game, score, by);
  const top = c ? `${c.by} SCORED` : "INSERT COIN";
  const big = c ? c.score.toLocaleString("en") : "ARCADE";
  const title = c ? TITLES[c.game].toUpperCase() : "";
  const foot = "BEAT IT ▶  ON ADELINA LIPȘA’S CV";
  const mono = await font("JetBrains+Mono", "wght@800", top + big + title + foot);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, background: "#07061a", color: "#e8e6ff", fontFamily: "JetBrains Mono", backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 2px, transparent 2px, transparent 6px)" }}>
        <div style={{ fontSize: 40, color: "#8e8cae", letterSpacing: 6 }}>{top}</div>
        <div style={{ fontSize: 190, lineHeight: 1, color: "#F5B53F", textShadow: "0 0 40px rgba(245,181,63,0.5)" }}>{big}</div>
        <div style={{ fontSize: 48, color: "#5fd0ff", letterSpacing: 4 }}>{title}</div>
        <div style={{ marginTop: 28, padding: "14px 30px", border: "3px solid #ff7ac6", borderRadius: 999, fontSize: 30, color: "#ff7ac6", letterSpacing: 3 }}>{foot}</div>
      </div>
    ),
    { ...size, fonts: mono ? [{ name: "JetBrains Mono", data: mono, weight: 800 as const }] : [] }
  );
}
