"use client";
import { ideas, shipped } from "@/content/roadmap";
import p from "./panes/pane.module.css";
import s from "./Roadmap.module.css";

// The CV's own roadmap, run like a product: what might ship next, and release notes for what already did.
function Board() {
  return (
    <div className={s.board}>
      <h2 className={p.sheetTitle}>What I might build next</h2>
      <p className={p.lede}>This site is a product too. Here’s what’s on its roadmap.</p>

      <ol className={s.ideas}>
        {ideas.map((idea) => (
          <li key={idea.id} className={s.idea}>
            <div className={s.text}>
              <b>{idea.title}</b>
              <span>{idea.note}</span>
            </div>
          </li>
        ))}
      </ol>

      <h3 className={s.h}>Release notes</h3>
      <ul className={s.notes}>
        {shipped.map((r) => <li key={r.v}><span className={s.v}>{r.v}</span>{r.title}</li>)}
      </ul>
    </div>
  );
}

export default function RoadmapButton({ open }: { open: (label: string, body: React.ReactNode) => void }) {
  return <button type="button" className={s.open} onClick={() => open("What I might build next", <Board />)}>🗺 What I might build next</button>;
}
