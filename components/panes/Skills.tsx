"use client";
import { motion } from "motion/react";
import { useState } from "react";
import type { UI } from "../Shell";
import { layers, things } from "@/content/skills";
import { drift, slow } from "@/lib/motion";
import BlurText from "../BlurText";
import p from "./pane.module.css";
import s from "./Skills.module.css";

const CHIP = {
  built: { backgroundColor: "#F5B53F", color: "#17153A" },
  specced: { backgroundColor: "#EE6E9F", color: "#17153A" },
  on: { backgroundColor: "#F1F0F8", color: "#17153A" },
  onDark: { backgroundColor: "rgba(247,246,251,0.1)", color: "#F7F6FB" },
  off: { backgroundColor: "#F1F0F8", color: "#8E8CAE" },
  offDark: { backgroundColor: "rgba(247,246,251,0.1)", color: "#8E8CAE" },
};

export default function Skills(_: { ui: UI }) {
  const [id, setId] = useState("all");
  const cur = things.find((t) => t.id === id)!;
  const all = id === "all";
  const marked = (c: string) => cur.built.includes(c) || cur.specced.includes(c);

  return (
    <div className={p.column}>
      <div className={s.head}>
        <h1 className={p.title}><BlurText text="The whole stack" animateBy="words" delay={60} /></h1>
        <p className={p.lede}>With the product on top. Pick something I made and see which layers it took.</p>
      </div>

      <div className={s.picker} role="radiogroup" aria-label="Pick something I made">
        {things.map((t) => (
          <button key={t.id} type="button" role="radio" aria-checked={t.id === id} className={s.pick} onClick={() => setId(t.id)}>
            {t.id === id && <motion.span layoutId="skills-pick" className={s.pickBg} transition={drift} />}
            <span className={s.pickText}>{t.label}</span>
          </button>
        ))}
      </div>

      <div className={s.layers}>
        {layers.map((l, i) => {
          const dark = i === 0;
          const touched = all || l.chips.some(marked);
          return (
            <motion.div
              key={l.name}
              className={`${s.slab} ${dark ? s.dark : ""}`}
              data-tour={dark ? "product" : undefined}
              animate={{ opacity: touched ? 1 : 0.42, x: touched ? 0 : 10, scale: touched ? 1 : 0.985 }}
              transition={slow}
            >
              <span className={s.layerName}>{l.name}</span>
              <div className={p.chips}>
                {l.chips.map((c) => {
                  const state = cur.built.includes(c) ? "built" : cur.specced.includes(c) ? "specced" : all ? (dark ? "onDark" : "on") : dark ? "offDark" : "off";
                  const how = state === "built" ? ", built it" : state === "specced" ? ", specced it" : "";
                  return (
                    <motion.span key={c} className={s.chip} initial={false} animate={CHIP[state]} transition={drift} aria-label={c + how}>
                      {c}
                    </motion.span>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className={s.note}>
        <p aria-live="polite">{cur.note}{cur.tbc && <span className={p.tbc}> [TBC: {cur.tbc}]</span>}</p>
        <div className={s.key}>
          <span><i style={{ background: "var(--broth)" }} />Built it</span>
          <span><i style={{ background: "var(--naruto)" }} />Specced it</span>
        </div>
      </div>
    </div>
  );
}
