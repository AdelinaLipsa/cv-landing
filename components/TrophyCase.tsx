"use client";
import { useEffect, useState } from "react";
import { ACHIEVEMENTS, unlocked, type AchievementId } from "@/lib/achievements";
import { ramenStorm } from "@/lib/ramenStorm";
import CountUp from "./CountUp";
import GlareHover from "./GlareHover";
import GradientText from "./GradientText";
import s from "./TrophyCase.module.css";

// The arcade's trophy case: every achievement on a shelf. Found ones shine (React Bits GlareHover),
// the rest are dark silhouettes with only the hint showing. All of them: ramen rain and a way to reach her.
const IDS = Object.keys(ACHIEVEMENTS) as AchievementId[];

// A 9 × 9 pixel cup, drawn from a map like the arcade's sprites.
const CUP = [".#######.", "##.###.##", "##.###.##", ".#.###.#.", "..#####..", "...###...", "....#....", "...###...", "..#####.."];
const Cup = ({ on }: { on: boolean }) => (
  <svg className={s.cup} viewBox="0 0 9 9" aria-hidden="true" shapeRendering="crispEdges">
    {CUP.flatMap((row, y) => [...row].map((c, x) => (c === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={on ? (y < 2 ? "#ffd86b" : "#F5B53F") : "#2a2660"} /> : null)))}
  </svg>
);

export default function TrophyCase({ contact }: { contact: () => void }) {
  const [got, setGot] = useState<AchievementId[] | null>(null);
  useEffect(() => setGot(unlocked()), []);
  const all = got?.length === IDS.length;
  useEffect(() => { if (all) ramenStorm(); }, [all]);
  if (!got) return null;

  return (
    <div className={s.case}>
      <div className={s.head}>
        <b className={s.count}><CountUp to={got.length} duration={1.2} /><span className={s.total}>/{IDS.length}</span></b>
        <span className={s.sub}>{all ? "Every trophy on the shelf." : "Found ones shine. The rest show only a hint."}</span>
      </div>

      {all && (
        <div className={s.done}>
          <b><GradientText colors={["#F5B53F", "#ff7ac6", "#5fd0ff", "#F5B53F"]} animationSpeed={4}>100%. You found everything.</GradientText></b>
          <p>If you liked how this site is built, you’ll like working with me. Let’s talk.</p>
          <button type="button" className={s.talk} onClick={contact}>Message me →</button>
        </div>
      )}

      <ul className={s.shelf}>
        {IDS.map((id) => {
          const a = ACHIEVEMENTS[id], on = got.includes(id);
          const face = (
            <div className={s.cell}>
              <Cup on={on} />
              <b className={s.name}>{on ? a.name : "???"}</b>
              <span className={s.hint}>{a.hint}</span>
            </div>
          );
          return (
            <li key={id} data-on={on || undefined}>
              {on ? (
                <GlareHover width="100%" height="100%" background="#141139" borderRadius="16px" borderColor="#5a4a1a" glareColor="#ffd86b" glareOpacity={0.35} glareSize={240} transitionDuration={650}>{face}</GlareHover>
              ) : face}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
