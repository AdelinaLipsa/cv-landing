"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { glide } from "@/lib/motion";
import { useCalm } from "@/lib/useCalm";
import { pixelBurst } from "@/lib/pixelBurst";
import s from "./Sheet.module.css";

// ponytail: two snap points (open, closed). Add a half-height snap if a sheet ever gets long enough to need it.
export default function Sheet({ open, onClose, label, children }: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const calm = useCalm();
  // Opening: the sheet arrives covered in pixels that dissolve away at random (lib/pixelBurst, after React Bits PixelTransition).
  useEffect(() => {
    if (open && !calm && panel.current && !document.hidden) pixelBurst(panel.current, { reveal: true, cell: 38, step: 0.42, hold: 0.08, z: 5 });
  }, [open, calm]);

  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      back?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={s.backdrop}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
          <motion.div
            ref={panel}
            className={s.panel}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.06, bottom: 0.9 }}
            dragMomentum={false}
            onDragEnd={(_, i) => (i.offset.y > 140 || i.velocity.y > 600) && onClose()}
            initial={calm ? { y: "100%" } : { y: 36, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: "100%" }}
            transition={glide}
          >
            <span className={s.handle} aria-hidden="true" />
            <button type="button" className={s.close} onClick={onClose} aria-label="Close">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
