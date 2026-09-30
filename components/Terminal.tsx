"use client";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { about, jobs, profile, stillShipping } from "@/content/cv";
import { tiles } from "@/content/wall";
import { glide } from "@/lib/motion";
import AnimatedList from "./AnimatedList";
import s from "./Terminal.module.css";

// three.js only loads when the terminal opens.
const ASCIIText = dynamic(() => import("./ASCIIText"), { ssr: false });

type Line = { id: number; node: ReactNode };

const HELP = "whoami, ls projects, cat about.txt, git log, curl cv, sudo hire adelina, clear, exit";
const hash = (id: string) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(16).padStart(7, "0").slice(0, 7);

export default function Terminal({ onClose, onContact, onWork }: { onClose: () => void; onContact: () => void; onWork: () => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const reduce = typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const print = (...nodes: ReactNode[]) => setLines((l) => [...l, ...nodes.map((node) => ({ id: nextId.current++, node }))]);

  useEffect(() => {
    input.current?.focus();
    print(<span className={s.muted}>Type help. Esc or ` closes.</span>);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { body.current?.scrollTo({ top: body.current.scrollHeight }); }, [lines]);

  const run = (raw: string) => {
    const cmd = raw.trim().replace(/\s+/g, " ");
    print(<span><span className={s.prompt}>adelina@cv ~ $</span> {cmd}</span>);
    if (!cmd) return;
    setHistory((h) => [cmd, ...h]);
    setHi(-1);

    switch (cmd.toLowerCase()) {
      case "help":
        return print(HELP);
      case "whoami":
        return print(`${profile.name}. ${profile.role}. ${profile.roleSecond}`, <span className={s.muted}>{profile.location}</span>);
      case "ls projects":
      case "ls":
        return print(
          <div className={s.list}>
            <AnimatedList
              items={tiles.map((t) => `${t.title}  (${t.label})`)}
              onItemSelect={() => { onClose(); onWork(); }}
              showGradients
              enableArrowNavigation={false}
              displayScrollbar={false}
            />
          </div>,
          <span className={s.muted}>Click one to open the wall.</span>
        );
      case "cat about.txt":
        return print(...about);
      case "git log":
        return print(
          <span><span className={s.hash}>commit {hash(stillShipping.id)}</span> <span className={s.both}>(HEAD, dev, product)</span></span>,
          `    ${stillShipping.title}, ${stillShipping.dates}`,
          ...jobs.flatMap((j) => [
            <span key={j.id}><span className={s.hash}>commit {hash(j.id)}</span> <span className={j.branch === "dev" ? s.dev : s.product}>({j.branch})</span></span>,
            `    ${j.company}, ${j.short}, ${j.dates}`,
          ])
        );
      case "curl cv":
      case "curl /api/cv":
        return print(`curl ${location.origin}/api/cv`, <span className={s.muted}>The whole CV, as JSON. Pipe it into jq if you’re that kind of person.</span>);
      case "sudo hire adelina":
        print(<span className={s.muted}>[sudo] password for recruiter: ********</span>, <span className={s.dev}>Permission granted. Opening WhatsApp with a first line already written.</span>);
        setTimeout(() => { onClose(); onContact(); }, 1400);
        return;
      case "sudo":
        return print("sudo what? Try: sudo hire adelina");
      case "clear":
        return setLines([]);
      case "exit":
        return onClose();
      default:
        return print(`command not found: ${cmd}. Try help.`);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { run(value); setValue(""); }
    else if (e.key === "Escape" || e.key === "`") { e.preventDefault(); onClose(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); const n = Math.min(hi + 1, history.length - 1); setHi(n); setValue(history[n] ?? ""); }
    else if (e.key === "ArrowDown") { e.preventDefault(); const n = Math.max(hi - 1, -1); setHi(n); setValue(n < 0 ? "" : history[n]); }
  };

  return createPortal(
    <>
      <motion.div className={s.backdrop} onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div
        className={s.term}
        role="dialog"
        aria-modal="true"
        aria-label="Terminal"
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={glide}
        onClick={() => input.current?.focus()}
      >
        <div className={s.bar}>
          <span className={s.dots} aria-hidden="true"><i /><i /><i /></span>
          <span>adelina@cv</span>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close terminal">esc</button>
        </div>
        {!reduce && (
          <div className={s.banner} aria-hidden="true">
            <ASCIIText text="ADELINA" enableWaves asciiFontSize={6} textFontSize={180} planeBaseHeight={9} textColor="#F7F6FB" />
          </div>
        )}
        <div ref={body} className={s.body} aria-live="polite">
          {lines.map((l) => <div key={l.id} className={s.line}>{l.node}</div>)}
          <label className={s.inputRow}>
            <span className={s.prompt}>adelina@cv ~ $</span>
            <input
              ref={input}
              className={s.input}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKey}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Command"
            />
          </label>
        </div>
      </motion.div>
    </>,
    document.body
  );
}
