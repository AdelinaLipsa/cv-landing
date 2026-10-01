"use client";
import { motion } from "motion/react";
import { useState } from "react";
import type { UI } from "../Shell";
import { layers, things } from "@/content/skills";
import { drift, slow } from "@/lib/motion";
import BlurText from "../BlurText";
import SpotlightCard from "../SpotlightCard";
import p from "./pane.module.css";
import s from "./Skills.module.css";

const CHIP = {
  used: { backgroundColor: "#F5B53F", color: "#17153A" },
  on: { backgroundColor: "var(--surface-2)", color: "var(--ink)" },
  onDark: { backgroundColor: "rgba(247,246,251,0.1)", color: "#F7F6FB" },
  off: { backgroundColor: "var(--surface-2)", color: "var(--steam)" },
  offDark: { backgroundColor: "rgba(247,246,251,0.1)", color: "#8E8CAE" },
};

export default function Skills(_: { ui: UI }) {
  const [id, setId] = useState("all");
  const cur = things.find((t) => t.id === id)!;
  const all = id === "all";
  const used = (c: string) => (cur.used as readonly string[]).includes(c);
  // Hovering a skill lights up the roles that used it: the picker, read backwards.
  const [hov, setHov] = useState<string | null>(null);
  const lit = (t: (typeof things)[number]) => !!hov && (t.used as readonly string[]).includes(hov);

  return (
    <div className={p.column}>
      <div className={s.head}>
        <h1 className={p.title}><BlurText text="The whole stack" animateBy="words" delay={60} /></h1>
        {/* A hand-drawn nudge, like the music button's, until a role is picked */}
        {all && (
          <span className={s.nudge} aria-hidden="true">
            <svg width="46" height="40" viewBox="0 0 46 40" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M40 4C26 6 14 14 10 30" />
              <path d="M18 26l-8 6-3-10" />
            </svg>
            <span className={s.nudgeText}>pick a job or a project to see what I used there</span>
          </span>
        )}
      </div>

      <div className={s.picker} role="radiogroup" aria-label="Pick a role or a project">
        {things.map((t) => (
          <button key={t.id} type="button" role="radio" aria-checked={t.id === id} data-lit={lit(t) || undefined} className={s.pick} onClick={() => setId(t.id)}>
            {t.id === id && <motion.span layoutId="skills-pick" className={s.pickBg} transition={drift} />}
            <span className={s.pickText}>{t.label}</span>
          </button>
        ))}
      </div>

      <div className={s.layers}>
        {layers.map((l, i) => {
          const dark = i === 0;
          const touched = all || l.chips.some(used);
          return (
            <motion.div
              key={l.name}
              data-tour={dark ? "product" : undefined}
              animate={{ opacity: touched ? 1 : 0.42, x: touched ? 0 : 10, scale: touched ? 1 : 0.985 }}
              transition={slow}
            >
              <SpotlightCard className={`${s.slab} ${dark ? s.dark : ""}`} spotlightColor={dark ? "rgba(245, 181, 63, 0.16)" : "rgba(51, 85, 255, 0.1)"}>
              <span className={s.layerName}>{l.name}</span>
              <div className={p.chips}>
                {l.chips.map((c) => {
                  const state = used(c) ? "used" : all ? (dark ? "onDark" : "on") : dark ? "offDark" : "off";
                  const how = state === "used" ? ", used there" : "";
                  return (
                    <motion.span key={c} className={s.chip} initial={false} animate={CHIP[state]} transition={drift} aria-label={c + how} whileHover={{ y: -3, scale: 1.08 }} onHoverStart={() => setHov(c)} onHoverEnd={() => setHov(null)}>
                      {c}
                    </motion.span>
                  );
                })}
              </div>
              </SpotlightCard>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
