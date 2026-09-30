"use client";
import { motion, useInView } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { glide, slow } from "@/lib/motion";
import GlareHover from "./GlareHover";
import s from "./HeroCards.module.css";

// Desktop hero: three things she made, working, not pictures of them.
// The decoder is real code you can use; Hookwarden is public; the change log is generic demo data.

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

// Hookwarden: public, open source. An illustrative scan; the real tool gives three-state verdicts.
const SCAN = [
  { file: "stripe.ts", verdict: "verified" },
  { file: "orders.ts", verdict: "missing" },
  { file: "refunds.ts", verdict: "uncertain" },
] as const;

function Hookwarden() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { once: true, amount: 0.5 });
  return (
    <div ref={ref} className={`${s.card} ${s.hook}`}>
      <div className={s.head}><b>Hookwarden</b><span className={s.demo}>open source</span></div>
      <code className={s.cmd}>$ hookwarden scan ./api</code>
      <ul className={s.verdicts}>
        {SCAN.map((r, i) => (
          <motion.li key={r.file} initial={{ opacity: 0, x: -10 }} animate={on ? { opacity: 1, x: 0 } : {}} transition={{ ...glide, delay: 0.2 + i * 0.12 }}>
            <span className={s.file}>{r.file}</span>
            <span className={`${s.verdict} ${s[r.verdict]}`}>{r.verdict}</span>
          </motion.li>
        ))}
      </ul>
      <p className={s.foot}>21 providers. Nothing leaves your machine. <a href="https://github.com/Hookwarden/hookwarden" target="_blank" rel="noopener">See the code</a></p>
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
      <Hookwarden />
      <ChangeLog />
    </>
  );
}
