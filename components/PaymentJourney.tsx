"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useCalm } from "@/lib/useCalm";
import { unlock } from "@/lib/achievements";
import Magnet from "./Magnet";
import DecryptedText from "./DecryptedText";
import { timeline, states, type Fail, type State } from "@/lib/checkoutRun";
import s from "./PaymentJourney.module.css";

// The Workbench's Product mode: press Pay and follow one payment through the payments product.
// Risk and engineering run the steps; she owns the product: decisions, priorities, specs, delivery, measurement.
// "Break it" runs the same payment with one thing going wrong, to show it fails safe or recovers.
// Demo order, demo amount, demo error codes, no real data.
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

// One thing goes wrong at one step. It either recovers (the run goes on) or stops safely (the run ends, nobody charged).
const BREAKS = {
  "Gateway down": (gw: string, next: string): Fail => ({ step: 1, code: `${gw} · 504 timeout`, recover: `rerouted to ${next}` }),
  "Card declined": (): Fail => ({ step: 1, code: "05 · do not honor", stop: "Declined, not charged. The customer gets a clear message and another way to pay." }),
  "3DS fails": (): Fail => ({ step: 0, code: "challenge failed", stop: "Not charged. The bank couldn’t authenticate the cardholder, so the payment never went through." }),
  "Fraud flag": (): Fail => ({ step: 2, code: "high risk · score 92", stop: "Held for review, not charged. Risk’s rules caught it before anything shipped." }),
  "Webhook twice": (): Fail => ({ step: 3, code: "evt_8Kq delivered twice", recover: "deduplicated, one order" }),
} as const;
type Break = keyof typeof BREAKS;
const BREAK_NAMES = Object.keys(BREAKS) as Break[];

export default function PaymentJourney() {
  const calm = useCalm();
  const [method, setMethod] = useState<Method>("Card");
  const [runs, setRuns] = useState(0); // which card gateway this run uses
  const [broken, setBroken] = useState<Break | null>(null);
  const [at, setAt] = useState(-1); // -1 idle, then events played so far
  const tried = useRef(new Set<Break>());
  const gateway = method === "Card" ? CARD_GATEWAYS[runs % CARD_GATEWAYS.length] : method === "Amazon Pay" ? "Amazon Pay" : method === "Paze" ? CARD_GATEWAYS[runs % CARD_GATEWAYS.length] : "PayPal";
  const next = CARD_GATEWAYS[(runs + 1) % CARD_GATEWAYS.length];
  const list = steps(method, gateway);
  const fail = broken ? BREAKS[broken](gateway, next) : null;
  const ev = timeline(list.length, fail);
  const running = at >= 0 && at < ev.length;
  const done = at >= ev.length;
  const stopped = done && !!fail?.stop;
  const justFailed = ev[at - 1]?.to === "failed";
  const st = at < 0 ? list.map(() => "todo" as State) : states(list.length, ev, at);

  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setAt((v) => v + 1), calm ? 250 : justFailed ? STEP_MS * 1.6 : STEP_MS); // a failure holds a beat longer
    return () => clearTimeout(id);
  }, [at, running, calm, justFailed]);

  const start = (b: Break | null) => {
    if (running) return;
    if (done) setRuns((r) => r + 1);
    setBroken(b);
    if (b) {
      setMethod("Card"); // every break is a card story
      tried.current.add(b);
      if (tried.current.size === BREAK_NAMES.length) unlock("chaos");
    }
    setAt(1);
  };
  const pick = (m: Method) => { if (!running) { setMethod(m); setBroken(null); setAt(-1); } };

  return (
    <div className={s.card}>
      <div className={s.head}>
        <span className={s.kicker}>Product owner · payments</span>
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
        <button type="button" className={s.pay} onClick={() => start(null)} disabled={running} data-done={(done && !stopped) || undefined} data-stopped={stopped || undefined}>
          {running ? "Processing…" : done ? "Pay again ↻" : "Pay $49 →"}
        </button>
      </Magnet>

      <ol className={s.steps} aria-live="polite">
        {list.map((step, i) => {
          const state = st[i];
          return (
            <li key={i} data-state={state}>
              <span className={s.dot} aria-hidden="true">{state === "done" || state === "recovered" ? "✓" : state === "failed" ? "✕" : ""}</span>
              <div className={s.stepText}>
                <span className={s.stepTitle}>
                  {step.title}
                  {state === "done" && <em className={s.ok}>{step.ok}</em>}
                  {(state === "failed" || state === "recovered") && fail && <em className={s.err}><DecryptedText text={fail.code} animateOn="view" sequential speed={28} characters="0123456789ABCDEF#_·" /></em>}
                  {state === "recovered" && fail?.recover && <em className={s.ok}>{fail.recover}</em>}
                </span>
                <AnimatePresence initial={false}>
                  {state !== "todo" && (
                    <motion.span className={s.mine} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35 }}>
                      {step.mine}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </li>
          );
        })}
      </ol>

      <AnimatePresence mode="wait" initial={false}>
        {stopped ? (
          <motion.p key="stopped" className={`${s.outro} ${s.safe}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            Stopped safely. <span>{fail!.stop}</span>
          </motion.p>
        ) : done ? (
          <motion.p key={`done-${broken}`} className={s.outro} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {broken ? "Recovered and paid." : "Paid."} <span>I define requirements and lead delivery across gateways, 3DS/SCA, alternative payments and Kount, tracking approval and conversion.</span>
          </motion.p>
        ) : (
          <motion.p key="hint" className={s.hint} initial={{ opacity: 0 }} animate={{ opacity: running ? 0 : 1 }} exit={{ opacity: 0 }}>
            Press pay and follow the money.
          </motion.p>
        )}
      </AnimatePresence>

      {/* Break it: the same payment with one thing going wrong */}
      <div className={s.breaks} role="group" aria-label="Break the checkout">
        <span className={s.breakLabel}>Break it:</span>
        {BREAK_NAMES.map((b) => (
          <button key={b} type="button" className={s.break} aria-pressed={b === broken && at >= 0} onClick={() => start(b)} disabled={running}>{b}</button>
        ))}
      </div>
    </div>
  );
}
