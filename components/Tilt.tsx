"use client";
import { motion, useReducedMotion, useSpring } from "motion/react";
import { useRef } from "react";

// React Bits TiltedCard's hover physics, for any content: leans toward the pointer and lifts a little.
// Spans, so it can sit inside a button. Mouse only: touch has no hover to tilt with.
const SPRING = { damping: 30, stiffness: 100, mass: 2 };

export default function Tilt({ children, className = "", max = 8, scale = 1.03, fill = false }: { children: React.ReactNode; className?: string; max?: number; scale?: number; fill?: boolean }) {
  const h = fill ? "100%" : undefined; // fill: take the parent's height
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const rx = useSpring(0, SPRING), ry = useSpring(0, SPRING), s = useSpring(1, SPRING);
  const on = (e: React.PointerEvent) => e.pointerType === "mouse" && !reduce;

  const move = (e: React.PointerEvent) => {
    if (!on(e) || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    rx.set(((e.clientY - r.top) / r.height - 0.5) * -2 * max);
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 2 * max);
  };
  const leave = () => { rx.set(0); ry.set(0); s.set(1); };

  return (
    <span ref={ref} className={className} style={{ display: "block", height: h, perspective: 800 }} onPointerMove={move} onPointerEnter={(e) => on(e) && s.set(scale)} onPointerLeave={leave}>
      <motion.span style={{ display: "block", height: h, rotateX: rx, rotateY: ry, scale: s, transformStyle: "preserve-3d" }}>{children}</motion.span>
    </span>
  );
}
