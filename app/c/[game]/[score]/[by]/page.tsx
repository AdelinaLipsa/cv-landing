import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseChallenge, TITLES, toQuery } from "@/lib/challenge";

// A shared arcade challenge. Link previews read the title and image here; people are sent on to the arcade,
// which opens that game with the score to beat.
type Props = { params: Promise<{ game: string; score: string; by: string }> };

const read = async (params: Props["params"]) => { const { game, score, by } = await params; return parseChallenge(game, score, by); };
const line = (c: NonNullable<ReturnType<typeof parseChallenge>>) => `${c.by} scored ${c.score.toLocaleString("en")} in ${TITLES[c.game]}. Beat it.`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await read(params);
  if (!c) return {};
  const title = line(c), description = "A tiny arcade game on Adelina Lipșa’s CV.";
  return { title, description, openGraph: { title, description }, twitter: { card: "summary_large_image", title, description }, robots: { index: false } };
}

export default async function Challenge({ params }: Props) {
  const c = await read(params);
  if (!c) notFound();
  const to = `/?challenge=${toQuery(c)}`;
  return (
    <main style={{ padding: 40, fontFamily: "ui-monospace, monospace" }}>
      <meta httpEquiv="refresh" content={`0;url=${to}`} />
      <p>{line(c)}</p>
      <p><a href={to}>Take the challenge →</a></p>
    </main>
  );
}
