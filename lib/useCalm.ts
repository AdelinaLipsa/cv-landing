"use client";
import { useEffect, useState } from "react";

// prefers-reduced-motion, hydration-safe: false on the server and first render, real value after mount.
// (motion's useReducedMotion reads it during render, which changes markup between server and client.)
export function useCalm() {
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    setCalm(q.matches);
    const on = () => setCalm(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return calm;
}
