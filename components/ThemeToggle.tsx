"use client";
import { useEffect, useState } from "react";
import { unlock } from "@/lib/achievements";
import s from "./ThemeToggle.module.css";

const KEY = "cv-theme-v2";

// Light or dark. The choice is set on <html> before first paint (layout's GATE script) and remembered.
export default function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);
  const [touched, setTouched] = useState(false); // the nudge goes once it has done its job
  useEffect(() => setDark(document.documentElement.dataset.theme === "dark"), []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    setTouched(true);
    if (next) unlock("dark");
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try { localStorage.setItem(KEY, next ? "dark" : "light"); } catch { }
  };

  return (
    <span className={s.wrap}>
      {/* Hand-drawn nudge, like the sound button's: a joke below, arrow curving up to the button.
          CSS picks the joke from <html data-theme>, so it's right on first paint. */}
      {!touched && <span className={s.nudge} aria-hidden="true">
        <span className={s.nudgeText}><span className={s.light}>reading this at 2am?</span><span className={s.dark}>too emo? lights on</span></span>
        <svg className={s.nudgeArrow} width="46" height="40" viewBox="0 0 46 40" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4c14 2 26 10 30 26" />
          <path d="M28 26l8 6 3-10" />
        </svg>
      </span>}
    <button type="button" className={className} onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} aria-pressed={dark}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {dark
          ? <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>
          : <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />}
      </svg>
    </button>
    </span>
  );
}
