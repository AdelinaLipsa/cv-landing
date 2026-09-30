import type { UI } from "../Shell";
import { certifications, education, jobs, languages, stillShipping, ventures, type Branch } from "@/content/cv";
import BlurText from "../BlurText";
import p from "./pane.module.css";
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

function Commit({ title, meta, lines, stack }: { title: string; meta: string; lines: string[]; stack: string[] }) {
  return (
    <>
      <h2 className={p.sheetTitle}>{title}</h2>
      <p className={p.sheetMeta}>{meta}</p>
      <ul className={p.sheetList}>{lines.map((l) => <li key={l}>{l}</li>)}</ul>
      {stack.length > 0 && <div className={p.chips}>{stack.map((c) => <span key={c} className={p.chip}>{c}</span>)}</div>}
    </>
  );
}

export default function Career({ ui }: { ui: UI }) {
  const open = (r: Row) => {
    if (r.kind === "merge") {
      ui.sheet(stillShipping.title, <Commit title={stillShipping.title} meta={`Internal tools, ${stillShipping.dates}. On both branches.`} lines={stillShipping.lines} stack={stillShipping.stack} />);
    } else if (r.kind === "job") {
      const j = r.job;
      ui.sheet(j.company, <Commit title={j.company} meta={`${j.role}. ${j.dates}, ${j.place}.`} lines={j.lines} stack={j.stack} />);
    }
  };

  return (
    <div className={p.column}>
      <div className={s.head}>
        <h1 className={p.title}><BlurText text="Career" animateBy="words" delay={60} /></h1>
        <div className={s.legend}>
          <span><i style={{ background: COLOR.dev }} />dev</span>
          <span><i style={{ background: COLOR.product }} />product</span>
        </div>
      </div>

      <div className={s.graph} style={{ height: rows.length * H }}>
        <svg className={s.svg} data-tour="graph" width="60" height={rows.length * H} aria-hidden="true">
          <line x1={LANE.dev} x2={LANE.dev} y1={y(0)} y2={y(rows.length - 1)} stroke={COLOR.dev} strokeWidth="4" strokeLinecap="round" />
          <path
            d={`M${LANE.product} ${y(0)} V${y(forkAt - 1)} C${LANE.product} ${y(forkAt) - 20} ${LANE.dev} ${y(forkAt) - 30} ${LANE.dev} ${y(forkAt)}`}
            stroke={COLOR.product}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <line x1={LANE.dev} x2={LANE.product} y1={y(0)} y2={y(0)} stroke={COLOR.product} strokeWidth="4" />
          {rows.map((r, i) => {
            if (r.kind === "merge") {
              return (
                <g key="merge">
                  <circle cx={LANE.dev} cy={y(i)} r="7" fill="var(--paper)" stroke={COLOR.dev} strokeWidth="3" />
                  <circle cx={LANE.product} cy={y(i)} r="7" fill="var(--paper)" stroke={COLOR.product} strokeWidth="3" />
                </g>
              );
            }
            if (r.kind === "fork") return <circle key="fork" cx={LANE.dev} cy={y(i)} r="5" fill={COLOR.product} />;
            return <circle key={r.job.id} cx={LANE[r.job.branch]} cy={y(i)} r="7" fill={COLOR[r.job.branch]} />;
          })}
        </svg>

        <ol className={s.rows}>
          {rows.map((r, i) => (
            <li key={i} style={{ height: H }} data-tour={r.kind === "merge" ? "merge" : undefined}>
              {r.kind === "fork" ? (
                <div className={s.fork}><b>product branches off</b><span>2025. The dev branch stays.</span></div>
              ) : (
                <button type="button" className={s.row} onClick={() => open(r)}>
                  <b>{r.kind === "merge" ? stillShipping.title : r.job.company}</b>
                  <span>{r.kind === "merge" ? "Param Decoder, change log, CS dashboard" : `${r.job.short}, ${r.job.dates}`}</span>
                </button>
              )}
            </li>
          ))}
        </ol>
      </div>

      <dl className={s.also}>
        <div><dt>Also running</dt>{ventures.map((v) => <dd key={v.name}><b>{v.name}</b>, {v.role.toLowerCase()}. {v.note}</dd>)}</div>
        <div><dt>Certifications</dt>{certifications.map((c) => <dd key={c}>{c}</dd>)}</div>
        <div><dt>Education</dt>{education.map((e) => <dd key={e.what}>{e.what}, {e.where}, {e.when}</dd>)}</div>
        <div><dt>Languages</dt>{languages.map((l) => <dd key={l}>{l}</dd>)}</div>
      </dl>
    </div>
  );
}
