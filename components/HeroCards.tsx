"use client";
import { motion, useInView } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { glide, slow } from "@/lib/motion";
import GlareHover from "./GlareHover";
import s from "./HeroCards.module.css";

// Desktop hero: three things she made, working, not pictures of them.
// Only the decoder is real code you can use; the other two are demo data (brief: no internal numbers).

function Decoder() {
  const [url, setUrl] = useState("https://offer.example/?aff_id=1042&sub1=spring&cid=a9f3c2&utm_source=newsletter");
  const params = useMemo(() => {
    try {
      return [...new URL(url.trim()).searchParams.entries()];
    } catch {
      return null;
    }
  }, [url]);

  return (
    <GlareHover className={`${s.card} ${s.decoder}`} width="440px" height="auto" background="#fff" borderRadius="24px" borderColor="transparent" glareColor="#3355ff" glareOpacity={0.12} glareSize={260} transitionDuration={900}>
      <div className={s.head}>
        <b>Param Decoder</b>
        <span className={s.hint}>edit the link</span>
      </div>
      {/* Stop the pointer reaching the swipeable track, or the drag steals focus from the input. */}
      <input className={s.url} value={url} onChange={(e) => setUrl(e.target.value)} onPointerDown={(e) => e.stopPropagation()} spellCheck={false} aria-label="Link to decode" />
      {params === null ? (
        <p className={s.muted}>That isn’t a link yet. Keep typing.</p>
      ) : params.length === 0 ? (
        <p className={s.muted}>No parameters. Add ?key=value.</p>
      ) : (
        <dl className={s.params} aria-live="polite">
          {params.slice(0, 5).map(([k, v], i) => (
            <motion.div key={k + i} className={s.param} layout transition={glide}>
              <dt>{k}</dt>
              <dd>{v || <span className={s.muted}>empty</span>}</dd>
            </motion.div>
          ))}
          {params.length > 5 && <p className={s.muted}>and {params.length - 5} more</p>}
        </dl>
      )}
    </GlareHover>
  );
}

// Demo data. Shape of the real thing: complaints, chargeback threats, cancellations.
const SERIES = [
  { label: "Complaints", color: "var(--ink)", days: [9, 12, 8, 11, 7] },
  { label: "Chargeback threats", color: "var(--naruto)", days: [3, 2, 4, 2, 1] },
  { label: "Cancellations", color: "var(--blueprint)", days: [14, 11, 13, 9, 10] },
];
const MAX = 14;

function Dashboard() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { once: true, amount: 0.5 });
  return (
    <div ref={ref} className={`${s.card} ${s.dash}`} aria-label="CS dashboard, demo data">
      <div className={s.head}><b>CS dashboard</b><span className={s.demo}>demo data</span></div>
      <div className={s.series}>
        {SERIES.map((se, j) => (
          <div key={se.label} className={s.row}>
            <span className={s.rowLabel}>{se.label}</span>
            <span className={s.bars} aria-hidden="true">
              {se.days.map((d, i) => (
                <motion.i
                  key={i}
                  style={{ background: se.color, originY: 1 }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: on ? d / MAX : 0 }}
                  transition={{ ...slow, delay: j * 0.12 + i * 0.05 }}
                />
              ))}
            </span>
            <b className={s.rowValue}>{se.days[se.days.length - 1]}</b>
          </div>
        ))}
      </div>
      <p className={s.foot}>Was a 1.5 to 2 hour report, every day. Now it’s this.</p>
    </div>
  );
}

// Demo entries, generic on purpose: no merchants, offers or internal names.
const LOG = [
  { what: "3DS routing rule updated", when: "Tue", status: "Shipped" },
  { what: "Pay Later option at checkout", when: "Mon", status: "Testing" },
  { what: "Fraud rule tuned for wallets", when: "Fri", status: "Specced" },
];

function ChangeLog() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { once: true, amount: 0.5 });
  return (
    <div ref={ref} className={`${s.card} ${s.log}`} aria-label="Checkout change log, demo data">
      <div className={s.head}><b>Checkout change log</b><span className={s.demo}>demo data</span></div>
      <ul className={s.entries}>
        {LOG.map((e, i) => (
          <motion.li key={e.what} initial={{ opacity: 0, x: -12 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ ...glide, delay: 0.15 + i * 0.06 }}>
            <span className={s.when}>{e.when}</span>
            <span className={s.what}>{e.what}</span>
            <span className={`${s.status} ${s[e.status.toLowerCase()]}`}>{e.status}</span>
          </motion.li>
        ))}
      </ul>
      <p className={s.foot}>One view of what changed, and when.</p>
    </div>
  );
}

export default function HeroCards() {
  return (
    <>
      <span className={s.label}>live, not a screenshot</span>
      <Decoder />
      <Dashboard />
      <ChangeLog />
    </>
  );
}
