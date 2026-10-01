"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useCalm } from "@/lib/useCalm";
import SpotlightCard from "./SpotlightCard";
import Magnet from "./Magnet";
import s from "./PaymentJourney.module.css";

// Hero centerpiece: press Pay and follow one payment through the payments product.
// Risk and engineering run the steps; she owns the product: decisions, priorities, specs, delivery, measurement.
// Demo order, demo amount, no real data.
const METHODS = ["Card", "PayPal Pay Later", "Paze", "Amazon Pay"] as const;
type Method = (typeof METHODS)[number];
const CARD_GATEWAYS = ["Chase Paymentech", "NMI", "Braintree", "Stripe"];
const STEP_MS = 900;

const steps = (method: Method, gateway: string) => [
  method === "Card"
    ? { title: "3DS / SCA check", ok: "authenticated", mine: "I own the 3DS/SCA rollout across thousands of accounts, and measured what it did to conversion." }
    : { title: `${method} authorization`, ok: "authorized", mine: "I own these payment methods: Paze, PayPal Pay Later and Amazon Pay." },
  { title: `Routed to ${gateway}`, ok: "approved", mine: "I own the gateway integrations, and track approval rates across them." },
  { title: "Kount fraud check", ok: "low risk", mine: "Risk sets the rules. I own how Kount fits into checkout." },
  { title: "Webhook verified", ok: "signature ok", mine: "I built Hookwarden, open source, to catch the bugs at this step." },
  { title: "Every change logged", ok: "tracked", mine: "I run the change log in ClickUp, so leadership sees what changed, and when." },
];

export default function PaymentJourney() {
  const calm = useCalm();
  const [method, setMethod] = useState<Method>("Card");
  const [runs, setRuns] = useState(0); // which card gateway this run uses
  const [at, setAt] = useState(-1); // -1 idle, 0..4 running, 5 done
  const gateway = method === "Card" ? CARD_GATEWAYS[runs % CARD_GATEWAYS.length] : method === "Amazon Pay" ? "Amazon Pay" : method === "Paze" ? CARD_GATEWAYS[runs % CARD_GATEWAYS.length] : "PayPal";
  const list = steps(method, gateway);
  const running = at >= 0 && at < list.length;
  const done = at >= list.length;

  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setAt((v) => v + 1), calm ? 250 : STEP_MS);
    return () => clearTimeout(id);
  }, [at, running, calm]);

  const pay = () => {
    if (running) return;
    if (done) setRuns((r) => r + 1);
    setAt(0);
  };
  const pick = (m: Method) => { if (!running) { setMethod(m); setAt(-1); } };

  return (
    <SpotlightCard className={s.card} spotlightColor="rgba(51, 85, 255, 0.12)">
      <div className={s.head}>
        <span className={s.kicker}>Checkout · demo</span>
        <span className={s.order}>Order #1042</span>
      </div>
      <b className={s.amount}>$49.00</b>

      <div className={s.methods} role="radiogroup" aria-label="Pay with">
        {METHODS.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={m === method} className={s.method} onClick={() => pick(m)} disabled={running}>
            {m === method && <motion.span layoutId="pay-method" className={s.methodBg} transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
            <span>{m}</span>
          </button>
        ))}
      </div>

      <Magnet padding={40} magnetStrength={5} disabled={!!calm} wrapperClassName={s.payWrap}>
        <button type="button" className={s.pay} onClick={pay} disabled={running} data-done={done || undefined}>
          {running ? "Processing…" : done ? "Pay again ↻" : "Pay $49 →"}
        </button>
      </Magnet>

      <ol className={s.steps} aria-live="polite">
        {list.map((st, i) => {
          const state = i < at ? "done" : i === at && running ? "now" : "todo";
          return (
            <li key={i} data-state={state}>
              <span className={s.dot} aria-hidden="true">{state === "done" ? "✓" : ""}</span>
              <div className={s.stepText}>
                <span className={s.stepTitle}>{st.title}{state === "done" && <em className={s.ok}>{st.ok}</em>}</span>
                <AnimatePresence initial={false}>
                  {state !== "todo" && (
                    <motion.span className={s.mine} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35 }}>
                      {st.mine}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </li>
          );
        })}
      </ol>

      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.p key="done" className={s.outro} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            Paid. <span>That’s the payments product I own: what ships, in what order, and how it performs.</span>
          </motion.p>
        ) : (
          <motion.p key="hint" className={s.hint} initial={{ opacity: 0 }} animate={{ opacity: running ? 0 : 1 }} exit={{ opacity: 0 }}>
            Press pay and follow the money.
          </motion.p>
        )}
      </AnimatePresence>
    </SpotlightCard>
  );
}
