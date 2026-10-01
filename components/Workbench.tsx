"use client";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useCalm } from "@/lib/useCalm";
import SpotlightCard from "./SpotlightCard";
import PaymentJourney from "./PaymentJourney";
import j from "./PaymentJourney.module.css";
import s from "./Workbench.module.css";

// Hero right side: her four roles at Yomali, one tab each. All facts from content/cv.ts; demo data only.
const MODES = ["Payments", "Engineering", "Support", "Analytics"] as const;
type Mode = (typeof MODES)[number];

// Reveals its steps one by one each time the mode opens; returns how many are shown.
function usePlay(count: number, ms: number) {
  const calm = useCalm();
  const [at, setAt] = useState(calm ? count : 0);
  useEffect(() => {
    if (at >= count) return;
    const id = setTimeout(() => setAt((v) => v + 1), calm ? 0 : ms);
    return () => clearTimeout(id);
  }, [at, count, ms, calm]);
  return at;
}

// Demo tickets: the kinds of technical questions her team handles. No real accounts.
const QUEUE = [
  { tag: "Pixel", text: "Purchase pixel not firing on the thank-you page" },
  { tag: "Postback", text: "Testing a postback URL before launch" },
  { tag: "Parameters", text: "Sub-ID parameters missing from the sales report" },
  { tag: "API", text: "Pulling order status through the API" },
  { tag: "Checkout", text: "Custom checkout not loading on mobile" },
];

// Support: a technical queue her team works through, plus what she does with customer support.
function Support() {
  const at = usePlay(QUEUE.length, 650);
  return (
    <div className={s.panel}>
      <div className={j.head}><span className={j.kicker}>Team manager · technical support</span><span className={j.order}>demo queue</span></div>
      <ul className={s.queue} aria-live="polite">
        {QUEUE.map((q, i) => (
          <li key={q.tag} data-done={i < at || undefined}>
            <span className={s.tag}>{q.tag}</span>
            <span className={s.qText}>{q.text}</span>
            <span className={s.qState}>{i < at ? "solved" : "open"}</span>
          </li>
        ))}
      </ul>
      <p className={s.mine}>I manage the technical support team: pixels, postbacks, parameters, APIs, and checkout. I also own the AI voice agent’s escalation protocol.</p>
    </div>
  );
}

// Analytics: with the head of customer support. Demo counts for the demo queue above, not real data.
const WEEK = [
  { tag: "Pixel", n: 14 },
  { tag: "Postback", n: 11 },
  { tag: "Parameters", n: 8 },
  { tag: "API", n: 5 },
  { tag: "Checkout", n: 4 },
];
const FLOW = ["New ticket", "Tagged by topic", "Weekly report"];

function Analytics() {
  const at = usePlay(FLOW.length, 600);
  const max = Math.max(...WEEK.map((w) => w.n));
  return (
    <div className={s.panel}>
      <div className={j.head}><span className={j.kicker}>Statistics · customer support</span><span className={j.order}>demo week</span></div>
      <figure className={s.chart}>
        <figcaption className={s.colName}>Tickets by topic</figcaption>
        {WEEK.map((w, i) => (
          <div key={w.tag} className={s.barRow} title={`${w.tag}: ${w.n} tickets`}>
            <span className={s.barLabel}>{w.tag}</span>
            <span className={s.barTrack}>
              <motion.span className={s.bar} initial={{ width: 0 }} animate={{ width: `${(w.n / max) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.08 }} />
            </span>
            <span className={s.barValue}>{w.n}</span>
          </div>
        ))}
      </figure>
      <span className={s.colName}>Automation</span>
      <ol className={s.flow}>
        {FLOW.map((f, i) => <li key={f} data-on={i < at || undefined}>{f}</li>)}
      </ol>
      <p className={s.mine}>I work with the head of customer support: I run the support statistics and build the automations behind them.</p>
    </div>
  );
}

// Engineering: one real ticket of hers crossing the board, then the rest of what she owns there.
const COLUMNS = ["Proposed", "PRD", "Building", "In testing"];
const BOARD = ["Find Order refund and return journey", "3DS/SCA rollout tracking", "Weekly reporting and the change log"];

function Engineering() {
  const at = usePlay(COLUMNS.length - 1, 900);
  return (
    <div className={s.panel}>
      <div className={j.head}><span className={j.kicker}>Product manager · core engineering</span><span className={j.order}>ClickUp</span></div>
      <div className={s.board}>
        {COLUMNS.map((c, i) => (
          <div key={c} className={s.col} data-on={i === at || undefined}>
            <span className={s.colName}>{c}</span>
            {i === at && (
              <motion.div layoutId="bench-ticket" className={s.ticket} transition={{ type: "spring", stiffness: 260, damping: 28 }}>
                Self-service refund flow
              </motion.div>
            )}
          </div>
        ))}
      </div>
      <span className={s.colName}>Also on my board</span>
      <ul className={s.owned}>
        {BOARD.map((b) => <li key={b}>{b}</li>)}
      </ul>
      <p className={s.mine}>I’m the product manager for the core engineering team: I write the PRDs, run the standups and weekly reporting, and keep the change log.</p>
    </div>
  );
}

export default function Workbench() {
  const [mode, setMode] = useState<Mode>("Payments");
  return (
    <SpotlightCard className={s.card} spotlightColor="rgba(51, 85, 255, 0.12)">
      <p className={s.lede}>My four roles at Yomali, at the same time</p>
      <div className={s.modes} role="tablist" aria-label="My roles at Yomali">
        {MODES.map((m) => (
          <button key={m} type="button" role="tab" aria-selected={m === mode} className={s.mode} onClick={() => setMode(m)}>
            {m === mode && <motion.span layoutId="bench-mode" className={s.modeBg} transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
            <span>{m}</span>
          </button>
        ))}
      </div>
      <motion.div key={mode} role="tabpanel" aria-label={mode} className={s.body} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {mode === "Payments" ? <PaymentJourney /> : mode === "Engineering" ? <Engineering /> : mode === "Support" ? <Support /> : <Analytics />}
      </motion.div>
    </SpotlightCard>
  );
}
