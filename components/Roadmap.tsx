"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ideas, shipped, type IdeaId } from "@/content/roadmap";
import { unlock } from "@/lib/achievements";
import Counter from "./Counter";
import p from "./panes/pane.module.css";
import s from "./Roadmap.module.css";

// The CV's own roadmap, run like a product: visitors upvote what I build next, release notes show what shipped.
// Votes need the database (Upstash); without it the ideas still show, just without the vote buttons.
const KEY = "cv-roadmap-votes";

function Board() {
  const [votes, setVotes] = useState<Record<string, number> | null>(null);
  const [mine, setMine] = useState<string[]>([]);
  useEffect(() => {
    try { setMine(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { }
    fetch("/api/roadmap").then((r) => r.json()).then((d) => setVotes(d?.ready ? d.votes : null)).catch(() => setVotes(null));
  }, []);

  const vote = async (id: IdeaId) => {
    if (mine.includes(id)) return;
    const next = [...mine, id];
    setMine(next);
    setVotes((v) => v && { ...v, [id]: (v[id] ?? 0) + 1 }); // optimistic: the counter rolls straight away
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { }
    unlock("voter");
    const d = await fetch("/api/roadmap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).then((r) => r.json()).catch(() => null);
    if (d?.votes) setVotes(d.votes);
  };

  // Most-wanted first; ties keep the order I wrote them in.
  const list = votes ? [...ideas].sort((a, b) => (votes[b.id] ?? 0) - (votes[a.id] ?? 0)) : ideas;

  return (
    <div className={s.board}>
      <h2 className={p.sheetTitle}>What should I build next?</h2>
      <p className={p.lede}>This site is a product too. Here’s what I might build next{votes ? ": vote for the one you want, and the most wanted rises to the top." : "."}</p>

      <ol className={s.ideas}>
        {list.map((idea) => {
          const voted = mine.includes(idea.id);
          return (
            <motion.li key={idea.id} layout transition={{ type: "spring", stiffness: 300, damping: 32 }} className={s.idea}>
              <div className={s.text}>
                <b>{idea.title}</b>
                <span>{idea.note}</span>
              </div>
              {votes && (
                <button type="button" className={s.vote} onClick={() => vote(idea.id)} disabled={voted} aria-pressed={voted} aria-label={`${voted ? "You voted for" : "Vote for"} ${idea.title}`}>
                  <span className={s.arrow} aria-hidden="true">▲</span>
                  <Counter value={votes[idea.id] ?? 0} places={(votes[idea.id] ?? 0) >= 100 ? [100, 10, 1] : (votes[idea.id] ?? 0) >= 10 ? [10, 1] : [1]} fontSize={15} padding={2} gap={0} horizontalPadding={0} borderRadius={0} textColor="currentColor" fontWeight={800} gradientFrom="transparent" gradientTo="transparent" />
                </button>
              )}
            </motion.li>
          );
        })}
      </ol>

      <h3 className={s.h}>Release notes</h3>
      <ul className={s.notes}>
        {shipped.map((r) => <li key={r.v}><span className={s.v}>{r.v}</span>{r.title}</li>)}
      </ul>
    </div>
  );
}

export default function RoadmapButton({ open }: { open: (label: string, body: React.ReactNode) => void }) {
  return <button type="button" className={s.open} onClick={() => open("What should I build next?", <Board />)}>🗳 Vote on what I build next</button>;
}
