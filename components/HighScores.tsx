"use client";
import { useEffect, useState } from "react";
import s from "./Arcade.module.css";

// The global leaderboard under each game. Hidden until the database is connected (the API answers ready: false).
// After a game ends with points, three letters and you're on the board.
type Row = { name: string; score: number };

export default function HighScores({ game, score }: { game: string; score: number | null }) {
  const [top, setTop] = useState<Row[] | null>(null);
  const [name, setName] = useState("");
  const [sent, setSent] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try { setName(localStorage.getItem("cv-initials") ?? ""); } catch { }
    fetch(`/api/scores?game=${game}`).then((r) => r.json()).then((d) => setTop(d?.ready ? d.top : null)).catch(() => setTop(null));
  }, [game]);

  if (!top) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score == null) return;
    setError("");
    const res = await fetch("/api/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ game, name, score }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setError(d.error ?? "Couldn’t save that one."); return; }
    try { localStorage.setItem("cv-initials", name); } catch { }
    setTop(d.top); setSent(score);
  };

  return (
    <div className={s.scores}>
      <b>High scores</b>
      {score != null && score > 0 && sent !== score && (
        <form onSubmit={submit} className={s.initials}>
          <span>{score} points. Your initials:</span>
          <input value={name} onChange={(e) => setName(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3))} maxLength={3} required aria-label="Your initials, three letters" placeholder="AAA" autoComplete="off" />
          <button type="submit">Save</button>
          {error && <em>{error}</em>}
        </form>
      )}
      <ol>
        {top.length ? top.map((r, i) => <li key={i}><span>{String(i + 1).padStart(2, "0")}</span><span>{r.name}</span><span>{r.score}</span></li>) : <li className={s.empty}>No scores yet. Be the first.</li>}
      </ol>
    </div>
  );
}
