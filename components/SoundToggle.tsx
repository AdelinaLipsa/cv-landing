"use client";
import { useEffect, useRef, useState } from "react";
import type { Lofi } from "@/lib/lofi";
import s from "./SoundToggle.module.css";

// Audio starts only after the visitor presses the sound button.
export default function SoundToggle() {
  const [on, setOn] = useState(false);
  const player = useRef<Lofi | null>(null);

  const play = async () => {
    const { startLofi } = await import("@/lib/lofi");
    if (player.current) return;
    const p = startLofi(() => { player.current = null; setOn(false); });
    player.current = p;
    // Lit only while it's actually audible, not while the browser holds it back.
    const sync = () => setOn(p.ctx.state === "running");
    p.ctx.addEventListener("statechange", sync);
    sync();
  };

  const toggle = () => {
    const p = player.current;
    if (p && p.ctx.state !== "running") { p.ctx.resume(); return; } // queued but blocked: this press lets it play
    if (p) {
      p.stop(); player.current = null; setOn(false);
      return;
    }
    play();
  };

  // Suspend in the background; resuming requires another button press.
  useEffect(() => {
    const onVis = () => {
      const ctx = player.current?.ctx;
      if (!ctx) return;
      if (document.hidden) ctx.suspend();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); player.current?.stop(); };
  }, []);

  return (
    <span className={s.wrap}>
      {/* A hand-drawn nudge while it's silent: "click me!" floating above, a curved arrow to the button */}
      {!on && (
        <span className={s.nudge} aria-hidden="true">
          <span className={s.nudgeText}><span className={s.mouse}>click me!</span><span className={s.touch}>tap me!</span></span>
          <svg className={s.nudgeArrow} width="46" height="40" viewBox="0 0 46 40" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4c14 2 26 10 30 26" />
            <path d="M28 26l8 6 3-10" />
          </svg>
        </span>
      )}
      <button type="button" className={`${s.btn} water`} onClick={toggle} aria-pressed={on} aria-label={on ? "Stop the lofi" : "Play some pixel lofi"} title={on ? "Stop the lofi" : "Pixel lofi, 10 minutes"}>
        <span className={`${s.bars} ${on ? s.playing : ""}`} aria-hidden="true"><i /><i /><i /><i /></span>
      </button>
    </span>
  );
}
