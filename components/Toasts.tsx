"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Toast } from "@/lib/achievements";
import s from "./Toasts.module.css";

// Toasts slide in at the top, stack, and leave after a few seconds: achievements, the clock's notes.
export default function Toasts() {
  const [list, setList] = useState<(Toast & { id: number })[]>([]);
  useEffect(() => {
    let id = 0;
    const on = (e: Event) => {
      const t = { ...(e as CustomEvent<Toast>).detail, id: id++ };
      setList((l) => [...l.slice(-2), t]);
      setTimeout(() => setList((l) => l.filter((x) => x.id !== t.id)), 4200);
    };
    window.addEventListener("cv:toast", on);
    return () => window.removeEventListener("cv:toast", on);
  }, []);
  return (
    <div className={s.stack} role="status" aria-live="polite">
      <AnimatePresence>
        {list.map((t) => (
          <motion.div key={t.id} className={s.toast} initial={{ opacity: 0, y: -16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}>
            <span className={s.icon} aria-hidden="true">{t.icon}</span>
            <span><b>{t.title}</b><small>{t.body}</small></span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
