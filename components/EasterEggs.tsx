"use client";
import { useEffect, useRef } from "react";
import { ACHIEVEMENTS, unlock, unlocked } from "@/lib/achievements";
import { cheatCode, ramenStorm } from "@/lib/ramenStorm";

// Hidden things for the curious: a devtools welcome with commands, the Konami code,
// secret words typed anywhere, and a tab title that misses you. ` (the terminal) lives in Shell.
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const WORDS = ["ramen", "hire", "milk", "sudo"];

// Once per page load: dev mode runs effects twice, and the hello shouldn't say itself twice.
let greeted = false;

const BANNER = String.raw`
    _    _
   / \  | |       Hi, it’s Adelina.
  / _ \ | |       You opened devtools on a product owner’s CV.
 / ___ \| |___    Respect. Yes, I still write code.
/_/   \_\_____|
`;

export default function EasterEggs({ contact, terminal }: { contact: () => void; terminal: () => void }) {
  const act = useRef({ contact, terminal });
  act.current = { contact, terminal }; // Shell's actions change every render; the eggs are set up once

  useEffect(() => {
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // A ramen storm: food tumbles down, bounces, piles up; tap it to slurp. Calm visitors get one bowl in the console.
    const ramen = () => {
      unlock("ramen");
      if (calm) return "🍜";
      ramenStorm();
      return "🍜 Ramen storm. Tap the bowls to slurp them.";
    };
    const hire = () => { act.current.contact(); return "Contact sheet open. Excellent decision."; };
    const milk = () => "🚨 Milk before cereal detected. This incident has been reported to the Oxford comma police.";

    // Commands for the devtools console: hire(), ramen(), …
    const cmds: Record<string, () => string> = {
      hire,
      ramen,
      milk,
      terminal: () => { act.current.terminal(); return "Terminal open. Type help."; },
      play: () => { act.current.terminal(); return "Terminal open. Type play. Arrow keys, and good luck."; },
      secrets: () => "Psst: click anywhere on the page first (keys typed here stay in the console). Then: ↑ ↑ ↓ ↓ ← → ← → B A. Or type ramen, hire, milk, or sudo. Or press ` and type play. Switch tabs and come back. /api/cv is the whole CV as JSON. /humans.txt says hi.",
      coffee: () => "418: I’m a teapot. Try ramen().",
      achievements: () => {
        const got = unlocked();
        console.table(Object.fromEntries(Object.entries(ACHIEVEMENTS).map(([id, a]) => [a.name, { found: got.includes(id as keyof typeof ACHIEVEMENTS) ? "🏆" : "", hint: a.hint }])));
        return `${got.length}/${Object.keys(ACHIEVEMENTS).length} found.`;
      },
    };
    const w = window as unknown as Record<string, unknown>;
    for (const [k, fn] of Object.entries(cmds)) w[k] = () => { unlock("console"); return fn(); };

    if (!greeted) console.log(
      `%c${BANNER}%c\nThe console takes requests:\n  hire()      the fastest way to reach me\n  ramen()     try it\n  milk()      a public service announcement\n  terminal()  a real one, sort of\n  play()      a tiny space shooter\n  secrets()   everything else hidden here\n  achievements()  what you’ve found so far\n\nThe whole CV is JSON at /api/cv.`,
      "font: 700 18px/1.25 ui-monospace, monospace; color: #3355FF",
      "font: 16px/1.6 ui-monospace, monospace; color: #6B6990"
    );
    greeted = true;

    // Konami code and secret words, typed anywhere outside a text field.
    let keys: string[] = [];
    let typed = "";
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as Element).closest?.("input, textarea, [contenteditable]")) return;
      // Forgiving: only arrows, A and B count (spaces, Shift, Caps Lock are ignored), matched by physical key so any layout works.
      const k = e.key.startsWith("Arrow") ? e.key : e.code === "KeyA" ? "a" : e.code === "KeyB" ? "b" : null;
      if (k) keys = [...keys, k].slice(-KONAMI.length);
      if (keys.join() === KONAMI.join()) { keys = []; unlock("konami"); unlock("ramen"); if (calm) console.log("%c+30 lives. Also, ramen.", "font: 700 18px sans-serif; color: #F5B53F"); else cheatCode(); return; }
      if (e.key.length !== 1) return;
      typed = (typed + e.key.toLowerCase()).slice(-8);
      const word = WORDS.find((w) => typed.endsWith(w));
      if (!word) return;
      typed = "";
      if (word === "ramen") ramen();
      else if (word === "hire") hire();
      else if (word === "milk") console.log(milk());
      else console.log("%cadelina is not in the sudoers file. This incident will be reported.", "font: 16px ui-monospace, monospace; color: #E5484D");
    };

    // The tab misses you.
    const title = document.title;
    const onVis = () => { document.title = document.hidden ? "🍜 Your ramen is getting cold…" : title; };

    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis);
      for (const k of Object.keys(cmds)) delete w[k];
    };
  }, []);

  return null;
}
