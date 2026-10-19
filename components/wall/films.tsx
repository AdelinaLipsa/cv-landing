"use client";
import { Film, Cursor, Word, at, span, ring, press, typed, type Cam } from "./Film";
import s from "./film.module.css";

// The Work films (Param Decoder's is DecoderFilm.tsx). Each is one tool in use, scripted on its own clock, drawn on a
// fixed stage: the camera pushes in on the moment that matters and one word says it. Same facts as the tiles'
// copy (content/wall.ts); demo names, demo data. `full`: in the viewer.
type F = { full?: boolean };
const cam = (z: [number, number][], x: [number, number][], y: [number, number][]) => (t: number): Cam => ({ z: at(t, z), x: at(t, x), y: at(t, y) });
const A = (left: number, top: number, more?: React.CSSProperties): React.CSSProperties => ({ left, top, ...more });
const fade = (t: number, a: number, out = 99, b = a + 0.3) => span(t, a, b) * (1 - span(t, out, out + 0.5));
const up = (t: number, a: number, out = 99) => ({ opacity: fade(t, a, out), translate: `0 ${(1 - span(t, a, a + 0.3)) * 8}px` });

// ── Hookwarden: a scan finds the one handler that doesn't verify its webhook signature ──
const HW = [
  { y: 64, at: 2.7, mark: "✓", v: "verified     ", f: "stripe.ts", c: s.kok },
  { y: 86, at: 3.0, mark: "✗", v: "not-verified ", f: "orders.ts", c: s.kbad },
  { y: 108, at: 3.3, mark: "?", v: "manual-review", f: "refunds.ts", c: s.km },
];
export function HookwardenFilm({ full }: F) {
  return (
    <Film length={11} poster={9.2} w={440} h={290} full={full} label="Hookwarden film: a scan of an API finds one webhook handler that doesn't verify signatures, and points to the line."
      cam={cam([[0.3, 1.35], [1.6, 1.35], [2.6, 1.15], [3.4, 1], [4.2, 1.7], [7.2, 1.7], [8, 1], [10.2, 1], [10.8, 1.35]],
        [[0.3, 130], [1.6, 210], [2.6, 220], [3.4, 220], [4.2, 150], [7.2, 150], [8, 220], [10.2, 220], [10.8, 130]],
        [[0.3, 50], [1.6, 50], [2.6, 70], [3.4, 140], [4.2, 106], [7.2, 106], [8, 145], [10.2, 145], [10.8, 50]])}>
      {(t) => {
        const out = 10.2;
        const spin = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"[Math.floor(t * 12) % 10];
        return (
          <div className={s.sk}>
            <span className={`${s.a} ${s.kw}`} style={A(16, 16, { opacity: 1 - span(t, out, out + 0.5) })}>$ {typed("npx hookwarden scan ./api", t, 0.4, 1.5)}</span>
            <span className={`${s.a} ${s.km}`} style={A(16, 38, up(t, 1.8, out))}>{t < 2.6 ? spin : "✓"} finding webhook handlers{t >= 2.6 ? " · 3 found" : "…"}</span>
            {HW.map((l) => (
              <span key={l.f} className={`${s.a} ${l.c}`} style={A(16, l.y, { ...up(t, l.at, out), opacity: fade(t, l.at, out) * (l.c === s.kbad ? 1 : 1 - 0.6 * span(t, 3.8, 4.2) + 0.6 * span(t, 7.2, 7.8)) })}>
                {l.mark} {l.v}  <b className={s.kw}>{l.f}</b>
              </span>
            ))}
            <span className={`${s.a} ${s.km}`} style={A(30, 130, up(t, 4.4, out))}>→ <b className={s.kw}>orders.ts:14</b>  verify before parsing the body</span>
            <Word t={t} text="caught." start={4.8} end={7.3} x={30} y={150} size={40} dx={-14} dy={-64} ink />
            <span className={`${s.a} ${s.km}`} style={A(16, 196, up(t, 7.9, out))}>done. nothing left the machine.</span>
            {/* the caret: after the prompt while it types, then waiting under the run */}
            <i className={`${s.a} ${s.kcaret}`} style={A(t < 1.7 ? 30 + typed("npx hookwarden scan ./api", t, 0.4, 1.5).length * 6.6 : 16, t < 1.7 ? 18 : 220, { opacity: (Math.floor(t * 2) % 2) * (1 - span(t, out, out + 0.4)) })} />
          </div>
        );
      }}
    </Film>
  );
}

// ── Customer support automations: a scenario made from a real call, run against Zendesk until it lands ──
const SCEN = ["refund", "cancel", "order status", "address change"];
export function SupportFilm({ full }: F) {
  return (
    <Film length={11.5} poster={9.6} w={440} h={290} full={full} label="Customer support film: an AI agent call scenario is checked step by step and lands in Zendesk as expected; four scenarios pass."
      cam={cam([[0.3, 1.35], [1.5, 1.35], [2.2, 1.3], [3.6, 1.3], [4.3, 1.6], [6.6, 1.6], [7.3, 1], [10.6, 1], [11.2, 1.35]],
        [[0.3, 130], [1.5, 200], [2.2, 180], [3.6, 180], [4.3, 150], [6.6, 150], [7.3, 220], [10.6, 220], [11.2, 130]],
        [[0.3, 50], [1.5, 50], [2.2, 90], [3.6, 90], [4.3, 128], [6.6, 128], [7.3, 145], [10.6, 145], [11.2, 50]])}>
      {(t) => {
        const out = 10.6;
        return (
          <div className={s.sk}>
            <span className={`${s.a} ${s.kw}`} style={A(16, 16, { opacity: 1 - span(t, out, out + 0.5) })}>$ {typed("test-call --scenario refund", t, 0.4, 1.4)}</span>
            <span className={`${s.a} ${s.km}`} style={A(16, 38, up(t, 1.7, out))}>ai voice agent call · scenario: refund</span>
            <span className={`${s.a} ${s.km}`} style={A(16, 60, up(t, 2.2, out))}>check intent, order, transcript <b className={s.kok} style={{ opacity: span(t, 2.8, 3) }}>✓</b></span>
            <span className={`${s.a} ${s.km}`} style={A(16, 82, up(t, 3.0, out))}>check hand-off to a person <b className={s.kok} style={{ opacity: span(t, 3.5, 3.7) }}>✓</b></span>
            <span className={`${s.a} ${s.kok}`} style={A(16, 104, up(t, 6.5, out))}>✓ landed in Zendesk as expected</span>
            <Word t={t} text="landed." start={4.1} end={6.6} x={30} y={126} size={40} dx={-12} dy={-26} ink />
            <div className={s.a} style={A(16, 150, { display: "flex", gap: 8, opacity: fade(t, 7.0, out) })}>
              {SCEN.map((n, i) => <span key={n} className={s.kchip} data-on={t >= 7.3 + i * 0.3 || undefined}>{n}{t >= 7.3 + i * 0.3 ? " ✓" : ""}</span>)}
            </div>
            <span className={`${s.a} ${s.kok}`} style={A(16, 190, up(t, 8.7, out))}>✓ 4/4 call scenarios pass</span>
          </div>
        );
      }}
    </Film>
  );
}

// ── Change log: entries land; one moves to Shipped. Her own work, with its true status (the refund flow is in testing). ──
const LOG = [
  ["Find Order journey updated", 2], ["Pay Later at checkout", 0], ["Self-service refund flow", 1],
  ["Training documents for the team", 1], ["HR moved to Factorial", 2], ["BITE: deep scan", 2],
] as const;
const ST = ["Specced", "Testing", "Shipped"];
export function ChangeLogFilm({ full }: F) {
  return (
    <Film length={11} poster={8.6} w={440} h={290} full={full} label="Change log film: entries land with their status, and one moves from Testing to Shipped."
      cam={cam([[0.2, 1.3], [1.9, 1.3], [2.6, 1.1], [3.4, 1.1], [4.4, 1.6], [6.6, 1.6], [7.4, 1], [10.4, 1], [10.9, 1.3]],
        [[0.2, 200], [1.9, 200], [2.6, 240], [3.4, 240], [4.4, 280], [6.6, 280], [7.4, 220], [10.4, 220], [10.9, 200]],
        [[0.2, 80], [1.9, 170], [2.6, 140], [3.4, 140], [4.4, 150], [6.6, 150], [7.4, 145], [10.4, 145], [10.9, 80]])}>
      {(t) => {
        const out = 10.2;
        const moved = t >= 4.25 && t < out + 0.5;
        const menu = fade(t, 3.35, 4.25, 3.55);
        return (
          <div className={s.sw}>
            <span className={`${s.a} ${s.mut} ${s.cap}`} style={A(16, 14)}>entry</span>
            <span className={`${s.a} ${s.mut} ${s.cap}`} style={A(372, 14)}>status</span>
            {LOG.map(([e, st], i) => {
              const y = 40 + i * 32;
              const k = i === 3 && moved ? 2 : st;
              return (
                <div key={e} className={`${s.a} ${s.logRow}`} style={A(16, y, { ...up(t, 0.3 + i * 0.25, out) })}>
                  <span>{e}</span>
                  <span className={s.pl} data-s={k} style={i === 3 ? { scale: press(t, 3.2), boxShadow: `0 0 0 ${4 * (span(t, 6.3, 6.6) - span(t, 6.8, 7.4))}px rgba(51, 85, 255, 0.25)` } : undefined}>{ST[k]}</span>
                </div>
              );
            })}
            <div className={`${s.a} ${s.menu}`} style={A(318, 158, { opacity: menu, translate: `0 ${(1 - menu) * -6}px` })}>
              {ST.map((m, i) => <span key={m} data-on={(i === 2 && t > 3.9) || undefined}>{m}</span>)}
            </div>
            <Word t={t} text="shipped." start={4.45} end={6.6} x={150} y={180} size={36} dx={226} dy={-50} />
            <span className={`${s.a} ${s.mut}`} style={A(16, 262, up(t, 7.4, out))}>One view of what changed, and when.</span>
            <Cursor x={at(t, [[0.4, 470], [2.6, 470], [3.1, 392], [3.6, 392], [3.9, 360], [7.2, 360], [8, 480]])} y={at(t, [[0.4, 320], [2.6, 320], [3.1, 146], [3.6, 146], [3.9, 216], [7.2, 216], [8, 320]])} click={ring(t, 3.2, 4.2)} />
          </div>
        );
      }}
    </Film>
  );
}

// ── Where declines come from: a decline rate broken down three times, the camera diving into the bar that stands out ──
const DD = [
  { by: "gateway", q: "declines by {gateway}", rows: [["Gateway A", 22], ["Gateway B", 18], ["Gateway C", 60]] },
  { by: "decline code", q: "declines{gateway:c} by {code}", rows: [["05 do not honor", 64], ["51 no funds", 24], ["54 expired", 12]] },
  { by: "bank", q: "declines{code:05} by {bank}", rows: [["Bank A", 18], ["Bank B", 67], ["Bank C", 15]] },
] as const;
const LV = [0, 3.3, 5.9]; // each level's start
const TOP = [2, 0, 1]; // the row that stands out
export function DeclinesFilm({ full }: F) {
  const by = (lv: number) => 100 + TOP[lv] * 34;
  return (
    <Film length={11.5} poster={10.4} w={440} h={290} full={full} label="Declines film: a decline rate is broken down by gateway, then decline code, then bank, until one source stands out."
      cam={cam([[0, 1], [2.6, 1], [3.2, 2.6], [3.3, 1.3], [3.8, 1], [5.2, 1], [5.8, 2.6], [5.9, 1.3], [6.4, 1], [7.4, 1], [8, 1.3], [9.6, 1.3], [10.2, 1]],
        [[2.6, 220], [3.2, 300], [3.3, 220], [5.2, 220], [5.8, 300], [5.9, 220], [7.4, 220], [8, 200], [9.6, 200], [10.2, 220]],
        [[2.6, 145], [3.2, by(0)], [3.3, 145], [5.2, 145], [5.8, by(1)], [5.9, 145], [7.4, 145], [8, 190], [9.6, 190], [10.2, 145]])}>
      {(t) => {
        const lv = t < LV[1] ? 0 : t < LV[2] ? 1 : 2;
        const lt = t - LV[lv];
        const d = DD[lv];
        const out = 10.8;
        const o = 1 - span(t, out, out + 0.4);
        return (
          <div className={s.sw}>
            <div className={`${s.a} ${s.tabs}`} style={A(14, 12, { width: 412 })}>{DD.map((x, i) => <span key={x.by} data-on={i === lv || undefined}>{x.by}</span>)}</div>
            <span className={`${s.a} ${s.field}`} style={A(14, 46, { width: 412, opacity: o })}>{typed(d.q, lt, 0.1, 0.7)}</span>
            {d.rows.map(([label, v], r) => (
              <div key={label} className={`${s.a} ${s.bar}`} style={A(14, 90 + r * 34, { width: 412, opacity: o })}>
                <code>{label}</code>
                <span><i data-top={(lt > 1.2 && r === TOP[lv]) || undefined} style={{ width: `${v * span(lt, 0.7 + r * 0.08, 1.3 + r * 0.08)}%` }} /></span>
              </div>
            ))}
            <Word t={t} text="found." start={7.6} end={9.5} x={120} y={186} size={40} dx={-60} dy={46} />
            <span className={`${s.a} ${s.note}`} style={A(14, 246, { opacity: fade(t, 9.3, out) })}>Source: gateway C, code 05, bank B.</span>
            <Cursor x={at(t, [[0.5, 470], [1.6, 470], [2.3, 330], [3.3, 330], [4.2, 330], [4.6, 300], [5.9, 300], [6.6, 470]])} y={at(t, [[0.5, 320], [1.6, 320], [2.3, by(0) + 2], [3.3, by(0) + 2], [4.2, by(0) + 2], [4.6, by(1) + 2], [5.9, by(1) + 2], [6.6, 320]])} click={ring(t, 2.5, 5.0)} />
          </div>
        );
      }}
    </Film>
  );
}

// ── This CV: what it's made of, typed out, the camera riding the caret down. All true of this repo. ──
const SITE = ["next 16 · react 19 · typescript", "motion · gsap · three", "react bits, restyled", "lofi: web audio, no files", "career: a git graph", "room: blender → three.js", "guide: a git log you can scrub", "cv as json: /api/cv"];
export function ThisSiteFilm({ full }: F) {
  const line = (i: number) => 0.3 + i * 0.55;
  return (
    <Film length={10.5} poster={8.6} w={440} h={290} full={full} label="This CV film: what the site is made of, typed out line by line."
      cam={(t) => {
        const i = Math.min(SITE.length - 1, Math.max(0, Math.floor((t - 0.3) / 0.55)));
        const ride = 1 - span(t, 4.8, 5.6) + span(t, 9.9, 10.4);
        return { z: 1 + 0.5 * ride, x: 220 - 80 * ride, y: 145 + (Math.max(60, 22 + 28 * i) - 145) * ride };
      }}>
      {(t) => {
        const out = 9.8;
        const o = 1 - span(t, out, out + 0.4);
        const cur = Math.min(SITE.length - 1, Math.floor((t - 0.3) / 0.55));
        return (
          <div className={`${s.sw} ${s.monoStage}`}>
            {SITE.map((l, i) => <span key={l} className={s.a} style={A(16, 16 + i * 28, { opacity: t >= line(i) ? o : 0 })}>› {typed(l, t, line(i), line(i) + 0.4)}{i === cur && <i className={s.wcaret} style={{ opacity: Math.floor(t * 2.4) % 2 }} />}</span>)}
            <Word t={t} text="built." start={5.8} end={8.4} x={250} y={96} size={46} dx={-40} dy={110} />
          </div>
        );
      }}
    </Film>
  );
}

// ── AgroCity on phones: one Vue web app, `npx cap sync`, it splits into iOS and Android, both build, both go live ──
export function MobileFilm({ full }: F) {
  return (
    <Film length={11} poster={9} w={180} h={320} full={full} label="AgroCity film: a Vue web app is synced with Capacitor, splits into iOS and Android builds, and goes live on both stores."
      cam={cam([[0.2, 1.15], [2.2, 1.15], [2.8, 1], [4, 1], [4.6, 1.2], [6.2, 1.2], [6.8, 1], [10.4, 1], [10.9, 1.15]],
        [[0, 90]], [[0.2, 120], [2.2, 120], [2.8, 170], [4, 170], [4.6, 120], [6.2, 120], [6.8, 170], [10.4, 170], [10.9, 120]])}>
      {(t) => {
        const out = 10.2;
        const o = 1 - span(t, out, out + 0.5);
        const split = span(t, 3.3, 4.1);
        const card = (k: 0 | 1) => {
          const x = 20 + (k === 0 ? -split * 6 : split * 74);
          const w = 140 - split * 74;
          return (
            <div key={k} className={`${s.a} ${s.capCard}`} style={A(x, 52, { width: w, height: 110, opacity: (k === 1 ? span(t, 3.3, 3.5) : 1) * o * span(t, 0.2, 0.5) })}>
              <i className={s.capBar} />
              {[0, 1, 2].map((r) => <i key={r} className={s.capRow} style={{ scale: `${span(t, 0.5 + r * 0.15, 0.9 + r * 0.15)} 1` }} />)}
              <span className={s.capTag}>{split < 0.5 ? "web app · Vue" : k === 0 ? "iOS · Xcode" : "Android"}</span>
              <b className={s.capBuild} style={{ opacity: span(t, 4.1, 4.3), scale: `${span(t, 4.3 + k * 0.2, 5.8 - k * 0.2)} 1` }} />
            </div>
          );
        };
        return (
          <div className={s.sw}>
            <span className={`${s.a} ${s.mut} ${s.cap}`} style={A(14, 16)}>Capacitor</span>
            {card(0)}{card(1)}
            <div className={`${s.a} ${s.capTerm}`} style={A(14, 184, { width: 152, opacity: fade(t, 2.2, 4.4) })}>
              <span>$ {typed("npx cap sync", t, 2.3, 2.9)}</span>
              <span style={{ opacity: span(t, 3.1, 3.3) }}>✓ copied to ios/</span>
              <span style={{ opacity: span(t, 3.4, 3.6) }}>✓ copied to android/</span>
            </div>
            {["App Store", "Google Play"].map((n, k) => (
              <div key={n} className={`${s.a} ${s.store}`} style={A(14, 196 + k * 40, { width: 152, opacity: fade(t, 6.3 + k * 0.2, out), scale: 0.9 + 0.1 * span(t, 6.3 + k * 0.2, 6.6 + k * 0.2) })}>
                <span>{n}</span><b style={{ opacity: span(t, 8.3, 8.5) }}>✓ live</b>
              </div>
            ))}
            <Word t={t} text="live." start={6.9} end={8.6} x={40} y={276} size={30} dx={70} dy={-64} />
          </div>
        );
      }}
    </Film>
  );
}

// ── Ways to pay: the methods she specs, tried in turn at a demo checkout ──
const METHODS = ["Card", "Pay later", "Digital wallet", "Bank transfer"];
export function CheckoutFilm({ full }: F) {
  return (
    <Film length={10} poster={7.8} w={180} h={320} full={full} label="Ways to pay film: a demo checkout tries each payment method, then pays by bank transfer."
      cam={cam([[0.4, 1], [1, 1.25], [3.4, 1.25], [4, 1.3], [7.2, 1.3], [7.9, 1], [9.4, 1]], [[0, 90]], [[0.4, 160], [1, 150], [3.4, 190], [4, 250], [7.2, 250], [7.9, 160]])}>
      {(t) => {
        const sel = t < 1.1 || t > 9.4 ? 0 : t < 2.1 ? 1 : t < 3.1 ? 2 : 3;
        const paid = t >= 5 && t < 9.4;
        return (
          <div className={s.sw}>
            <span className={`${s.a} ${s.mut} ${s.cap}`} style={A(14, 16)}>Checkout</span>
            <b className={`${s.a} ${s.total}`} style={A(14, 32)}>$49.00</b>
            {METHODS.map((m, i) => (
              <span key={m} className={`${s.a} ${s.payOpt}`} data-on={i === sel || undefined} style={A(14, 72 + i * 38, { width: 152, scale: press(t, [0, 1.1, 2.1, 3.1][i]) })}><i />{m}</span>
            ))}
            <span className={`${s.a} ${s.payBtn}`} data-done={paid || undefined} style={A(14, 270, { width: 152, scale: press(t, 4.2) })}>{paid ? "Paid ✓" : t >= 4.2 && t < 5 ? "Processing…" : `Pay with ${METHODS[sel].toLowerCase()}`}</span>
            <Word t={t} text="paid." start={5.2} end={7.2} x={40} y={225} size={30} dx={30} dy={50} />
            <Cursor x={at(t, [[0.3, 230], [0.9, 120], [3.6, 120], [4.1, 120], [7.4, 120], [8, 230]])} y={at(t, [[0.3, 340], [0.9, 126], [1.9, 164], [2.9, 202], [3.6, 202], [4.1, 286], [7.4, 286], [8, 340]])} click={ring(t, 1.1, 2.1, 3.1, 4.2)} />
          </div>
        );
      }}
    </Film>
  );
}

// ── Gateway routing: payments leave the checkout and the router sends each to a gateway. Generic names. ──
const GW = ["Gateway A", "Gateway B", "Gateway C", "Gateway D", "Gateway E"];
const PAYS = [[0.5, 1], [1.9, 3], [3.3, 0], [4.9, 4]] as const; // [leaves checkout, to gateway]
const gx = (k: number) => 14 + k * 84 + 38;
export function GatewaysFilm({ full }: F) {
  return (
    <Film length={11} poster={9.4} w={440} h={340} full={full} label="Gateway routing film: payments leave the checkout and the router sends each one to a gateway."
      cam={cam([[0, 1], [4.6, 1], [5.2, 1.6], [6.4, 1.6], [7, 1.3], [8.6, 1.3], [9.4, 1]], [[4.6, 220], [5.2, 220], [6.4, 300], [7, 330], [8.6, 330], [9.4, 220]], [[4.6, 170], [5.2, 90], [6.4, 220], [7, 240], [8.6, 240], [9.4, 170]])}>
      {(t) => (
        <div className={s.sw}>
          <svg className={s.a} style={A(0, 0)} width="440" height="340" aria-hidden="true">
            <path d="M220 62V118" className={s.wire} />
            {GW.map((g, k) => <path key={g} d={`M220 158C220 200 ${gx(k)} 200 ${gx(k)} 246`} className={s.wire} />)}
          </svg>
          <span className={`${s.a} ${s.node}`} style={A(170, 30, { width: 100 })}>Checkout</span>
          <span className={`${s.a} ${s.node} ${s.nodeInk}`} style={A(170, 120, { width: 100 })}>Routing</span>
          {GW.map((g, k) => {
            const hit = PAYS.some(([a, to]) => to === k && t >= a + 1.3 && t < a + 2.4) || (k === 4 && t >= 6.2 && t < 10);
            return <span key={g} className={`${s.a} ${s.gw}`} data-on={hit || undefined} style={A(14 + k * 84, 248, { width: 76 })}>{g}</span>;
          })}
          {PAYS.map(([a, to]) => {
            const p = span(t, a, a + 1.3);
            if (t < a || t > a + 1.4) return null;
            const first = Math.min(1, p * 2), second = Math.max(0, p * 2 - 1);
            const x = second ? 220 + (gx(to) - 220) * second : 220;
            const y = second ? 158 + 88 * second : 62 + 56 * first;
            return <i key={a} className={`${s.a} ${s.payDot}`} style={A(x - 6, y - 6)} />;
          })}
          <Word t={t} text="routed." start={6.3} end={8.6} x={226} y={196} size={34} dx={104} dy={58} />
        </div>
      )}
    </Film>
  );
}

// ── Eligibility pipeline: a vendor's member file travels the whole run, with one retry on the way ──
const STEPS = ["Vendor file → S3", "Laravel job, with retries", "SFTP to the partner", "Results → Caspio · Slack alert"];
const SY = [40, 118, 196, 274];
export function PipelineFilm({ full }: F) {
  const fy = (t: number) => at(t, [[0.3, -20], [1, SY[0]], [1.6, SY[0]], [2.2, SY[1]], [4.2, SY[1]], [4.8, SY[2]], [5.4, SY[2]], [6, SY[3]], [10.2, SY[3]]]);
  return (
    <Film length={11} poster={8.6} w={440} h={340} full={full} label="Eligibility pipeline film: a member file lands in S3, the Laravel job fails once and retries, the file goes to the partner over SFTP, and the results reach Caspio with a Slack alert."
      cam={(t) => ({ z: at(t, [[0.3, 1.45], [6.4, 1.45], [7.2, 1], [10.2, 1], [10.8, 1.45]]), x: at(t, [[0.3, 160], [6.4, 160], [7.2, 220], [10.2, 220], [10.8, 160]]), y: at(t, [[6.4, Math.max(100, Math.min(250, fy(t) + 30))], [7.2, 170], [10.2, 170], [10.8, 100]]) })}>
      {(t) => {
        const out = 10.2;
        const y = fy(t);
        return (
          <div className={s.sw}>
            <i className={`${s.a} ${s.rail}`} style={A(30, 30, { height: 270 })} />
            {STEPS.map((st, i) => (
              <span key={st} className={`${s.a} ${s.flowStep}`} data-last={i === 3 || undefined} data-on={(Math.abs(y - SY[i]) < 2 && t < out) || undefined} style={A(54, SY[i] - 2)}>{st}</span>
            ))}
            <span className={`${s.a} ${s.kbadW}`} style={A(54, 142, { opacity: fade(t, 2.7, 3.4) })}>attempt 1 ✗ timeout · retrying</span>
            <span className={`${s.a} ${s.okW}`} style={A(54, 142, { opacity: fade(t, 3.6, out) })}>attempt 2 ✓</span>
            <span className={`${s.a} ${s.okW}`} style={A(54, 220, { opacity: fade(t, 5.1, out) })}>sent ✓</span>
            <i className={`${s.a} ${s.file}`} style={A(22, y - 1, { opacity: 1 - span(t, out, out + 0.4) })}>csv</i>
            <div className={`${s.a} ${s.toast}`} style={A(250, 236, { width: 176, opacity: fade(t, 6.3, out), translate: `${(1 - span(t, 6.3, 6.7)) * 20}px 0` })}>
              <b>#eligibility</b><span>run complete · results in Caspio</span>
            </div>
            <Word t={t} text="retried." start={3.7} end={6} x={150} y={136} size={28} dx={-96} dy={6} />
          </div>
        );
      }}
    </Film>
  );
}

// ── BITE: the skipper skips a sales video and copies its checkout link; then the tracker finds the tracking present ──
// Its sections flow like the real popup; where things land (stage px): toggle y 159, force a skip y 212, copy checkout
// y 240, the tracker tab x 250, check tracking y 126, the verdict y 189.
const CHECKS = ["Conversion tracking", "Tracking pixel", "Disclaimer script"];
export function BiteFilm({ full }: F) {
  return (
    <Film length={14} poster={11.6} w={340} h={440} cover bg="#111113" full={full} label="BITE film: the skipper skips a sales video and copies its checkout link, then the tracker finds the tracking code present."
      cam={cam([[7.2, 1], [7.9, 1.45], [9.3, 1.45], [10.2, 1]],
        [[7.2, 170], [7.9, 140], [9.3, 140], [10.2, 170]],
        [[0, 113], [1.6, 113], [2.4, 300], [4.8, 300], [5.6, 113], [7.2, 113], [7.9, 205], [9.3, 205], [10.2, 200], [12.8, 200], [13.4, 113]])}>
      {(t) => {
        const tracker = t >= 5.8 && t < 13.2;
        const k = t < 13 ? t : 0; // the skipper's own clock: back to the start once the loop turns
        const state = k < 1.3 ? "idle" : k < 1.9 ? "scanning" : k < 3.0 ? "playing" : "skipped";
        const n = (a: number) => (k >= a ? 1 : 0);
        const o = 1 - span(t, 12.6, 13.1);
        return (
          <div className={s.bx}>
            <div className={`${s.a} ${s.bxTabs}`} style={A(10, 10, { width: 320 })}><span data-on={!tracker || undefined}>skipper</span><span data-on={tracker || undefined}>tracker</span></div>
            {!tracker ? (
              <div className={s.bxBody}>
                <div className={s.bxSec}><i>page</i>
                  <p><b>host</b>offer.example</p>
                  <p><b>state</b><span data-hot={k >= 1.9 || undefined}>[ {state} ]</span></p>
                  <p><b>player</b>{k >= 1.9 ? "vturb" : "—"}</p>
                </div>
                <div className={s.bxSec}><i>power</i>
                  <p className={s.bxToggleRow}><span className={s.bxToggle} data-on={k >= 1.1 || undefined}><em /></span>{k >= 1.1 ? "skipper running" : "skipper off"}</p>
                </div>
                <div className={s.bxSec}><i>actions</i>
                  <span className={s.bxBtn} style={{ scale: press(k, 2.9) }}>force a skip</span>
                  <span className={s.bxBtn} style={{ scale: press(k, 4.2) }}>copy checkout<em data-up={(k >= 4.2 && k < 5) || undefined}>{k >= 4.2 ? (k < 5 ? "copied ✓" : "1") : "0"}</em></span>
                </div>
                <div className={s.bxSec}><i>stats</i>
                  <p className={s.bxStat}><b>videos skipped</b><em data-up={(k >= 3.1 && k < 3.8) || undefined}>{n(3.1)}</em></p>
                  <p className={s.bxStat}><b>cta delays fired</b><em data-up={(k >= 3.4 && k < 4.1) || undefined}>{n(3.4)}</em></p>
                  <p className={s.bxStat}><b>fake-urgency sped up</b><em data-up={(k >= 3.4 && k < 4.1) || undefined}>{n(3.4)}</em></p>
                </div>
                <div className={s.bxSec}><i>review</i>
                  <p className={s.bxToggleRow}><span className={s.bxToggle}><em /></span>review mode off</p>
                  <span className={s.bxSeek}><em style={{ width: `${k >= 3.0 ? 14 + 86 * span(k, 3.0, 3.3) : 14 * span(k, 1.9, 3.0)}%` }} /></span>
                  <p className={s.bxTime}>{k >= 3.1 ? "12:47 / 12:47" : k >= 1.9 ? `1:${String(10 + Math.floor(span(k, 1.9, 3) * 38)).padStart(2, "0")} / 12:47` : "0:00 / --:--"}</p>
                </div>
              </div>
            ) : (
              <div className={s.bxBody} style={{ opacity: span(t, 5.8, 6.1) * o }}>
                <div className={s.bxSec}><i>page</i><p><b>host</b>offer.example</p></div>
                <div className={s.bxSec}><i>tracking checker</i>
                  <span className={s.bxBtn} style={{ scale: press(t, 6.6) }}>{t >= 6.6 && t < 7.3 ? "checking…" : "check tracking"}</span>
                  <span className={s.bxBtn}>deep scan</span>
                </div>
                <div className={s.bxSec} style={{ opacity: span(t, 7.3, 7.6) }}>
                  <p className={s.bxVerdict}><span className={s.present} style={{ opacity: span(t, 9.2, 9.4), scale: 0.8 + 0.2 * span(t, 9.2, 9.5) }}>PRESENT</span>offer.example</p>
                  {CHECKS.map((c, i) => (
                    <p key={c} className={s.bxCheck} style={{ opacity: 0.12 + 0.88 * span(t, 9.6 + i * 0.3, 9.9 + i * 0.3) }}><span>✓ {c}</span><em>PRESENT</em></p>
                  ))}
                </div>
                <div className={s.bxSec} style={{ opacity: 0.12 + 0.88 * span(t, 10.6, 11) }}><i>also on this page</i>
                  <p>· checkout link</p>
                  <p className={s.bxLinks}><span>re-check</span><span>copy report</span></p>
                </div>
              </div>
            )}
            <Word t={t} text="present." start={7.6} end={9.4} x={84} y={214} size={34} dx={-74} dy={-25} ink />
            <Cursor x={at(t, [[0.2, 380], [0.9, 24], [1.6, 24], [2.6, 170], [3.6, 170], [4.0, 170], [5.0, 170], [5.5, 250], [6.0, 250], [6.4, 170], [7.0, 170], [7.6, 380]])}
              y={at(t, [[0.2, 160], [0.9, 160], [1.6, 160], [2.6, 212], [3.6, 212], [4.0, 240], [5.0, 240], [5.5, 22], [6.0, 22], [6.4, 126], [7.0, 126], [7.6, 200]])}
              click={ring(t, 1.1, 2.9, 4.2, 5.7, 6.6)} />
          </div>
        );
      }}
    </Film>
  );
}
