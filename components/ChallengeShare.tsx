"use client";
import { useEffect, useState } from "react";
import { toast } from "@/lib/achievements";
import { challengePath, TITLES, type Challenge, type GameId } from "@/lib/challenge";
import s from "./Arcade.module.css";

// Under a finished game: send the score to a friend as a challenge link. The phone's share sheet where there is one,
// the clipboard everywhere else. The same three initials as the leaderboard.
export default function ChallengeShare({ game, score }: { game: GameId; score: number }) {
  const [name, setName] = useState("");
  useEffect(() => { try { setName(localStorage.getItem("cv-initials") ?? ""); } catch { } }, []);

  const share = async (e: React.FormEvent) => {
    e.preventDefault();
    try { localStorage.setItem("cv-initials", name); } catch { }
    const c: Challenge = { game, score, by: name };
    const url = location.origin + challengePath(c);
    const text = `I scored ${score.toLocaleString("en")} in ${TITLES[game]}. Beat it.`;
    if (navigator.share) {
      try { await navigator.share({ title: TITLES[game], text, url }); return; } catch (err) { if ((err as Error).name === "AbortError") return; }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast({ icon: "🔗", title: "Challenge copied", body: "Paste it to a friend. The link shows your score." });
    } catch {
      toast({ icon: "🔗", title: "Your challenge link", body: url });
    }
  };

  return (
    <form onSubmit={share} className={`${s.initials} ${s.challenge}`}>
      <span>Think someone can beat {score.toLocaleString("en")}? Your initials:</span>
      <input value={name} onChange={(e) => setName(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3))} maxLength={3} required aria-label="Your initials, up to three letters" placeholder="AAA" autoComplete="off" />
      <button type="submit">Challenge a friend →</button>
    </form>
  );
}
