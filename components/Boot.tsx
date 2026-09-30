"use client";
import s from "./Boot.module.css";
import DecryptedText from "./DecryptedText";

// The 2003 unbuilt page. onBuild starts build mode, onSkip opens the finished page.
export default function Boot({ onBuild, onSkip }: { onBuild: () => void; onSkip: () => void }) {
  return (
    <main className={s.boot}>
      <h1 className={s.h1}>
        {/* The real text reserves the space, so the scramble never reflows the page. */}
        <span className={s.ghost} aria-hidden="true">This CV doesn’t exist yet.</span>
        <span className={s.decrypt}><DecryptedText text="This CV doesn’t exist yet." animateOn="hover" sequential revealDirection="start" speed={45} characters="01<>/{}[]#;" encryptedClassName={s.enc} /></span>
      </h1>
      <p>
        Adelina Lipșa<br />Technical Product Owner<br />Full-stack developer before that<br />Bucharest, Romania
      </p>
      <div className={s.actions}>
        <button type="button" className={s.button} onClick={onBuild}>Watch me build it</button>
        <a href="#home" className={s.link} onClick={(e) => { e.preventDefault(); onSkip(); }}>
          Skip, show me the finished one
        </a>
      </div>
      <div className={s.boxes} aria-hidden="true">
        <div className={s.box} style={{ height: 140 }}>[ wall of things that didn’t exist ]</div>
        <div className={s.pair}>
          <div className={s.box} style={{ height: 110 }}>[ career ]</div>
          <div className={s.box} style={{ height: 110 }}>[ skills ]</div>
        </div>
        <div className={s.box} style={{ height: 90 }}>[ contact ]</div>
      </div>
      <p className={s.todo}>&lt;!-- TODO: make this look like something --&gt;</p>
    </main>
  );
}
