"use client";
import { useEffect, useState } from "react";
import { isMuted, setMuted } from "@/lib/sfx";
import SpaceGame from "./SpaceGame";
import ShipIt from "./ShipIt";
import SprintFighter from "./SprintFighter";
import s from "./Arcade.module.css";

// The nav's gamepad opens this: pick a game, play, come back.
const GAMES = [
  {
    id: "space", title: "Space shooter", blurb: "Three waves, combos, power-ups, and a boss called The Backlog.", Game: SpaceGame,
    keys: [["← →", "move"], ["auto", "your ship fires on its own"], ["Enter", "play again"]],
    touch: [["drag", "on the screen to move"], ["auto", "your ship fires on its own"], ["tap", "play again"]],
    tips: "Power-ups: T triple shot, R rapid fire, S shield, B bomb, + extra life. Quick kills chain a combo up to x5.",
  },
  {
    id: "shipit", title: "Ship It!", blurb: "Run, jump, charge your blaster. Scope Creep waits at the end.", Game: ShipIt,
    keys: [["← →", "run"], ["Z or ↑", "jump (hold for higher)"], ["X or Space", "shoot, hold to charge"], ["Enter", "play again"]],
    touch: [["◀ ▶", "run"], ["JUMP", "hold for higher"], ["FIRE", "shoot, hold to charge"], ["tap", "play again"]],
    tips: "Hard-hats can’t be hurt while hiding: wait for them to pop up. Pink crosses restore health.",
  },
  {
    id: "fighter", title: "Sprint Fighter", blurb: "The PO vs The Stakeholder. Best of three. Fireballs included.", Game: SprintFighter,
    keys: [["← →", "walk, hold back to block"], ["↑ ↓", "jump, crouch"], ["Z", "punch (low when crouching)"], ["X", "kick (in the air too)"], ["C", "Ship-o-ken"], ["Enter", "rematch"]],
    touch: [["◀ ▶", "walk, hold back to block"], ["▲ ▼", "jump, crouch"], ["P", "punch"], ["K", "kick"], ["SP", "Ship-o-ken"], ["tap", "rematch"]],
    tips: "Crouch under fireballs. Landing hits fills your meter: when it flashes, your special becomes a MEGA one.",
  },
];

export default function Arcade() {
  const [on, setOn] = useState<string | null>(null);
  const [quiet, setQuiet] = useState(false);
  useEffect(() => setQuiet(isMuted()), []);
  const toggle = () => setQuiet((q) => { setMuted(!q); return !q; });
  // M toggles it mid-game too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "m" || e.key === "M") toggle(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const sound = (
    <button type="button" className={s.sound} onClick={toggle} aria-pressed={!quiet} title="Sound and vibration (M)">
      <span aria-hidden="true">{quiet ? "🔇" : "🔊"}</span> {quiet ? "Sound off" : "Sound on"}
    </button>
  );
  const game = GAMES.find((g) => g.id === on);
  if (game) return (
    <div className={s.playing}>
      <div className={s.top}><button type="button" className={s.back} onClick={() => setOn(null)}>← Arcade</button>{sound}</div>
      <game.Game />
      {/* The controls, always visible: keyboard on desktop, touch on phones */}
      <dl className={`${s.controls} ${s.keys}`}>{game.keys.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      <dl className={`${s.controls} ${s.touch}`}>{game.touch.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      <p className={s.tips}>{game.tips}</p>
    </div>
  );
  return (
    <div className={s.menu}>
      <div className={s.top}><span />{sound}</div>
      {GAMES.map((g) => (
        <button key={g.id} type="button" className={s.card} onClick={() => setOn(g.id)}>
          <b>{g.title}</b>
          <span>{g.blurb}</span>
          <em>Play →</em>
        </button>
      ))}
    </div>
  );
}
