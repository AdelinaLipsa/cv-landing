import { AnimatePresence, motion, useInView, type Transition } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { TextPlugin } from "gsap/TextPlugin";
import { useGSAP } from "@gsap/react";
import type { UI } from "../Shell";
import type { BuildKey } from "@/content/tour";
import { penAt, segments, sOf, tipOf } from "@/lib/careerPen";
import { useCalm } from "@/lib/useCalm";
import { certifications, education, jobs, languages, stillShipping, ventures, type Branch } from "@/content/cv";
import ShuffleHeading from "../ShuffleHeading";
import Land from "../Land";
import { Rich } from "../Keyword";
import CountUp from "../CountUp";
import SpotlightCard from "../SpotlightCard";
import GlareHover from "../GlareHover";
import { useMedia } from "@/lib/useMedia";
import p from "./pane.module.css";
import { ease } from "@/lib/motion";
import s from "./Career.module.css";

if (typeof window !== "undefined") gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin, ScrambleTextPlugin, TextPlugin, useGSAP);

type Row =
  | { kind: "merge" }
  | { kind: "fork" }
  | { kind: "job"; job: (typeof jobs)[number] };

// git log order, newest first. product forks off dev in 2025; the merge commit sits on both.
const rows: Row[] = [
  { kind: "merge" },
  ...jobs.filter((j) => j.branch === "product").map((job) => ({ kind: "job" as const, job })),
  { kind: "fork" },
  ...jobs.filter((j) => j.branch === "dev").map((job) => ({ kind: "job" as const, job })),
];

const H = 76;
const LANE: Record<Branch, number> = { dev: 14, product: 42 };
const y = (i: number) => i * H + H / 2;
const forkAt = rows.findIndex((r) => r.kind === "fork");
const COLOR: Record<Branch, string> = { dev: "var(--broth)", product: "var(--naruto)" };
// History grows from the first commit up: the oldest row lands first.
const STEP = 0.14;
const at = (i: number) => (rows.length - 1 - i) * STEP;
const DRAW = { duration: rows.length * STEP, ease: "linear" } as const;
const pop = (i: number) => ({ type: "tween", duration: 0.46, ease, delay: at(i) }) as const;
const dot = { transformBox: "fill-box", transformOrigin: "center" } as const;
const NOW = rows.findIndex((r) => r.kind === "job" && r.job.dates.includes("now")); // the current job
const DESKTOP = ["(min-width:1000px)"];
const ONE = [1];
const SHIPPING = "Param Decoder, BITE, change log, Hookwarden";

// The guide: each row is a piece the tour builds, and the pen draws the graph up to the highest one.
const N = rows.length;
const FORK = sOf(forkAt, N);
const keyOf = (r: Row) => (r.kind === "merge" ? "career.rest" : r.kind === "fork" ? "career.fork" : `career.${r.job.id}`) as BuildKey;
const nameOf = (r: Row) => (r.kind === "merge" ? stillShipping.title : r.kind === "fork" ? "product" : r.job.company); // HEAD's tag: words already on the rows
const DEV_D = `M${LANE.dev} ${y(N - 1)} V${y(0)}`;
const PROD_D = `M${LANE.dev} ${y(forkAt)} C${LANE.dev} ${y(forkAt) - 30} ${LANE.product} ${y(forkAt) - 20} ${LANE.product} ${y(forkAt - 1)} V${y(0)}`;
// Decorative commit hashes, fixed per row.
const HASH = rows.map((r) => [...(r.kind === "job" ? r.job.id : r.kind)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261).toString(16).padStart(8, "0").slice(0, 7));
const HEX = "0123456789abcdef";
// A commit stamps: 0 → 1.15 → 1, no bounce. One ring goes out with it.
const STAMP = [0, 1.15, 1];
const STAMPED: Transition = { duration: 0.46, times: [0, 0.6, 1], ease: ["easeOut", "easeInOut"] };
const UNSTAMPED = { duration: 0.2, ease } as const;
const QUICK = { duration: 0.46, ease } as const;
const RING = { duration: 0.9, ease: [0.22, 1, 0.36, 1] } as const;

// Numbers for the header, all counted from cv.ts.
const STATS = [
  { n: new Date().getFullYear() - 2020, label: "years shipping" },
  { n: jobs.length, label: "teams" },
  { n: certifications.length, label: "certifications" },
  { n: 2, label: "branches" },
];

// Languages as a level, 1 to 5.
const LEVEL: Record<string, number> = { native: 5, "full professional": 4, "limited working": 2, elementary: 1 };

const detail = (r: Row) =>
  r.kind === "merge"
    ? { title: stillShipping.title, meta: `Internal tools, ${stillShipping.dates}. On both branches.`, lines: stillShipping.lines, stack: stillShipping.stack, branch: "both" }
    : r.kind === "job"
      ? { title: r.job.company, meta: `${r.job.role}. ${r.job.dates}, ${r.job.place}.`, lines: r.job.lines, stack: r.job.stack, branch: r.job.branch }
      : null;

// React Bits GlareHover: a light sweeps across cards on hover.
const GLARE = { width: "auto", height: "auto", background: "var(--surface)", borderColor: "transparent", glareColor: "#3355ff", glareOpacity: 0.16, glareSize: 240, transitionDuration: 800 } as const;


function Commit({ title, meta, lines, stack }: { title: string; meta: string; lines: string[]; stack: string[] }) {
  return (
    <>
      <h2 className={p.sheetTitle}>{title}</h2>
      <p className={p.sheetMeta}>{meta}</p>
      <ul className={p.sheetList}>{lines.map((l) => <li key={l}><Rich text={l} /></li>)}</ul>
      {stack.length > 0 && <div className={p.chips}>{stack.map((c) => <span key={c} className={p.chip} data-skin="chip">{c}</span>)}</div>}
    </>
  );
}

export default function Career({ ui }: { ui: UI }) {
  const graph = useRef<HTMLDivElement>(null);
  const visible = useInView(graph, { amount: 0.25 });
  const entered = useInView(graph, { amount: 0.25, once: true });
  const desktop = useMedia(DESKTOP, ONE, 0) === 1;
  const calm = useCalm();
  const { touring } = ui;
  const [sel, setSel] = useState(NOW);

  // The guide's pen: `pen` is HEAD's position (lib/careerPen), `inked` the highest row it has reached.
  // Every built-set change kills the running move and starts from wherever the pen is, so the latest step wins.
  const devEl = useRef<SVGPathElement>(null), prodEl = useRef<SVGPathElement>(null), mergeEl = useRef<SVGLineElement>(null);
  const headEl = useRef<SVGGElement>(null), tagEl = useRef<SVGTextElement>(null);
  const hashEls = useRef<(HTMLElement | null)[]>([]);
  const pen = useRef(-1), ink = useRef(-1), lastInk = useRef(-1);
  const run = useRef<gsap.core.Animation | null>(null);
  const [inked, setInked] = useState(-1);
  const tip = touring ? tipOf(rows.map((r) => ui.built(keyOf(r))), FORK) : N - 1;

  useGSAP(() => {
    run.current?.kill();
    if (!touring) { pen.current = ink.current = lastInk.current = -1; setInked(-1); return; }
    const dev = devEl.current!, prod = prodEl.current!, merge = mergeEl.current!, head = headEl.current!;
    const devRaw = MotionPathPlugin.cacheRawPathMeasurements(MotionPathPlugin.getRawPath(dev));
    const prodRaw = MotionPathPlugin.cacheRawPathMeasurements(MotionPathPlugin.getRawPath(prod));
    const total = prod.getTotalLength(), curve = total - (forkAt - 1) * H; // the curve out of the fork, then the straight climb
    const draw = () => {
      const p = penAt(pen.current, FORK, N);
      const len = Math.min(p.prod, 1) * curve + Math.max(0, p.prod - 1) * H;
      gsap.set(dev, { drawSVG: `0% ${p.dev * 100}%`, visibility: p.dev ? "visible" : "hidden" });
      gsap.set(prod, { drawSVG: `0 ${len}`, visibility: len ? "visible" : "hidden" });
      gsap.set(merge, { drawSVG: `0% ${p.merge * 100}%`, visibility: p.merge ? "visible" : "hidden" });
      const at = p.lane === "product" ? MotionPathPlugin.getPositionOnPath(prodRaw, len / total) : MotionPathPlugin.getPositionOnPath(devRaw, p.dev);
      gsap.set(head, { x: at.x, y: at.y, opacity: p.head });
      const k = Math.floor(pen.current + 1e-6);
      if (k !== ink.current) setInked((ink.current = k));
    };
    const moves = segments(pen.current, tip, N);
    if (calm || !moves.length) { pen.current = tip; draw(); return; }
    draw();
    const tl = gsap.timeline({ paused: true });
    for (const m of moves) tl.to(pen, { current: m.to, duration: m.dur, ease: "none", onUpdate: draw });
    run.current = gsap.to(tl, { time: tl.duration(), duration: tl.duration(), ease: "sine.inOut" }); // the plotter eases in and out of the whole move
  }, { dependencies: [touring, tip, calm] });

  // As the pen reaches a row: HEAD's tag retypes to it, and each new commit's hash flickers once.
  useEffect(() => {
    if (!touring) return;
    const from = lastInk.current;
    lastInk.current = inked;
    const tag = tagEl.current;
    if (tag && inked >= 0) {
      const text = `HEAD → ${nameOf(rows[N - 1 - inked])}`;
      if (calm) tag.textContent = text;
      else {
        gsap.killTweensOf(tag); // the tag backspaces to HEAD's arrow, then types the new name
        gsap.timeline().to(tag, { duration: 0.12, text: "HEAD → ", ease: "none" }).to(tag, { duration: 0.24, text, ease: "none" });
      }
    }
    if (calm) return;
    for (let k = from + 1; k <= inked; k++) {
      const i = N - 1 - k, el = hashEls.current[i];
      if (el) gsap.fromTo(el, { textContent: "" }, { duration: 0.3, scrambleText: { text: HASH[i], chars: HEX, speed: 1 }, overwrite: true });
    }
  }, [touring, inked, calm]);

  const inkedRow = (i: number) => sOf(i, N) <= inked;
  const headOn = !touring || ui.built("career.head");
  const restOn = !touring || inked >= N - 1;
  const eduOn = (what: string) => !touring || ui.built(what === "Psychology" ? "career.edu-psychology" : "career.edu-web");
  // The card follows the guide: the job being spoken about, else the newest commit on the graph.
  const jobAt = ui.job ? rows.findIndex((r) => r.kind === "job" && r.job.id === ui.job) : -1;
  const shown = touring ? (jobAt >= 0 ? jobAt : rows.findIndex((r, i) => r.kind === "job" && inkedRow(i))) : sel;
  const cur = shown >= 0 ? detail(rows[shown]) : null;
  // A card lands when it is built (a fresh Land plays); until then it keeps its space, hidden.
  const card = (on: boolean, delay: number, body: ReactNode) => (on ? <Land as="section" delay={delay}>{body}</Land> : <section style={{ visibility: "hidden" }}>{body}</section>);
  // Desktop shows the commit in the side panel; phones open it in a sheet.
  const pick = (i: number) => {
    if (desktop) return setSel(i);
    const d = detail(rows[i]);
    if (d) ui.sheet(d.title, <Commit {...d} />);
  };

  return (
    <div className={p.column}>
      <div className={s.head}>
        <h1 className={p.title} data-skin="title">{headOn ? <ShuffleHeading text="Career" /> : <span style={{ visibility: "hidden" }}>Career</span>}</h1>
        <div className={s.legend} style={{ opacity: headOn ? 1 : 0 }}>
          <span><i style={{ background: COLOR.dev }} />dev</span>
          <span><i style={{ background: COLOR.product }} />product</span>
        </div>
        <motion.dl className={s.stats} initial={false} animate={restOn ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }} transition={QUICK}>
          {STATS.map((st) => (
            <GlareHover key={st.label} {...GLARE} borderRadius="16px" className={s.stat} data-skin="card tile"><dt><CountUp to={st.n} duration={1.4} startWhen={visible && restOn} /></dt><dd>{st.label}</dd></GlareHover>
          ))}
        </motion.dl>
      </div>

      <div className={s.layout}>
        <div ref={graph} className={s.graph} style={{ height: rows.length * H }}>
          <svg className={s.svg} data-tour="graph" width="60" height={rows.length * H} aria-hidden="true">
            {touring ? (
              // The guide: a pen plotter (GSAP DrawSVG) draws the lines up to HEAD
              <>
                <path ref={devEl} d={DEV_D} stroke={COLOR.dev} strokeWidth="4" strokeLinecap="round" fill="none" visibility="hidden" />
                <path ref={prodEl} d={PROD_D} stroke={COLOR.product} strokeWidth="4" fill="none" strokeLinecap="round" visibility="hidden" />
                <line ref={mergeEl} x1={LANE.dev} x2={LANE.product} y1={y(0)} y2={y(0)} stroke={COLOR.product} strokeWidth="4" visibility="hidden" />
              </>
            ) : (
              <>
                <motion.line x1={LANE.dev} x2={LANE.dev} y1={y(rows.length - 1)} y2={y(0)} stroke={COLOR.dev} strokeWidth="4" strokeLinecap="round" initial={entered ? false : { pathLength: 0 }} animate={{ pathLength: entered ? 1 : 0 }} transition={DRAW} />
                <motion.path
                  d={PROD_D}
                  stroke={COLOR.product}
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  initial={entered ? false : { pathLength: 0 }}
                  animate={{ pathLength: entered ? 1 : 0 }}
                  transition={{ duration: forkAt * STEP, ease: "linear", delay: at(forkAt) }}
                />
                <motion.line x1={LANE.dev} x2={LANE.product} y1={y(0)} y2={y(0)} stroke={COLOR.product} strokeWidth="4" initial={entered ? false : { pathLength: 0 }} animate={{ pathLength: entered ? 1 : 0 }} transition={{ duration: 0.3, delay: at(0) }} />
              </>
            )}
            {rows.map((r, i) => {
              // Outer group: the guide's stamp (a no-op at scale 1 with the guide closed). Inner: today's pop and the selected job's size.
              const on = !touring || inkedRow(i);
              const live = touring || entered;
              const inner = touring ? QUICK : pop(i);
              const lanes = r.kind === "merge" ? [LANE.dev, LANE.product] : [r.kind === "fork" ? LANE.dev : LANE[r.job.branch]];
              const color = r.kind === "job" ? COLOR[r.job.branch] : COLOR.product;
              let mark: ReactNode;
              if (r.kind === "merge") {
                mark = (
                  <motion.g style={dot} initial={{ scale: 0 }} animate={{ scale: live ? 1 : 0 }} transition={inner}>
                    <circle cx={LANE.dev} cy={y(i)} r="7" fill="var(--paper)" stroke={COLOR.dev} strokeWidth="3" />
                    <circle cx={LANE.product} cy={y(i)} r="7" fill="var(--paper)" stroke={COLOR.product} strokeWidth="3" />
                  </motion.g>
                );
              } else if (r.kind === "fork") {
                mark = <motion.circle cx={LANE.dev} cy={y(i)} r="5" fill={COLOR.product} style={dot} initial={{ scale: 0 }} animate={{ scale: live ? 1 : 0 }} transition={inner} />;
              } else {
                const big = desktop && i === shown;
                mark = <motion.circle cx={LANE[r.job.branch]} cy={y(i)} r="7" fill={COLOR[r.job.branch]} style={dot} initial={{ scale: 0 }} animate={{ scale: live ? (big ? 1.45 : 1) : 0 }} transition={inner} />;
              }
              return (
                <g key={keyOf(r)}>
                  <motion.g style={dot} initial={touring ? { scale: 0 } : false} animate={{ scale: on ? (touring ? STAMP : 1) : 0 }} transition={on ? STAMPED : UNSTAMPED}>{mark}</motion.g>
                  {touring && on && lanes.map((x, k) => (
                    <motion.circle key={k} cx={x} cy={y(i)} r="7" fill="none" stroke={r.kind === "merge" && k === 0 ? COLOR.dev : color} strokeWidth="2" style={dot} initial={{ scale: 1, opacity: 0.7 }} animate={{ scale: 2.6, opacity: 0 }} transition={RING} />
                  ))}
                </g>
              );
            })}
            {/* HEAD rides the pen's tip, with its tag above it, in the row the pen is about to reach */}
            {touring && (
              <g ref={headEl} opacity="0">
                <circle r="4" fill="var(--ink)" />
                <text ref={tagEl} x="9" y={-H / 2 + 1} className={s.headTag} />
              </g>
            )}
            {/* Live: a ring keeps pulsing out of the current job and the merge commit */}
            {visible && restOn && [
              { x: LANE[(rows[NOW] as { job: { branch: Branch } }).job.branch], y: y(NOW), c: COLOR.product },
              { x: LANE.dev, y: y(0), c: COLOR.dev },
              { x: LANE.product, y: y(0), c: COLOR.product },
            ].map((d, k) => (
              <motion.circle key={k} cx={d.x} cy={d.y} r="7" fill="none" stroke={d.c} strokeWidth="2" style={dot} initial={{ scale: 1, opacity: 0.45 }} animate={{ scale: 2.1, opacity: 0 }} transition={{ duration: 2.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: k * 0.45 }} />
            ))}
          </svg>

          <ol className={s.rows}>
            {rows.map((r, i) => {
              const on = touring ? inkedRow(i) : entered;
              return (
              <motion.li key={i} style={{ height: H }} data-tour={r.kind === "job" ? `job-${r.job.id}` : r.kind} inert={touring && !on} initial={{ opacity: 0, x: -14 }} animate={on ? { opacity: 1, x: 0 } : { opacity: 0, x: -14 }} transition={touring ? QUICK : { duration: 0.46, ease, delay: at(i) }}>
                {r.kind === "fork" ? (
                  <div className={s.fork}><b>product branches off</b><span>2025. The dev branch stays.</span></div>
                ) : (
                  <button type="button" className={s.row} data-skin="row" data-on={(desktop && i === shown) || undefined} aria-pressed={desktop ? i === shown : undefined} onClick={() => pick(i)}>
                    <b>{r.kind === "merge" ? stillShipping.title : r.job.company}{i === NOW && <em className={s.now} data-skin="chip">now</em>}</b>
                    <span>{r.kind === "merge" ? SHIPPING : `${r.job.short}, ${r.job.dates}`}</span>
                    <i className={s.open} aria-hidden="true">→</i>
                  </button>
                )}
                {touring && <code ref={(el) => { hashEls.current[i] = el; }} className={s.hash} aria-hidden="true">{HASH[i]}</code>}
              </motion.li>
              );
            })}
          </ol>
        </div>

        {/* Desktop: the selected commit, in full */}
        <aside className={s.panel} aria-live="polite" data-empty={!cur || undefined}>
          <SpotlightCard className={s.panelCard} data-skin="card" spotlightColor="rgba(51, 85, 255, 0.12)">
            <AnimatePresence mode="wait" initial={false}>
              {cur && (
                <motion.div key={shown} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease }}>
                  <span className={s.branch} data-branch={cur.branch} data-skin="chip">{cur.branch === "both" ? "dev + product" : cur.branch}</span>
                  <Commit {...cur} />
                </motion.div>
              )}
            </AnimatePresence>
          </SpotlightCard>
        </aside>
      </div>

      <div className={s.also}>
        {/* With the guide on, Education lands with its first entry; the rest land together after the merge commit */}
        {card(restOn, 0, <GlareHover {...GLARE} borderRadius="22px" className={s.alsoCard} data-skin="card"><h3>Also running</h3><ul>{ventures.map((v) => <li key={v.name}><b>{v.name}</b>, {v.role.toLowerCase()}. {v.note}</li>)}</ul></GlareHover>)}
        {card(restOn, 1 * 0.09, <GlareHover {...GLARE} borderRadius="22px" className={s.alsoCard} data-skin="card"><h3>Certifications</h3><ul>{certifications.map((c) => <li key={c} className={s.cert}><i aria-hidden="true">✓</i>{c}</li>)}</ul></GlareHover>)}
        {card(education.some((e) => eduOn(e.what)), touring ? 0 : 2 * 0.09, <GlareHover {...GLARE} borderRadius="22px" className={s.alsoCard} data-skin="card"><h3>Education</h3><ul>{education.map((e) => <motion.li key={e.what} data-tour={e.what === "Psychology" ? "edu-psychology" : "edu-web"} initial={false} animate={{ opacity: eduOn(e.what) ? 1 : 0 }} transition={QUICK}>{e.what}, {e.where}, {e.when}</motion.li>)}</ul></GlareHover>)}
        {card(restOn, (touring ? 2 : 3) * 0.09, <GlareHover {...GLARE} borderRadius="22px" className={s.alsoCard} data-skin="card"><h3>Languages</h3><ul>{languages.map((l) => {
          const [name, level] = l.split(", ");
          return <li key={l} className={s.lang}><span>{name}<small>{level}</small></span><span className={s.level} aria-label={`${level}, ${LEVEL[level] ?? 1} of 5`}>{[1, 2, 3, 4, 5].map((n) => <i key={n} data-on={n <= (LEVEL[level] ?? 1) || undefined} />)}</span></li>;
        })}</ul></GlareHover>)}
      </div>
    </div>
  );
}
