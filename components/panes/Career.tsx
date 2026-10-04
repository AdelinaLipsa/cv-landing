import { AnimatePresence, motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import type { UI } from "../Shell";
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
      {stack.length > 0 && <div className={p.chips}>{stack.map((c) => <span key={c} className={p.chip}>{c}</span>)}</div>}
    </>
  );
}

export default function Career({ ui }: { ui: UI }) {
  const graph = useRef<HTMLDivElement>(null);
  const visible = useInView(graph, { amount: 0.25 });
  const entered = useInView(graph, { amount: 0.25, once: true });
  const desktop = useMedia(DESKTOP, ONE, 0) === 1;
  const [sel, setSel] = useState(NOW);
  const cur = detail(rows[sel]);
  // Desktop shows the commit in the side panel; phones open it in a sheet.
  const pick = (i: number) => {
    if (desktop) return setSel(i);
    const d = detail(rows[i]);
    if (d) ui.sheet(d.title, <Commit {...d} />);
  };

  return (
    <div className={p.column}>
      <div className={s.head}>
        <h1 className={p.title}><ShuffleHeading text="Career" /></h1>
        <div className={s.legend}>
          <span><i style={{ background: COLOR.dev }} />dev</span>
          <span><i style={{ background: COLOR.product }} />product</span>
        </div>
        <dl className={s.stats}>
          {STATS.map((st) => (
            <GlareHover key={st.label} {...GLARE} borderRadius="16px" className={s.stat}><dt><CountUp to={st.n} duration={1.4} startWhen={visible} /></dt><dd>{st.label}</dd></GlareHover>
          ))}
        </dl>
      </div>

      <div className={s.layout}>
        <div ref={graph} className={s.graph} style={{ height: rows.length * H }}>
          <svg className={s.svg} data-tour="graph" width="60" height={rows.length * H} aria-hidden="true">
            <motion.line x1={LANE.dev} x2={LANE.dev} y1={y(rows.length - 1)} y2={y(0)} stroke={COLOR.dev} strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: entered ? 1 : 0 }} transition={DRAW} />
            <motion.path
              d={`M${LANE.dev} ${y(forkAt)} C${LANE.dev} ${y(forkAt) - 30} ${LANE.product} ${y(forkAt) - 20} ${LANE.product} ${y(forkAt - 1)} V${y(0)}`}
              stroke={COLOR.product}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: entered ? 1 : 0 }}
              transition={{ duration: forkAt * STEP, ease: "linear", delay: at(forkAt) }}
            />
            <motion.line x1={LANE.dev} x2={LANE.product} y1={y(0)} y2={y(0)} stroke={COLOR.product} strokeWidth="4" initial={{ pathLength: 0 }} animate={{ pathLength: entered ? 1 : 0 }} transition={{ duration: 0.3, delay: at(0) }} />
            {rows.map((r, i) => {
              if (r.kind === "merge") {
                return (
                  <motion.g key="merge" style={dot} initial={{ scale: 0 }} animate={{ scale: entered ? 1 : 0 }} transition={pop(i)}>
                    <circle cx={LANE.dev} cy={y(i)} r="7" fill="var(--paper)" stroke={COLOR.dev} strokeWidth="3" />
                    <circle cx={LANE.product} cy={y(i)} r="7" fill="var(--paper)" stroke={COLOR.product} strokeWidth="3" />
                  </motion.g>
                );
              }
              if (r.kind === "fork") return <motion.circle key="fork" cx={LANE.dev} cy={y(i)} r="5" fill={COLOR.product} style={dot} initial={{ scale: 0 }} animate={{ scale: entered ? 1 : 0 }} transition={pop(i)} />;
              const big = desktop && i === sel;
              return <motion.circle key={r.job.id} cx={LANE[r.job.branch]} cy={y(i)} r="7" fill={COLOR[r.job.branch]} style={dot} initial={{ scale: 0 }} animate={{ scale: entered ? (big ? 1.45 : 1) : 0 }} transition={pop(i)} />;
            })}
            {/* Live: a ring keeps pulsing out of the current job and the merge commit */}
            {visible && [
              { x: LANE[(rows[NOW] as { job: { branch: Branch } }).job.branch], y: y(NOW), c: COLOR.product },
              { x: LANE.dev, y: y(0), c: COLOR.dev },
              { x: LANE.product, y: y(0), c: COLOR.product },
            ].map((d, k) => (
              <motion.circle key={k} cx={d.x} cy={d.y} r="7" fill="none" stroke={d.c} strokeWidth="2" style={dot} initial={{ scale: 1, opacity: 0.45 }} animate={{ scale: 2.1, opacity: 0 }} transition={{ duration: 2.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: k * 0.45 }} />
            ))}
          </svg>

          <ol className={s.rows}>
            {rows.map((r, i) => (
              <motion.li key={i} style={{ height: H }} data-tour={r.kind === "job" ? `job-${r.job.id}` : r.kind} initial={{ opacity: 0, x: -14 }} animate={entered ? { opacity: 1, x: 0 } : { opacity: 0, x: -14 }} transition={{ duration: 0.46, ease, delay: at(i) }}>
                {r.kind === "fork" ? (
                  <div className={s.fork}><b>product branches off</b><span>2025. The dev branch stays.</span></div>
                ) : (
                  <button type="button" className={s.row} data-on={(desktop && i === sel) || undefined} aria-pressed={desktop ? i === sel : undefined} onClick={() => pick(i)}>
                    <b>{r.kind === "merge" ? stillShipping.title : r.job.company}{i === NOW && <em className={s.now}>now</em>}</b>
                    <span>{r.kind === "merge" ? SHIPPING : `${r.job.short}, ${r.job.dates}`}</span>
                    <i className={s.open} aria-hidden="true">→</i>
                  </button>
                )}
              </motion.li>
            ))}
          </ol>
        </div>

        {/* Desktop: the selected commit, in full */}
        <aside className={s.panel} aria-live="polite">
          <SpotlightCard className={s.panelCard} spotlightColor="rgba(51, 85, 255, 0.12)">
            <AnimatePresence mode="wait" initial={false}>
              {cur && (
                <motion.div key={sel} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease }}>
                  <span className={s.branch} data-branch={cur.branch}>{cur.branch === "both" ? "dev + product" : cur.branch}</span>
                  <Commit {...cur} />
                </motion.div>
              )}
            </AnimatePresence>
          </SpotlightCard>
        </aside>
      </div>

      <div className={s.also}>
        <Land as="section" delay={0 * 0.09}><GlareHover {...GLARE} borderRadius="22px" className={s.alsoCard}><h3>Also running</h3><ul>{ventures.map((v) => <li key={v.name}><b>{v.name}</b>, {v.role.toLowerCase()}. {v.note}</li>)}</ul></GlareHover></Land>
        <Land as="section" delay={1 * 0.09}><GlareHover {...GLARE} borderRadius="22px" className={s.alsoCard}><h3>Certifications</h3><ul>{certifications.map((c) => <li key={c} className={s.cert}><i aria-hidden="true">✓</i>{c}</li>)}</ul></GlareHover></Land>
        <Land as="section" delay={2 * 0.09}><GlareHover {...GLARE} borderRadius="22px" className={s.alsoCard}><h3>Education</h3><ul>{education.map((e) => <li key={e.what} data-tour={e.what === "Psychology" ? "edu-psychology" : "edu-web"}>{e.what}, {e.where}, {e.when}</li>)}</ul></GlareHover></Land>
        <Land as="section" delay={3 * 0.09}><GlareHover {...GLARE} borderRadius="22px" className={s.alsoCard}><h3>Languages</h3><ul>{languages.map((l) => {
          const [name, level] = l.split(", ");
          return <li key={l} className={s.lang}><span>{name}<small>{level}</small></span><span className={s.level} aria-label={`${level}, ${LEVEL[level] ?? 1} of 5`}>{[1, 2, 3, 4, 5].map((n) => <i key={n} data-on={n <= (LEVEL[level] ?? 1) || undefined} />)}</span></li>;
        })}</ul></GlareHover></Land>
      </div>
    </div>
  );
}
