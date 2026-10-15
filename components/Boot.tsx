"use client";
import { motion, useAnimate } from "motion/react";
import { useRef, useState } from "react";
import { ease } from "@/lib/motion";
import { useCalm } from "@/lib/useCalm";
import s from "./Boot.module.css";
import DecryptedText from "./DecryptedText";

type Leave = (pull: number) => void; // pull: how long (ms) the pull-back runs once Boot starts unmounting

// The 2003 unbuilt page, on her teenage PC at night. Both buttons switch the CRT off, then the shell pulls back
// from the monitor (Boot's exit, under Shell's AnimatePresence). gate: still on the server's first render.
export default function Boot({ onBuild, onSkip, gate }: { onBuild: Leave; onSkip: Leave; gate?: boolean }) {
  const calm = useCalm();
  const [scope, animate] = useAnimate();
  const pic = useRef<HTMLDivElement>(null), flash = useRef<HTMLDivElement>(null), dot = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState(0); // set on click: the exit reads it
  const [off, setOff] = useState(false);

  const leave = async (then: Leave, k: number) => {
    if (pull) return;
    const ms = Math.round((calm ? 400 : matchMedia("(max-width: 640px)").matches ? 600 : 900) * k);
    setPull(ms);
    if (!calm) {
      setOff(true);
      // The tube switching off: the picture blows out to white as it squeezes to a line, the line to a dot, the dot fades.
      await animate([
        [flash.current!, { opacity: 1 }, { duration: 0.1 * k, ease: "easeOut" }],
        [pic.current!, { scaleY: 0.004 }, { duration: 0.2 * k, ease: [0.55, 0, 1, 0.45], at: 0 }],
        [pic.current!, { scaleX: 0 }, { duration: 0.12 * k, ease: [0.55, 0, 1, 0.45] }],
        [dot.current!, { opacity: [0, 1, 0], scale: [1, 1.3, 0] }, { duration: 0.16 * k, ease: "easeIn", at: "-0.04" }],
      ]);
    } else await new Promise(requestAnimationFrame); // let the pull render before Shell unmounts Boot: the exit reads it
    then(ms);
  };

  const t = { duration: pull / 1000, ease };
  return (
    <motion.div ref={scope} className={`${s.room} ${gate ? "gate-boot" : ""}`} data-off={off || undefined} exit={calm ? { opacity: 0, transition: t } : undefined}>
      <motion.div className={s.night} aria-hidden="true" exit={calm ? undefined : { opacity: 0, transition: t }}>
        <div className={s.desk} />
      </motion.div>

      {/* The camera pulls back: the monitor drops away into the dark while the page comes up around it. */}
      <motion.div className={s.rig} exit={calm ? undefined : { scale: 0.26, y: "-4%", opacity: [1, 1, 0], transition: { ...t, opacity: { ...t, times: [0, 0.55, 1] } } }}>
        <div className={s.glow} aria-hidden="true" />
        <div className={s.bezel}>
          <div className={s.screen}>
            <div ref={pic} className={s.pic}>
              <main className={s.boot}>
                <h1 className={s.h1}>
                  {/* The real text reserves the space, so the scramble never reflows the page. */}
                  <span className={s.ghost} aria-hidden="true">This CV doesn’t exist yet.</span>
                  <span className={s.decrypt}><DecryptedText text="This CV doesn’t exist yet." animateOn="hover" sequential revealDirection="start" speed={45} characters="01<>/{}[]#;" encryptedClassName={s.enc} /></span>
                </h1>
                <p>
                  Adelina Lipșa<br />Technical Product Owner<br />Full-stack developer<br />Bucharest, Romania
                </p>
                <div className={s.actions}>
                  <button type="button" className={`${s.button} ${s.build}`} onClick={() => leave(onBuild, 1)}>Watch me build it</button>
                  <button type="button" className={s.button} onClick={() => leave(onSkip, 0.5)}>Skip to the finished CV</button>
                </div>
                <div className={s.boxes} aria-hidden="true">
                  <div className={s.box} style={{ height: 140 }}>[ what I built, and what I own ]</div>
                  <div className={s.pair}>
                    <div className={s.box} style={{ height: 110 }}>[ career ]</div>
                    <div className={s.box} style={{ height: 110 }}>[ skills ]</div>
                  </div>
                  <div className={s.box} style={{ height: 90 }}>[ contact ]</div>
                </div>
                {/* The joke lives on the sticky note now; screen readers still get it here. */}
                <p className={s.sr}>&lt;!-- TODO: make this look like something --&gt;</p>
              </main>
              <div ref={flash} className={s.flash} aria-hidden="true" />
            </div>
            <div ref={dot} className={s.dot} aria-hidden="true" />
            <div className={s.glass} aria-hidden="true" />
          </div>
          <div className={s.chin} aria-hidden="true">
            <span className={s.plate} />
            <span className={s.lights}><span className={s.disk} /><span className={s.led} /><span className={s.power} /></span>
          </div>
        </div>
        <div className={s.stand} aria-hidden="true" />
        <div className={s.note} aria-hidden="true">TODO: make this look like something</div>
      </motion.div>
    </motion.div>
  );
}
