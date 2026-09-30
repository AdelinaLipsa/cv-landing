"use client";
import { useEffect, useRef, useState } from "react";
import type { Lofi } from "@/lib/lofi";
import s from "./SoundToggle.module.css";

// Off until pressed: no autoplay, ever. The audio engine loads on first press.
export default function SoundToggle() {
  const [on, setOn] = useState(false);
  const player = useRef<Lofi | null>(null);

  const toggle = async () => {
    if (player.current) { player.current.stop(); player.current = null; setOn(false); return; }
    const { startLofi } = await import("@/lib/lofi");
    player.current = startLofi(() => { player.current = null; setOn(false); });
    setOn(true);
  };

  // Hush while the tab is hidden, pick up where it left off.
  useEffect(() => {
    const onVis = () => {
      const ctx = player.current?.ctx;
      if (!ctx) return;
      if (document.hidden) ctx.suspend(); else ctx.resume();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); player.current?.stop(); };
  }, []);

  return (
    <button type="button" className={s.btn} onClick={toggle} aria-pressed={on} aria-label={on ? "Stop the lofi" : "Play some pixel lofi"} title={on ? "Stop the lofi" : "Pixel lofi, 10 minutes"}>
      <span className={`${s.bars} ${on ? s.playing : ""}`} aria-hidden="true"><i /><i /><i /><i /></span>
    </button>
  );
}
