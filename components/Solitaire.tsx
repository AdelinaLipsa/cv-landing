"use client";
import { useEffect, useRef, useState } from "react";
import { unlock } from "@/lib/achievements";
import { useCalm } from "@/lib/useCalm";
import { autoFound, deal, draw, label, move, pick, red, won, type Card, type Game, type Where } from "@/lib/solitaire";
import s from "./Solitaire.module.css";

// Solitaire on the Windows 95 desktop: Klondike, draw one. Drag a card (or a run) where it goes, or click it to
// pick it up (it inverts, like 95 did) and click where it goes; double-click sends a card home to its foundation. Win, and the cards bounce off the
// foundations leaving trails, the way everyone remembers.
const CW = 71, CH = 96; // Windows 95 card size
const FAN_UP = 30, FAN_DOWN = 6; // how far each face-up / face-down card in a column sits below the one before
const fan = (t: Card[], at: number) => t.slice(0, at).reduce((y, p) => y + (p.up ? FAN_UP : FAN_DOWN), 0);
type Drag = { from: Where; cards: Card[]; x: number; y: number; ox: number; oy: number };
// Where a drop landed: the foundation or column under the pointer, from its data-drop="found:2" / "tab:5".
const dropAt = (x: number, y: number) => {
  const [pile, i] = (document.elementFromPoint(x, y)?.closest("[data-drop]")?.getAttribute("data-drop") ?? "").split(":");
  return pile === "found" || pile === "tab" ? { pile, i: Number(i) } as { pile: "found" | "tab"; i: number } : null;
};

function Face({ c, picked }: { c: Card; picked?: boolean }) {
  if (!c.up) return <span className={`${s.card} ${s.back}`} />;
  return (
    <span className={`${s.card} ${red(c) ? s.red : ""}`} data-picked={picked || undefined}>
      <span className={s.corner}>{label(c.rank)}<br />{c.suit}</span>
      <span className={s.pip}>{c.suit}</span>
      <span className={`${s.corner} ${s.flip}`}>{label(c.rank)}<br />{c.suit}</span>
    </span>
  );
}

// The win: each foundation's cards, top first, leap out and bounce along the floor, drawn without clearing.
function cascade(cv: HTMLCanvasElement, starts: { x: number; y: number }[], done: () => void) {
  const ctx = cv.getContext("2d")!;
  const W = cv.width, H = cv.height;
  const paint = (x: number, y: number, rank: number, suit: string) => {
    ctx.fillStyle = "#fff"; ctx.fillRect(x, y, CW, CH);
    ctx.strokeStyle = "#000"; ctx.strokeRect(x + 0.5, y + 0.5, CW - 1, CH - 1);
    ctx.fillStyle = suit === "♥" || suit === "♦" ? "#c00000" : "#000";
    ctx.font = "bold 14px Tahoma, sans-serif"; ctx.fillText(label(rank), x + 5, y + 16); ctx.fillText(suit, x + 5, y + 31);
    ctx.font = "34px Tahoma, sans-serif"; ctx.fillText(suit, x + CW / 2 - 12, y + CH / 2 + 12);
  };
  const order: { rank: number; suit: string; f: number }[] = [];
  for (let r = 13; r >= 1; r--) ["♠", "♥", "♦", "♣"].forEach((suit, f) => order.push({ rank: r, suit, f }));
  let k = 0, raf = 0;
  let card = { x: 0, y: 0, vx: 0, vy: 0, ...order[0] };
  const launch = () => {
    const o = order[k];
    card = { ...o, x: starts[o.f].x, y: starts[o.f].y, vx: (k % 2 ? -1 : 1) * (2 + (k % 5) * 0.6) * (o.f < 2 ? -1 : 1), vy: -(3 + (k % 3)) };
  };
  launch();
  const step = () => {
    card.vy += 0.6; card.x += card.vx; card.y += card.vy;
    if (card.y > H - CH) { card.y = H - CH; card.vy = -card.vy * 0.78; }
    paint(card.x, card.y, card.rank, card.suit);
    if (card.x < -CW || card.x > W) { k++; if (k >= order.length) { done(); return; } launch(); }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

export default function Solitaire() {
  const calm = useCalm();
  const [g, setG] = useState<Game>(() => deal());
  const [sel, setSel] = useState<Where | null>(null);
  const [party, setParty] = useState(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragged = useRef(false); // a drag just ended: swallow the click the browser fires after it
  const felt = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const foundEls = useRef<(HTMLDivElement | null)[]>([]);
  const isWon = won(g);

  useEffect(() => {
    if (!isWon) return;
    unlock("solitaire");
    if (calm || !canvas.current || !felt.current) return;
    const box = felt.current.getBoundingClientRect();
    canvas.current.width = box.width; canvas.current.height = box.height;
    const starts = foundEls.current.map((el) => { const r = el!.getBoundingClientRect(); return { x: r.left - box.left, y: r.top - box.top }; });
    setParty(true);
    return cascade(canvas.current, starts, () => {});
  }, [isWon, calm]);

  const newGame = () => { setG(deal()); setSel(null); setParty(false); };
  const same = (a: Where | null, b: Where) => !!a && a.pile === b.pile && ("i" in a ? "i" in b && a.i === b.i : true) && ("at" in a ? "at" in b && a.at === b.at : true);

  // Click on a pile or card: place the picked-up cards there if legal, otherwise pick this up instead.
  const click = (at: Where | { pile: "tab-empty"; i: number }) => {
    if (dragged.current) { dragged.current = false; return; }
    if (sel) {
      const to = at.pile === "found" ? { pile: "found" as const, i: at.i } : at.pile === "tab" || at.pile === "tab-empty" ? { pile: "tab" as const, i: at.i } : null;
      if (to) {
        const n = move(g, sel, to);
        if (n !== g) { setG(n); setSel(null); return; }
      }
    }
    if (at.pile === "tab-empty") { setSel(null); return; }
    if (same(sel, at)) { setSel(null); return; }
    setSel(pick(g, at).length ? at : null);
  };
  const home = (at: Where) => { const n = autoFound(g, at); if (n !== g) { setG(n); setSel(null); } };
  // Press on a face-up card: past a few pixels it becomes a drag, and the cards follow the pointer until dropped.
  const press = (from: Where) => (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || !felt.current) return;
    const cards = pick(g, from);
    if (!cards.length) return;
    const box = felt.current.getBoundingClientRect(), card = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY, ox = sx - card.left, oy = sy - card.top;
    let on = false;
    const moveTo = (m: PointerEvent) => {
      if (!on && Math.hypot(m.clientX - sx, m.clientY - sy) < 5) return;
      on = true;
      setDrag({ from, cards, x: m.clientX - box.left - ox, y: m.clientY - box.top - oy, ox, oy });
    };
    const up = (m: PointerEvent) => {
      window.removeEventListener("pointermove", moveTo); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      if (!on) return;
      dragged.current = true;
      setTimeout(() => { dragged.current = false; }, 0); // only the click fired by this same release is swallowed
      setDrag(null);
      const to = dropAt(m.clientX, m.clientY);
      const n = to ? move(g, from, to) : g;
      if (n !== g) setG(n);
      setSel(null);
    };
    window.addEventListener("pointermove", moveTo); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  };
  const lifted = (w: Where) => !!drag && drag.from.pile === w.pile && (w.pile !== "tab" || (drag.from.pile === "tab" && drag.from.i === w.i && w.at >= drag.from.at)) && (w.pile !== "found" || (drag.from.pile === "found" && drag.from.i === w.i));
  const isPicked = (w: Where) => !!sel && sel.pile === w.pile && (w.pile !== "tab" || (sel.pile === "tab" && sel.i === w.i && w.at >= sel.at)) && (w.pile !== "found" || (sel.pile === "found" && sel.i === w.i));

  return (
    <div className={s.wrap}>
      <div className={s.bar}>
        <button type="button" className={s.btn} onClick={newGame}>Deal</button>
        <span>{isWon ? "You won! Deal again?" : `Moves: ${g.moves}`}</span>
      </div>
      <div className={s.felt} ref={felt}>
        <div className={s.top}>
          <button type="button" className={s.slot} onClick={() => { setG(draw(g)); setSel(null); }} aria-label={g.stock.length ? "Turn a card" : "Turn the waste back over"}>
            {g.stock.length ? <span className={`${s.card} ${s.back}`} /> : <span className={s.recycle}>↻</span>}
          </button>
          <button type="button" className={s.slot} onPointerDown={press({ pile: "waste" })} onClick={() => click({ pile: "waste" })} onDoubleClick={() => home({ pile: "waste" })} aria-label="Waste pile">
            {g.waste.length > (lifted({ pile: "waste" }) ? 1 : 0) ? <Face c={g.waste[g.waste.length - (lifted({ pile: "waste" }) ? 2 : 1)]} picked={isPicked({ pile: "waste" })} /> : null}
          </button>
          <span className={s.gap} />
          {g.found.map((f, i) => (
            <div key={i} ref={(el) => { foundEls.current[i] = el; }} className={s.slot} data-drop={`found:${i}`}>
              <button type="button" className={s.hit} onPointerDown={press({ pile: "found", i })} onClick={() => click({ pile: "found", i })} aria-label={`Foundation ${i + 1}`}>
                {f.length > (lifted({ pile: "found", i }) ? 1 : 0) ? <Face c={f[f.length - (lifted({ pile: "found", i }) ? 2 : 1)]} picked={isPicked({ pile: "found", i })} /> : null}
              </button>
            </div>
          ))}
        </div>
        <div className={s.tab}>
          {g.tab.map((t, i) => (
            <div key={i} className={s.col} data-drop={`tab:${i}`} style={{ height: `calc(${t.length ? fan(t, t.length - 1) : 0}px + var(--ch))` }} onClick={(e) => { if (e.target === e.currentTarget) click({ pile: "tab-empty", i }); }}>
              {t.map((c, at) => (
                <button
                  key={c.suit + c.rank}
                  type="button"
                  className={s.stackCard}
                  style={{ top: fan(t, at), visibility: lifted({ pile: "tab", i, at }) ? "hidden" : undefined }}
                  onPointerDown={c.up ? press({ pile: "tab", i, at }) : undefined}
                  onClick={() => (c.up ? click({ pile: "tab", i, at }) : undefined)}
                  onDoubleClick={() => at === t.length - 1 && home({ pile: "tab", i, at })}
                  aria-label={c.up ? `${label(c.rank)} of ${c.suit}` : "Face-down card"}
                  tabIndex={c.up ? 0 : -1}
                >
                  <Face c={c} picked={isPicked({ pile: "tab", i, at })} />
                </button>
              ))}
            </div>
          ))}
        </div>
        {drag && (
          <div className={s.ghost} style={{ left: drag.x, top: drag.y }} aria-hidden="true">
            {drag.cards.map((c, k) => <span key={c.suit + c.rank} className={s.ghostCard} style={{ top: k * FAN_UP }}><Face c={c} /></span>)}
          </div>
        )}
        <canvas ref={canvas} className={s.party} data-on={party || undefined} aria-hidden="true" />
      </div>
    </div>
  );
}
