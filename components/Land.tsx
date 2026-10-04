"use client";
import { useRef } from "react";
import { useInView } from "motion/react";
import { useCalm } from "@/lib/useCalm";
import AnimatedContent from "./AnimatedContent";

// Cards and blocks land instead of fading in (React Bits AnimatedContent): they drop in from below, small,
// and spring past full size before settling. Like the headings, it only mounts once the block is on screen
// (the pages scroll inside their own panes, which AnimatedContent's window scroll trigger can't see), and plays
// straight away: its own trigger measured the card after pushing it 110px down, missed, and left it invisible.
export default function Land({ children, delay = 0, className, as: Tag = "div" }: { children: React.ReactNode; delay?: number; className?: string; as?: "div" | "li" | "section" }) {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.15 });
  const calm = useCalm();
  const El = Tag as "div";
  if (calm) return <El className={className}>{children}</El>;
  return (
    <El ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      {seen ? (
        <AnimatedContent distance={110} scale={0.82} duration={0.85} ease="back.out(1.7)" initialOpacity={0} delay={delay} immediate>{children}</AnimatedContent>
      ) : (
        <div style={{ visibility: "hidden" }}>{children}</div>
      )}
    </El>
  );
}
