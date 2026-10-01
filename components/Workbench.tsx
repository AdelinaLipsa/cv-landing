"use client";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useCalm } from "@/lib/useCalm";
import SpotlightCard from "./SpotlightCard";
import PaymentJourney from "./PaymentJourney";
import j from "./PaymentJourney.module.css";
import s from "./Workbench.module.css";

// Hero right side: her four roles at Yomali, one tab each. All facts from content/cv.ts; demo data only.
const MODES = ["Payments", "Engineering", "Support", "Customers"] as const;
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

// A console that prints its lines one by one: the technical side, shown as the logs it produces. Demo data.
type Line = { k: string; text: string; ok?: string; bad?: string; sub?: boolean };

function Console({ lines, ms = 520 }: { lines: Line[]; ms?: number }) {
  const at = usePlay(lines.length, ms);
  return (
    <ol className={s.console} aria-live="polite">
      {lines.map((l, i) => (
        <li key={i} data-sub={l.sub || undefined} style={{ visibility: i < at ? "visible" : "hidden" }}>
          <span className={s.k}>{l.k}</span>
          <span className={s.v}>{l.text}{l.bad && <em className={s.bad}> {l.bad}</em>}{l.ok && <em className={s.good}> {l.ok}</em>}</span>
        </li>
      ))}
    </ol>
  );
}

// Support: an affiliate's tracking doesn't add up; her team traces it from pixel to postback to API.
const TRACE: Line[] = [
  { k: "case", text: "affiliate: sales in our report, not in theirs" },
  { k: "pixel", text: "checkout → purchase event", ok: "fired" },
  { k: "GET", text: "/postback?order_id=1042&aff_sub=fb_07&amount=49.00" },
  { k: "", text: "200 OK, but click_id is empty", bad: "✗", sub: true },
  { k: "params", text: "click_id dropped on the upsell redirect" },
  { k: "fix", text: "pass click_id through the redirect, re-fire postback", ok: "✓" },
  { k: "GET", text: "/api/orders/1042 → affiliate attributed", ok: "200" },
];

function Support() {
  return (
    <div className={s.panel}>
      <div className={j.head}><span className={j.kicker}>Team manager · technical support</span><span className={j.order}>demo trace</span></div>
      <Console lines={TRACE} />
      <p className={s.mine}>I manage the technical support team that debugs vendor and affiliate integrations: pixels, postback URLs, parameters, the API, and checkout.</p>
    </div>
  );
}

// Customers: an AI voice agent call runs through the automation she coded and lands in Zendesk; she tests every scenario end to end.
const CALL_RUN: Line[] = [
  { k: "call", text: "ai-agent ended · intent=refund_request · 3m12s" },
  { k: "hook", text: "→ support-flows automation (my code)" },
  { k: "map", text: "intent → tag, order_id → field, transcript → note" },
  { k: "route", text: "needs_human=true → Tier 2 group" },
  { k: "POST", text: "zendesk /api/v2/tickets", ok: "201" },
  { k: "test", text: "refund · human handoff · dropped call · wrong order ID", ok: "4/4" },
  { k: "stats", text: "volume, escalation rate, resolution by intent → weekly" },
];

function Customers() {
  return (
    <div className={s.panel}>
      <div className={j.head}><span className={j.kicker}>With the head of customer support</span><span className={j.order}>demo run</span></div>
      <Console lines={CALL_RUN} />
      <p className={s.mine}>I code the automations behind customer support’s flows, test every AI voice agent scenario end to end in Zendesk, and run their statistics.</p>
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
        {mode === "Payments" ? <PaymentJourney /> : mode === "Engineering" ? <Engineering /> : mode === "Support" ? <Support /> : <Customers />}
      </motion.div>
    </SpotlightCard>
  );
}
