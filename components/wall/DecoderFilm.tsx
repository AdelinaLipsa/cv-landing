"use client";
import { Film, Cursor, at, span, type Cam } from "./Film";
import s from "./film.module.css";

// Param Decoder, the film (12 s). A link is pasted in; the decoder reads it and catches a typo'd parameter; the
// camera pushes in, the cursor hits Fix, and "fixed." lands, then shrinks into the clean link, which gets copied.
// Demo link on offer.example, no real affiliate. Stage coordinates: 440 × 290.
const LINK = "offer.example/hu/vsl7/l1/af/?af_id=1042&subid2=a9f3c2";
const TOKEN_X = 24 + 29 * 6.6; // where "aff_id" sits in the clean link (mono 11px ≈ 6.6px a character)
const WORD = "fixed.";

const cam = (t: number): Cam => ({
  z: at(t, [[0.4, 1], [1.1, 1.35], [2.3, 1.35], [2.9, 1.1], [3.1, 1.1], [3.9, 1.45], [6.3, 1.45], [7.2, 1], [8, 1], [8.35, 1.35], [8.9, 1.35], [9.6, 1]]),
  x: at(t, [[0.4, 220], [1.1, 170], [2.3, 270], [2.9, 220], [3.1, 220], [3.9, 157], [6.3, 157], [7.2, 220], [8, 220], [8.35, 330], [8.9, 330], [9.6, 220]]),
  y: at(t, [[0.4, 145], [1.1, 70], [2.3, 70], [2.9, 125], [3.1, 125], [3.9, 150], [6.3, 150], [7.2, 145], [8, 145], [8.35, 212], [8.9, 212], [9.6, 145]]),
});

// A click ring, 0..1 over the 0.45 s after a click at `c`.
const ring = (t: number, c: number) => (t >= c && t < c + 0.45 ? (t - c) / 0.45 : undefined);

function Scene({ t }: { t: number }) {
  const out = 1 - span(t, 10.6, 11.1); // everything the run added fades before the loop
  const typed = LINK.slice(0, Math.round(at(t, [[1.25, 0], [2.25, LINK.length]])));
  const fixed = span(t, 4.25, 4.5); // the missing "f" opens up
  const row = (k: number) => ({ opacity: span(t, 2.4 + 0.15 * k, 2.7 + 0.15 * k) * out, translate: `${(1 - span(t, 2.4 + 0.15 * k, 2.7 + 0.15 * k)) * -8}px 0` });
  const word = span(t, 4.6, 5.3);
  const fly = span(t, 6.4, 7.1);
  const clean = span(t, 6.6, 7) * out;
  const copied = t >= 8.35 && t < 11.1;
  const press = (c: number) => (t >= c && t < c + 0.15 ? 0.92 : 1);
  const f = (code: boolean) => (
    <>af<span className={s.ins} style={{ width: `${fixed * (code ? 6.3 : 6.6)}px`, color: fixed < 1 ? "var(--blueprint)" : undefined }}>f</span>_id</>
  );

  const cx = at(t, [[0.4, 470], [1.1, 214], [2.8, 214], [3.9, 288], [7.2, 288], [8, 390], [10.6, 390], [11.4, 480]]);
  const cy = at(t, [[0.4, 310], [1.1, 66], [2.8, 66], [3.9, 130], [7.2, 130], [8, 214], [10.6, 214], [11.4, 320]]);

  return (
    <div className={s.pd}>
      <div className={s.pdTabs}>{["Inspect", "Compare", "Batch", "Postback", "Decline"].map((m, i) => <span key={m} data-on={i === 0 || undefined}>{m}</span>)}</div>
      <div className={s.pdField} data-focus={(t > 1.15 && t < 4) || undefined}>
        {typed ? <>{typed.slice(0, 29)}{typed.length > 29 && (typed.length >= 34 ? f(false) : typed.slice(29))}{typed.slice(34)}</> : <span className={s.pdPh}>Paste a link, a postback, or a decline code</span>}
        {t > 1.15 && t < 4 && <i className={s.pdCaret} />}
      </div>

      <div className={s.pdRow} style={{ top: 94, ...row(0) }}><code>path</code><span>Hungarian · VSL 7 · lander 1</span></div>
      <div className={s.pdRow} style={{ top: 120, ...row(1) }}>
        <code>{f(true)}</code>
        <span className={s.pdBad} style={{ opacity: 1 - span(t, 4.25, 4.45) }}>typo: did you mean aff_id?</span>
        <span className={s.pdOk} style={{ opacity: span(t, 4.35, 4.6) }}>✓ fixed: pays the affiliate</span>
      </div>
      <span className={s.pdFix} style={{ opacity: row(1).opacity * (1 - span(t, 4.3, 4.5)), scale: press(4.2) }}>Fix</span>
      <div className={s.pdRow} style={{ top: 146, ...row(2), opacity: row(2).opacity * (1 - 0.5 * span(t, 4.5, 4.9) + 0.5 * span(t, 6.3, 6.8)) }}><code>subid2</code><span>click ID for their tracker</span></div>

      {/* the one word: lands letter by letter, underlined in blueprint, then shrinks into the clean link */}
      {t > 4.5 && t < 7.3 && (
        <div className={s.pdWord} style={{ opacity: 1 - span(t, 6.95, 7.2), transform: `translate(${fly * (TOKEN_X - 96)}px, ${fly * 21}px) scale(${1 - fly * 0.7})` }}>
          {[...WORD].map((ch, i) => {
            const k = span(t, 4.6 + i * 0.06, 4.95 + i * 0.06);
            return <span key={i} style={{ opacity: k, translate: `0 ${(1 - k) * 18}px` }}>{ch}</span>;
          })}
          <i style={{ scale: `${word} 1` }} />
        </div>
      )}

      <span className={s.pdLabel} style={{ opacity: clean }}>clean link</span>
      <div className={s.pdOut} style={{ opacity: clean }}>
        {LINK.slice(0, 29)}<b style={{ boxShadow: `0 0 0 ${4 * (span(t, 7, 7.3) - span(t, 7.4, 8))}px rgba(29, 138, 82, 0.25)` }}>aff_id</b>=1042&amp;subid2=a9f3c2
        <span className={s.pdCopy} data-done={copied || undefined} style={{ scale: press(8.3) }}>{copied ? "Copied ✓" : "Copy"}</span>
      </div>

      <div className={s.pdStatus}>
        <i style={{ boxShadow: `0 0 0 ${6 * span(t, 9.6, 10.3)}px rgba(29, 138, 82, ${0.35 * (1 - span(t, 9.6, 10.3))})` }} />
        local · nothing you paste leaves the browser
      </div>

      <Cursor x={cx} y={cy} click={ring(t, 1.15) ?? ring(t, 4.2) ?? ring(t, 8.3)} />
    </div>
  );
}

export default function DecoderFilm({ full }: { full?: boolean }) {
  return (
    <Film length={12} poster={7.55} w={440} h={290} cam={cam} full={full} label="Param Decoder film: a pasted link is read, a typo'd parameter is fixed, and the clean link is copied.">
      {(t) => <Scene t={t} />}
    </Film>
  );
}
