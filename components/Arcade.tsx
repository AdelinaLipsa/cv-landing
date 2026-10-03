"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { isMuted, setMuted } from "@/lib/sfx";
import { ACHIEVEMENTS, toast, unlock, unlocked } from "@/lib/achievements";
import { getMode, setMode, hasWebGL2, type Mode } from "@/lib/arcadePrefs";
import GamePreview from "./GamePreview";
import FuzzyText from "./FuzzyText";
import DecryptedText from "./DecryptedText";
import GradientText from "./GradientText";
import GlareHover from "./GlareHover";
import Tilt from "./Tilt";
import ClickSpark from "./ClickSpark";
import SideRays from "./SideRays";
import SpaceGame from "./SpaceGame";
import ShipIt from "./ShipIt";
import SprintFighter from "./SprintFighter";
import HighScores from "./HighScores";
import s from "./Arcade.module.css";

// The nav's gamepad opens this: a full-screen arcade of its own (not a sheet, so touches go to the game,
// never to a swipe-to-close). Pick a game, play, come back. Esc or ✕ closes it.
const GAMES = [
  {
    id: "space", title: "Space shooter", colors: ["#5fd0ff", "#F5B53F", "#ff7ac6", "#5fd0ff"], best: "cv-space-hi", blurb: "Three waves, combos, power-ups, and a boss called The Backlog.", Game: SpaceGame,
    keys: [["← →", "move"], ["auto", "your ship fires on its own"], ["Enter", "play again"]],
    touch: [["drag", "on the screen to move"], ["auto", "your ship fires on its own"], ["tap", "play again"]],
    tips: "Power-ups: T triple shot, R rapid fire, S shield, B bomb, + extra life. Quick kills chain a combo up to x5.",
  },
  {
    id: "shipit", title: "Ship It!", colors: ["#7fe3ff", "#2f6bff", "#F5B53F", "#7fe3ff"], best: "", blurb: "Run, jump, charge your blaster. Scope Creep waits at the end.", Game: ShipIt,
    keys: [["← →", "run"], ["Z or ↑", "jump (hold for higher)"], ["X or Space", "shoot, hold to charge"], ["Enter", "play again"]],
    touch: [["◀ ▶", "run"], ["JUMP", "hold for higher"], ["FIRE", "shoot, hold to charge"], ["tap", "play again"]],
    tips: "Hard-hats can’t be hurt while hiding: wait for them to pop up. Pink crosses restore health.",
  },
  {
    id: "fighter", title: "Sprint Fighter", colors: ["#F5B53F", "#ff5a5a", "#ff7ac6", "#F5B53F"], best: "", blurb: "The PO vs The Stakeholder. Best of three. Fireballs included.", Game: SprintFighter,
    keys: [["← →", "walk, hold back to block"], ["↑ ↓", "jump, crouch"], ["Z", "punch (low when crouching)"], ["X", "kick (in the air too)"], ["C", "Ship-o-ken"], ["Enter", "rematch"]],
    touch: [["◀ ▶", "walk, hold back to block"], ["▲ ▼", "jump, crouch"], ["P", "punch"], ["K", "kick"], ["SP", "Ship-o-ken"], ["tap", "rematch"]],
    tips: "Crouch under fireballs. Landing hits fills your meter: when it flashes, your special becomes a MEGA one.",
  },
];

export default function Arcade({ onClose }: { onClose: () => void }) {
  const [on, setOn] = useState<string | null>(null);
  const [last, setLast] = useState<number | null>(null); // the latest final score, for the leaderboard
  const [quiet, setQuiet] = useState(false);
  const [picked, setPicked] = useState<Mode>("hd"); // the user's choice: keys the game, persists
  const [label, setLabel] = useState<Mode>("hd"); // what the header shows; a lost GPU changes only this
  const store = () => { try { return localStorage; } catch { return null; } };
  useEffect(() => { const m = getMode(store(), hasWebGL2()); setPicked(m); setLabel(m); }, []);
  const [run, setRun] = useState(0); // bumped by every user pick so choosing the same mode again still remounts
  const pickMode = (m: Mode) => { setPicked(m); setLabel(m); setMode(store(), m); setRun((n) => n + 1); };
  const onLost = () => { setLabel("retro"); toast({ icon: "🕹️", title: "Switched to Retro", body: "The graphics card needed a break. HD is one tap away." }); };
  const [found, setFound] = useState(0);
  const [best, setBest] = useState<Record<string, number>>({});
  useEffect(() => {
    setQuiet(isMuted()); unlock("arcade");
    setFound(unlocked().length);
    try { setBest(Object.fromEntries(GAMES.filter((g) => g.best).map((g) => [g.id, Number(localStorage.getItem(g.best)) || 0]))); } catch { }
  }, [on]);
  const total = Object.keys(ACHIEVEMENTS).length;
  const toggle = () => setQuiet((q) => { setMuted(!q); return !q; });
  // M toggles sound mid-game; Esc closes. The page behind doesn't scroll while you play.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as Element).closest?.("input, textarea")) return;
      if (e.key === "m" || e.key === "M") toggle();
      if (e.key === "Escape") onClose();
    };
    const root = document.documentElement, was = root.style.overflow;
    root.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); root.style.overflow = was; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const game = GAMES.find((g) => g.id === on);

  return createPortal(
    <div className={s.overlay} role="dialog" aria-modal="true" aria-label="Arcade">
      {!game && <div className={s.rays} aria-hidden="true"><SideRays rayColor1="#3355FF" rayColor2="#ff7ac6" speed={1} intensity={1.6} opacity={0.55} origin="top-left" /></div>}
      <header className={s.head}>
        {game ? <button type="button" className={s.back} onClick={() => { setOn(null); setLast(null); }}>← Arcade</button> : <b className={s.title}>Arcade</b>}
        <span className={s.headRight}>
          <button type="button" className={s.sound} onClick={() => pickMode(label === "hd" ? "retro" : "hd")} title="Switch between HD graphics and the original pixels">
            <span aria-hidden="true">{label === "hd" ? "✨" : "👾"}</span> {label === "hd" ? "HD" : "Retro"}
          </button>
          <button type="button" className={s.sound} onClick={toggle} aria-pressed={!quiet} title="Sound and vibration (M)">
            <span aria-hidden="true">{quiet ? "🔇" : "🔊"}</span> {quiet ? "Sound off" : "Sound on"}
          </button>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close the arcade">✕</button>
        </span>
      </header>
      <div className={s.body}>
        {game ? (
          <div className={s.playing}>
            <game.Game key={`${picked}-${run}`} mode={picked} onLost={onLost} onEnd={setLast} />
            {/* The controls, always visible: keyboard on desktop, touch on phones */}
            <dl className={`${s.controls} ${s.keys}`}>{game.keys.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            <dl className={`${s.controls} ${s.touch}`}>{game.touch.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            <p className={s.tips}>{game.tips}</p>
            <HighScores game={game.id} score={last} />
          </div>
        ) : (
          <div className={s.menu}>
            {/* React Bits all the way: glitchy title, decrypting tagline, tilting glare cards with sparks */}
            <div className={s.hero}>
              <FuzzyText fontSize="clamp(2.8rem, 13vw, 5.5rem)" fontWeight={900} fontFamily="ui-monospace, monospace" color="#5fd0ff" baseIntensity={0.08} hoverIntensity={0.3} glitchMode glitchInterval={3200}>ARCADE</FuzzyText>
              <p className={s.tagline}><DecryptedText text="INSERT COIN · PICK A GAME" animateOn="view" speed={45} maxIterations={12} sequential revealDirection="start" /></p>
            </div>
            <div className={s.progress} title="Type achievements() in the console for the full list">
              <span>🏆 {found}/{total} achievements found</span>
              <i style={{ width: `${(found / total) * 100}%` }} />
            </div>
            <div className={s.grid}>
              {GAMES.map((g) => (
                <ClickSpark key={g.id} sparkColor="#F5B53F" sparkSize={10} sparkRadius={22} sparkCount={10} duration={450}>
                  <Tilt max={6} scale={1.02}>
                    <GlareHover width="100%" height="auto" background="#0d0b24" borderRadius="20px" borderColor="#2a2660" glareColor="#ffffff" glareOpacity={0.18} glareSize={220} transitionDuration={700} className={s.glare}>
                      <button type="button" className={s.card} onClick={() => setOn(g.id)}>
                        <GamePreview id={g.id} className={s.preview} />
                        <b className={s.cardTitle}><GradientText colors={g.colors} animationSpeed={5}>{g.title}</GradientText></b>
                        <span>{g.blurb}</span>
                        <span className={s.cardFoot}>
                          <em className={s.start}>PRESS START ▶</em>
                          {best[g.id] ? <small>BEST {best[g.id]}</small> : null}
                        </span>
                      </button>
                    </GlareHover>
                  </Tilt>
                </ClickSpark>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
