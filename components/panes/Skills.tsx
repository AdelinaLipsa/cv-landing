"use client";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import type { UI } from "../Shell";
import { layers, things } from "@/content/skills";
import { drift, slow } from "@/lib/motion";
import { useBlueprint } from "../BlueprintBuild";
import ShuffleHeading from "../ShuffleHeading";
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

export default function Skills({ ui }: { ui: UI }) {
  const [id, setId] = useState("all");
  const cur = things.find((t) => t.id === id)!;
  const all = id === "all";
  const used = (c: string) => (cur.used as readonly string[]).includes(c);
  // Hovering a skill lights up the roles that used it: the picker, read backwards.
  const [hov, setHov] = useState<string | null>(null);
  const lit = (t: (typeof things)[number]) => !!hov && (t.used as readonly string[]).includes(hov);

  // The guide: Product Management is the hero build, its chips dealt out of one deck at its header. The other
  // layers, the picker and the nudge ripple in 0.4s after it, on skills.rest.
  const column = useRef<HTMLDivElement>(null), stack = useRef<HTMLDivElement>(null);
  const { touring, era } = ui, rest = ui.built("skills.rest");
  useBlueprint(stack, ui.built("skills.product"), { touring, era, sel: '[data-bp="product"]', deck: "[data-deck]" });
  useBlueprint(stack, rest, { touring, era, sel: '[data-bp="rest"]', delay: 0.4 });
  useBlueprint(column, rest, { touring, era, sel: '[data-bp="pick"]', bare: "[data-bp-bare]", delay: 0.4 });

  return (
    <div ref={column} className={p.column}>
      <div className={s.head}>
        <h1 className={p.title} data-skin="title"><ShuffleHeading text="The whole stack" /></h1>
        {/* A hand-drawn nudge, like the music button's, until a role is picked */}
        {all && (
          <span className={s.nudge} aria-hidden="true" data-bp-bare>
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
          <button key={t.id} type="button" role="radio" aria-checked={t.id === id} data-lit={lit(t) || undefined} className={s.pick} data-skin="button" data-bp="pick" onClick={() => setId(t.id)}>
            {t.id === id && <motion.span layoutId="skills-pick" className={s.pickBg} transition={drift} />}
            <span className={s.pickText}>{t.label}</span>
          </button>
        ))}
      </div>

      <div ref={stack} className={s.layers}>
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
              <SpotlightCard className={`${s.slab} ${dark ? s.dark : ""}`} data-skin={dark ? "card dark" : "card"} data-bp={dark ? "product" : "rest"} spotlightColor={dark ? "rgba(245, 181, 63, 0.16)" : "rgba(51, 85, 255, 0.1)"}>
              <span className={s.layerName}>{l.name}</span>
              <div className={p.chips}>
                {l.chips.map((c) => {
                  const state = used(c) ? "used" : all ? (dark ? "onDark" : "on") : dark ? "offDark" : "off";
                  const how = state === "used" ? ", used there" : "";
                  return (
                    <motion.span key={c} className={s.chip} data-skin="chip" data-deck initial={false} animate={CHIP[state]} transition={drift} aria-label={c + how} whileHover={{ y: -3, scale: 1.08 }} onHoverStart={() => setHov(c)} onHoverEnd={() => setHov(null)}>
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
