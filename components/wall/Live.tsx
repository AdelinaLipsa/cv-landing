"use client";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useCalm } from "@/lib/useCalm";
import { useContext, useEffect, useRef, useState } from "react";
import { Play } from "./play";
import { slow } from "@/lib/motion";
import CountUp from "../CountUp";
import s from "./wall.module.css";

// Live tiles: drawn in code, no data beyond the CV. Loops run only while at least half in view.
function useLive() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { amount: 0.5 });
  const play = useContext(Play); // the Work card plays its demo only while hovered
  return [ref, seen && play] as const;
}

// Reduced motion: the tile shows its finished state, no loops.
function useStill() {
  return useCalm();
}




export function Flow({ steps, accent = "var(--naruto)" }: { steps: string[]; accent?: string }) {
  const [ref, inView] = useLive();
  const still = useStill(); // always call the hook; && would skip it while off screen
  const on = inView && !still;
  return (
    <div ref={ref} className={`${s.live} ${s.white} ${s.flow}`}>
      <span className={s.flowRail} style={{ background: accent }} aria-hidden="true" />
      {on && (
        <motion.span
          className={s.flowDot}
          style={{ background: accent }}
          initial={{ top: "8%" }}
          animate={{ top: ["8%", "92%"] }}
          transition={{ duration: 2.8, ease: [0.65, 0, 0.35, 1], repeat: Infinity, repeatDelay: 0.8 }}
          aria-hidden="true"
        />
      )}
      {steps.map((st, i) => (
        <span key={st} className={s.flowStep} style={i === steps.length - 1 ? { background: accent } : undefined}>{st}</span>
      ))}
    </div>
  );
}


// Illustrative run, with Hookwarden's real three-state verdicts: verified, not-verified, manual-review.
const TERMINAL = [
  { t: "$ npx hookwarden scan ./api", c: "" },
  { t: "finding webhook handlers…", c: "muted" },
  { t: "✓ verified        stripe.ts", c: "ok" },
  { t: "✗ not-verified    orders.ts", c: "bad" },
  { t: "? manual-review   refunds.ts", c: "muted" },
  { t: "done. nothing left the machine.", c: "muted" },
];

export function Terminal() {
  const [ref, on] = useLive();
  const still = useStill();
  const [n, setN] = useState(0);
  useEffect(() => { setN(still || !on ? TERMINAL.length : 0); }, [still, on]); // paused: the finished scan; hovered: replay it
  useEffect(() => {
    if (!on || still) return;
    const id = setInterval(() => setN((v) => (v >= TERMINAL.length + 3 ? 0 : v + 1)), 700);
    return () => clearInterval(id);
  }, [on, still]);
  return (
    <div ref={ref} className={`${s.live} ${s.ink} ${s.term}`} aria-hidden="true">
      {TERMINAL.slice(0, n).map((l) => <span key={l.t} className={s[l.c]}>{l.t}</span>)}
      <span className={s.caret} />
    </div>
  );
}

// A step counter for looping demos: ticks while on screen; reduced motion holds the last step.
function useTick(n: number, ms: number, on: boolean) {
  const still = useStill();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!on || still) return;
    const id = setInterval(() => setI((v) => (v + 1) % n), ms);
    return () => clearInterval(id);
  }, [on, still, n, ms]);
  return still || !on ? n - 1 : i; // paused or reduced motion: show the finished state
}

// Param Decoder: a link comes apart into its parameters. Demo link, generic values.
// Param Decoder, its five modes in turn (from its README). Demo links on offer.example, no real affiliate.
// Inspect: reads the funnel from the path, catches a typo'd param and fixes it. Compare: why one link reports
// and the other doesn't. Batch: pass/fail over a column. Postback: a ready-to-paste Voluum postback.
// Decline: one code, explained. Paused: Inspect, fixed.
const MODES = ["Inspect", "Compare", "Batch", "Postback", "Decline"];
const STEPS = 4; // ticks per mode
const BATCH = [["…/?aff_id=1042&subid2=a9f3", true], ["…/?aff_id=&subid2=77c1", false], ["…/?aff_id=2210&subid2=b02e", true], ["…/?aff_id=1042&subid2=e81d", true]] as const;
export function DecoderDemo() {
  const [ref, on] = useLive();
  const t = useTick(MODES.length * STEPS, 750, on);
  const mode = on ? Math.floor(t / STEPS) : 0;
  const k = on ? t % STEPS : STEPS - 1; // progress inside the mode
  const fade = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, transition: { duration: 0.25 } };
  const row = (n: number) => ({ initial: { opacity: 0, x: -6 }, animate: { opacity: k >= n ? 1 : 0, x: k >= n ? 0 : -6 }, transition: { duration: 0.3 } });
  return (
    <div ref={ref} className={`${s.live} ${s.white} ${s.stack} ${s.pd}`}>
      <div className={s.pdTabs}>{MODES.map((m, i) => <span key={m} data-on={i === mode || undefined}>{m}</span>)}</div>
      <AnimatePresence mode="wait" initial={false}>
        {mode === 0 && (
          <motion.div key="inspect" className={s.pdBody} {...fade}>
            <span className={s.field}>offer.example/hu/vsl7/l1/af/?{k >= 2 ? "aff_id" : "af_id"}=1042&amp;subid2=a9f3c2</span>
            <motion.div className={s.pdRow} {...row(1)}><code>path</code><span>Hungarian · VSL 7 · lander 1</span></motion.div>
            <motion.div className={s.pdRow} {...row(1)}>
              <code>{k >= 2 ? "aff_id" : "af_id"}</code>
              {k >= 2 ? <span className={s.pdOk}>✓ fixed: pays the affiliate</span> : <span className={s.pdBad}>typo: did you mean aff_id? <b>Fix</b></span>}
            </motion.div>
            <motion.div className={s.pdRow} {...row(1)}><code>subid2</code><span>click ID for their tracker</span></motion.div>
            <motion.span className={s.pdNote} {...row(3)}>Copy diagnosis · clean link ready</motion.span>
          </motion.div>
        )}
        {mode === 1 && (
          <motion.div key="compare" className={s.pdBody} {...fade}>
            <div className={`${s.pdRow} ${s.pdHead}`}><code /><span>link A</span><span>link B</span></div>
            <motion.div className={s.pdRow} {...row(0)}><code>aff_id</code><span>1042</span><span>1042</span></motion.div>
            <motion.div className={s.pdRow} {...row(1)}><code>subid2</code><span>a9f3c2</span><span className={s.pdBad}>missing</span></motion.div>
            <motion.span className={s.pdNote} {...row(2)}>B still pays the affiliate, but their tracker never sees the sale.</motion.span>
          </motion.div>
        )}
        {mode === 2 && (
          <motion.div key="batch" className={s.pdBody} {...fade}>
            {BATCH.map(([l, ok], n) => (
              <motion.div key={l} className={s.pdRow} {...row(n === 3 ? 2 : n === 2 ? 1 : 0)}><code>{l}</code><span className={ok ? s.pdOk : s.pdBad}>{ok ? "✓ pass" : "✗ no aff_id"}</span></motion.div>
            ))}
            <motion.span className={s.pdNote} {...row(3)}>3 pass · 1 fail · Export CSV</motion.span>
          </motion.div>
        )}
        {mode === 3 && (
          <motion.div key="postback" className={s.pdBody} {...fade}>
            <div className={s.pdRow}><code>tracker</code><span>Voluum</span></div>
            <div className={s.pdRow}><code>click ID in</code><span>subid2</span></div>
            <motion.span className={`${s.field} ${s.pdUrl}`} {...row(1)}>…/postback?cid=<b>{"{SUBID2}"}</b>&amp;payout=<b>{"{COMMISSION_AMOUNT}"}</b>&amp;txid=<b>{"{ORDERID}"}</b></motion.span>
            <motion.span className={s.pdNote} {...row(2)}>Ready to paste · Copy</motion.span>
          </motion.div>
        )}
        {mode === 4 && (
          <motion.div key="decline" className={s.pdBody} {...fade}>
            <span className={s.field}>insufficient_funds</span>
            <motion.div className={s.pdRow} {...row(1)}><code>Stripe</code><span>The card has insufficient funds.</span></motion.div>
            <motion.div className={s.pdRow} {...row(2)}><code>verdict</code><span className={s.pdOk}>soft decline · worth a retry</span></motion.div>
            <motion.span className={s.pdNote} {...row(3)}>Same answer as Braintree 2001 or NMI 202.</motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Change log: entries move through their statuses. Demo entries, generic on purpose.
const LOG = ["3DS routing rule updated", "Pay Later at checkout", "Self-service refund flow"];
const STATUS = ["Specced", "Testing", "Shipped"];
export function ChangeLogDemo() {
  const [ref, on] = useLive();
  const t = useTick(3, 1600, on);
  return (
    <div ref={ref} className={`${s.live} ${s.white} ${s.stack}`}>
      {LOG.map((e, r) => {
        const st = (t + r) % 3;
        return <div key={e} className={s.logRow}><span>{e}</span><span className={`${s.pill} ${s[`st${st}`]}`}>{STATUS[st]}</span></div>;
      })}
      <span className={s.liveCap}>One view of what changed, and when.</span>
    </div>
  );
}

// BITE, recreated from its real popup and played as a loop: the skipper finds a sales video, skips it,
// counts what it beat, copies the checkout link; then the tracker checks the page. Demo host, no real account.
const SCENE = 17; // steps in the loop, ~0.75s each; the last ones hold the finished tracker
const CHECKS = ["Conversion tracking", "Tracking pixel", "Disclaimer script"];
export function BiteDemo() {
  const [ref, on] = useLive();
  const t = useTick(SCENE, 750, on);
  const skipper = t < 8;
  const running = t >= 1;
  const state = t < 1 ? "idle" : t < 2 ? "scanning" : t < 4 ? "playing" : "skipped";
  const n = (from: number) => (t >= from ? 1 : 0);
  return (
    <div ref={ref} className={`${s.live} ${s.bx}`} aria-label="BITE demo: the skipper skips a sales video and copies its checkout link, then the tracker finds the tracking code present.">
      <div className={s.bxTabs}><span data-on={skipper || undefined}>skipper</span><span data-on={!skipper || undefined}>tracker</span></div>
      {skipper ? (
        <>
          <div className={s.bxSec}><i>page</i>
            <p><b>host</b>offer.example</p>
            <p><b>state</b><span className={s.bxState} data-hot={t >= 2 || undefined}>[ {state} ]</span></p>
            <p><b>player</b>{t >= 2 ? "vturb" : "—"}</p>
          </div>
          <div className={s.bxSec}><i>power</i>
            <p className={s.bxToggleRow}><span className={s.bxToggle} data-on={running || undefined}><em /></span>{running ? "skipper running" : "skipper off"}</p>
          </div>
          <div className={s.bxSec}><i>actions</i>
            <span className={s.bxBtn} data-press={t === 3 || undefined}>force a skip</span>
            <span className={s.bxBtn} data-press={t === 6 || undefined}>copy checkout<em>{t >= 6 ? (t === 6 ? "copied ✓" : "1") : "0"}</em></span>
          </div>
          <div className={s.bxSec}><i>stats</i>
            <p className={s.bxStat}><b>videos skipped</b><em data-up={t === 4 || undefined}>{n(4)}</em></p>
            <p className={s.bxStat}><b>cta delays fired</b><em data-up={t === 5 || undefined}>{n(5)}</em></p>
            <p className={s.bxStat}><b>fake-urgency sped up</b><em data-up={t === 5 || undefined}>{n(5)}</em></p>
          </div>
          <div className={s.bxSec}><i>review</i>
            <p className={s.bxToggleRow}><span className={s.bxToggle}><em /></span>review mode off</p>
            {/* the seekbar: crawls while the video plays, jumps to the end on the skip */}
            <span className={s.bxSeek}><motion.em animate={{ width: t >= 4 ? "100%" : t >= 2 ? "14%" : "0%" }} transition={{ duration: t >= 4 ? 0.35 : 1.4, ease: "linear" }} /></span>
            <p className={s.bxTime}>{t >= 4 ? "12:47 / 12:47" : t >= 2 ? "1:48 / 12:47" : "0:00 / --:--"}</p>
          </div>
        </>
      ) : (
        <>
          <div className={s.bxSec}><i>page</i><p><b>host</b>offer.example</p></div>
          <div className={s.bxSec}><i>tracking checker</i>
            <span className={s.bxBtn} data-press={t === 9 || undefined}>{t === 9 ? "checking…" : "check tracking"}</span>
            <span className={s.bxBtn}>deep scan</span>
          </div>
          <motion.div className={s.bxVerdict} animate={{ opacity: t >= 10 ? 1 : 0, y: t >= 10 ? 0 : 6 }} transition={{ duration: 0.4 }}>
            <span className={s.present}>PRESENT</span> offer.example
          </motion.div>
          {CHECKS.map((c, k) => (
            <motion.p key={c} className={s.bxCheck} animate={{ opacity: t >= 11 + k ? 1 : 0.12 }} transition={{ duration: 0.35 }}>
              <span>✓ {c}</span><em>PRESENT</em>
            </motion.p>
          ))}
          <motion.div className={s.bxSec} animate={{ opacity: t >= 14 ? 1 : 0.12 }} transition={{ duration: 0.35 }}>
            <i>also on this page</i>
            <p>· checkout link</p>
            <p className={s.bxLinks}><span>re-check</span><span>copy report</span></p>
          </motion.div>
        </>
      )}
    </div>
  );
}

// This site: what it's made of, typed out. All true of this repo.
const SITE = ["next 16 · react 19 · typescript", "motion · gsap · three", "react bits, restyled", "lofi: web audio, no files", "career: a git graph", "cv as json: /api/cv"];
export function ThisSite() {
  const [ref, on] = useLive();
  const t = useTick(SITE.length + 2, 700, on);
  return (
    <div ref={ref} className={`${s.live} ${s.white} ${s.stack} ${s.mono}`}>
      {SITE.map((l, i) => <motion.span key={l} animate={{ opacity: t > i ? 1 : 0 }}>› {l}</motion.span>)}
    </div>
  );
}

// Gateway routing: each payment goes to one of the gateways she owns (CV).
const GATEWAYS = ["Chase Paymentech", "NMI", "Braintree", "PayPal", "Stripe"];
export function Gateways() {
  const [ref, on] = useLive();
  const t = useTick(GATEWAYS.length, 1300, on);
  return (
    <div ref={ref} className={`${s.live} ${s.white} ${s.route}`}>
      <span className={s.node}>Checkout</span>
      <span className={s.arrow} aria-hidden="true">↓</span>
      <span className={`${s.node} ${s.nodeInk}`}>3DS / SCA · routing</span>
      <span className={s.arrow} aria-hidden="true">↓</span>
      <div className={s.gws}>
        {GATEWAYS.map((g, i) => (
          <span key={g} className={s.gw} data-on={i === t || undefined}>{g}</span>
        ))}
      </div>
    </div>
  );
}

// Alternative payment methods at checkout (CV: Paze, PayPal Pay Later, Amazon Pay). Demo amount.
const METHODS = ["Card", "PayPal Pay Later", "Paze", "Amazon Pay"];
export function Checkout() {
  const [ref, on] = useLive();
  const t = useTick(METHODS.length, 1500, on);
  return (
    <div ref={ref} className={`${s.live} ${s.white} ${s.checkout}`}>
      <span className={s.liveCap}>Checkout</span>
      <b className={s.total}>$49.00</b>
      {METHODS.map((m, i) => <span key={m} className={s.payOpt} data-on={i === t || undefined}><i />{m}</span>)}
      <span className={s.payBtn}>Pay with {METHODS[t]}</span>
    </div>
  );
}




// The AgroCity app on a phone: Capacitor, then both stores.
// What Capacitor does, in four scenes: one Vue web app, `npx cap sync` copies it into native iOS and Android
// projects, each builds (iOS in Xcode), and both ship to their stores. Paused: the published end state.
const CAP_SCENES = [0, 0, 1, 1, 2, 2, 2, 3, 3, 3];
export function MobileApp() {
  const [ref, on] = useLive();
  const t = useTick(CAP_SCENES.length, 700, on);
  const scene = CAP_SCENES[t];
  const fade = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.35 } };
  return (
    <div ref={ref} className={`${s.live} ${s.white} ${s.cap}`}>
      <span className={s.appBar}>Capacitor</span>
      <AnimatePresence mode="wait" initial={false}>
        {scene === 0 && (
          <motion.div key="web" className={s.capScene} {...fade}>
            <span className={s.capTag}>web app · Vue</span>
            <div className={s.capWeb}>
              <i className={s.capWebBar} />
              {[0, 1, 2].map((k) => <motion.i key={k} className={s.capRow} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.1 + k * 0.12, duration: 0.4 }} />)}
            </div>
          </motion.div>
        )}
        {scene === 1 && (
          <motion.div key="sync" className={`${s.capScene} ${s.capTerm}`} {...fade}>
            <span>$ npx cap sync</span>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>✓ copied to ios/</motion.span>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>✓ copied to android/</motion.span>
          </motion.div>
        )}
        {scene === 2 && (
          <motion.div key="build" className={s.capScene} {...fade}>
            {["iOS · Xcode", "Android"].map((n, k) => (
              <div key={n} className={s.capBuild}>
                <span>{n}</span>
                <i><motion.b initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: k * 0.2, duration: 1.4, ease: "easeInOut" }} /></i>
              </div>
            ))}
          </motion.div>
        )}
        {scene === 3 && (
          <motion.div key="ship" className={s.capScene} {...fade}>
            {["App Store", "Google Play"].map((n, k) => (
              <motion.div key={n} className={s.capStore} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: k * 0.18, type: "spring", stiffness: 260, damping: 18 }}>
                <span>{n}</span><b>✓ live</b>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <div className={s.capDots}>{[0, 1, 2, 3].map((k) => <i key={k} data-on={k === scene || undefined} />)}</div>
    </div>
  );
}

