"use client";
import { motion, useInView } from "motion/react";
import { useCalm } from "@/lib/useCalm";
import { useEffect, useRef, useState } from "react";
import { slow } from "@/lib/motion";
import CountUp from "../CountUp";
import s from "./wall.module.css";

// Live tiles: drawn in code, no data beyond the CV. Loops run only while at least half in view.
function useLive() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { amount: 0.5 });
  return [ref, on] as const;
}

// Reduced motion: the tile shows its finished state, no loops.
function useStill() {
  return useCalm();
}

export function PaymentsChart() {
  const [ref, on] = useLive();
  // Plot runs 30% (bottom) to 60% (top). Only the CV's band is drawn: 43–45%, June to August.
  const top = (v: number) => `${((60 - v) / 30) * 100}%`;
  return (
    <div ref={ref} className={`${s.live} ${s.white}`}>
      <span className={s.liveCap}>Payment success, June to August</span>
      <div className={s.plot} aria-hidden="true">
        <motion.span className={s.band} style={{ top: top(45), bottom: `calc(100% - ${top(43)})`, originX: 0 }} initial={{ scaleX: 0 }} animate={{ scaleX: on ? 1 : 0 }} transition={slow} />
        <motion.span className={s.bandLine} style={{ top: top(44), originX: 0 }} initial={{ scaleX: 0 }} animate={{ scaleX: on ? 1 : 0 }} transition={{ ...slow, delay: 0.2 }} />
        <b className={s.bandLabel} style={{ top: `calc(${top(45)} - 22px)` }}><CountUp from={30} to={43} startWhen={on} duration={1.4} />–<CountUp from={30} to={45} startWhen={on} duration={1.4} />%</b>
      </div>
      <span className={s.months}><span>Jun</span><span>Jul</span><span>Aug</span></span>
    </div>
  );
}

export function Accounts25() {
  const [ref, on] = useLive();
  return (
    <div ref={ref} className={`${s.live} ${s.white}`}>
      <div className={s.grid25} aria-hidden="true">
        {Array.from({ length: 25 }, (_, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0.18, scale: 0.8 }}
            animate={on ? { opacity: [0.18, 1, 0.55], scale: 1 } : { opacity: 0.18, scale: 0.8 }}
            transition={{ duration: 1.6, delay: (i % 5) * 0.06 + Math.floor(i / 5) * 0.06, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>
      <span className={s.liveCap}><CountUp to={25} startWhen={on} duration={1.6} /> accounts, 3DS effect separated out</span>
    </div>
  );
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

export function MicroFrontends() {
  const [ref, inView] = useLive();
  const still = useStill(); // always call the hook; && would skip it while off screen
  const on = inView && !still;
  const apps = [40, 150, 260];
  return (
    <div ref={ref} className={`${s.live} ${s.white}`}>
      <svg viewBox="0 0 300 170" className={s.svg} aria-hidden="true">
        <rect x="20" y="10" width="260" height="36" rx="10" fill="var(--ink)" />
        <text x="150" y="33" textAnchor="middle" className={s.svgOnInk}>orchestrator</text>
        {apps.map((x, i) => (
          <g key={x}>
            <line x1={x} x2={x} y1="46" y2="110" stroke="var(--line)" strokeWidth="2" />
            {on && (
              <motion.circle
                cx={x} r="4" fill="var(--broth)"
                initial={{ cy: 46 }} animate={{ cy: [46, 110, 46] }}
                transition={{ duration: 2.4, delay: i * 0.5, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }}
              />
            )}
            <rect x={x - 45} y="110" width="90" height="50" rx="12" fill="#fff" stroke="var(--line)" />
            <text x={x} y="140" textAnchor="middle" className={s.svgLabel}>Vue app</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function WalletPass() {
  const [ref, on] = useLive();
  return (
    <div ref={ref} className={`${s.live} ${s.mist}`}>
      <motion.div className={s.pass} animate={on ? { y: [0, -5, 0] } : { y: 0 }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <span className={s.passBrand}>Your brand</span>
        <span className={s.passLabel}>Member</span>
        <span className={s.passName}>A. Member</span>
        <span className={s.passQr} aria-hidden="true">
          {Array.from({ length: 49 }, (_, i) => <i key={i} style={{ opacity: (i * 7 + (i >> 2)) % 3 ? 1 : 0 }} />)}
        </span>
      </motion.div>
    </div>
  );
}

// Illustrative run. Hookwarden's real verdicts are three-state: verified, missing, uncertain.
const TERMINAL = [
  { t: "$ hookwarden scan ./api", c: "" },
  { t: "finding webhook handlers…", c: "muted" },
  { t: "✓ verified    stripe.ts", c: "ok" },
  { t: "✗ missing     orders.ts", c: "bad" },
  { t: "? uncertain   refunds.ts", c: "muted" },
  { t: "done. nothing left the machine.", c: "muted" },
];

export function Terminal() {
  const [ref, on] = useLive();
  const still = useStill();
  const [n, setN] = useState(0);
  useEffect(() => { if (still) setN(TERMINAL.length); }, [still]);
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
