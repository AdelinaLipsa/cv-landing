# Motion and type research: what was adopted

Source research (below, unedited) was run on 2026-10-17 at Adelina's request ("fun and special, no AI slop,
research the internet"). Adopted, with these changes:

- **Motion beats 1–9: adopted as written**, as the motion language for Tasks 4–10 of
  `docs/superpowers/plans/2026-10-17-guide-motion.md`. Where a task's plan text and this file disagree on *how
  something moves*, this file wins; the plan still owns *what* is built and the interfaces.
  - Captions (Task 7) use the masked word rise (SplitText `mask:"words"`), not per-word blur.
  - The player (Task 8) is the "git log --graph of her life" (beat 9) with Draggable snap (beat 8).
  - Any new on-screen words (`HEAD`, `REW`, labels) go through the `cv-copywriter` agent.
- **Typography (section 10): not adopted.** Adelina passed on Recursive, Hubot/Mona Sans and Anybody, and asked for
  "best fonts for 2026". Chosen: **Instrument Sans** (OFL, Google, `wdth 75–100`, `wght 400–700`) for display and
  body, **Instrument Serif** italic for asides only; JetBrains Mono, Tinos and Caveat stay. Sixtyfour is not used;
  the VCR display uses the mono face. All fonts load `latin` + `latin-ext` (ș, ț, ă).
- Era faces: 2003 `"Times New Roman", Tinos, serif`; glossy `"Lucida Grande", "Trebuchet MS", Verdana, sans-serif`;
  flat Open Sans (lazy-loaded when the guide starts); now: the site's fonts.

---

# Motion and type research for "Watch me build it"

The rule behind every pick: **each beat moves the way its own era moved.** The motion itself shows her years.

## 1. Era transitions (2003, glossy, flat, now)
- **Each era change uses the reveal of the era being left.**
  - 0→1: a dial-up repaint. A hard band sweeps down the page in about 18 visible steps: the new era above it, the old one below.
  - 1→2: the gloss deflates. Shadows, gradients and radius ease to zero.
  - 2→3: one smooth morph.
- Build: an element-scoped View Transition on `.viewport` (`element.startViewTransition`, Chrome 147+). Animate `::view-transition-new` with `clip-path: inset(0 0 100% 0) → inset(0)` and `steps(18)` timing for 0→1. For 1→2, register the era tokens with `@property` (`<length>`, `<color>`) so radius, shadow and surface interpolate on `slow`. Where View Transitions are missing, the eras swap with the token ease. That fallback is acceptable.
- Refs: https://developer.chrome.com/docs/css-ui/view-transitions/element-scoped-view-transitions, and Next's guide `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` (React `<ViewTransition>` works in App Router).
- Cost S–M. Perf: the snapshot is one GPU layer, so it is cheap. Never run a transition during a camera move.

## 2. Camera between subjects and panes
- **Rack focus, not a blur that is always on.** The camera arcs in three phases: pull out to 0.96, track, push in. GSAP timeline on one stage transform, `Flip.fit(stage, subject, {scale:true})` to compute the framing. Blur and dim ramp in only *after* the move lands (about 300ms), like a focus puller, and lift before the next move. This looks cinematic, and it means `backdrop-filter` never runs while the stage transforms.
- One `CustomEase` per move type, derived from `track`, `glide` and `slow`.
- Ref: https://gsap.com/docs/v3/Plugins/Flip/ (`Flip.fit`). For framing language: Codrops grid to zoomed view, https://tympanus.net/codrops/2023/05/04/ideas-for-grid-to-slideshow-switch-animations/
- Cost M. Perf: transform only, with `will-change` set only during a move. Phones use scale ≤1.1 and no blur, as specced.

## 3. Captions
- **Masked word rise:** each word slides up from under a clip (`yPercent:110 → 0`, `expo.out`, 0.45s). Start times come from the tour clock, not a stagger, so speed and scrub stay in sync. `SplitText.create(el,{type:"words",mask:"words",autoSplit:true,onSplit})`.
- The `web` aside comes in later at 60% opacity, as one masked line. Do not use BlurText or DecryptedText here; decrypt reads as hacker or chatbot. Keep `DecryptedText` for one commit hash (beat 4).
- Refs: https://gsap.com/docs/v3/Plugins/SplitText/, https://www.osmo.supply/resource/masked-text-reveal (Dennis Snellenberg's Osmo)
- Cost S. Perf: about 25 spans, transform only.

## 4. Career graph growing
- **A pen plotter with a HEAD tag.**
  - The line draws with DrawSVG (`drawSVG:"0% N%"`), and a MotionPath head dot rides its tip.
  - A tiny mono label `HEAD → agrocity` travels with the tip and retypes per job.
  - At each commit the dot stamps: scale 0 → 1.15 → 1, plus one ring that expands and fades. No bounce ease.
  - At "product branches off", a second path draws out of the first at the fork node.
  - A 7-char hash flickers once per commit (`ScrambleText`, hex chars, 0.3s).
- Refs: https://gsap.com/docs/v3/Plugins/DrawSVGPlugin/, https://gsap.com/docs/v3/Plugins/MotionPathPlugin/
- Cost M. Perf: SVG stroke only. Fine.

## 5. Section builds
- **Blueprint, then fill.** Each tile's outline draws first: DrawSVG on an absolutely positioned SVG `rect` with `pathLength` and the tile's radius. Then the content fills in with the era's own manner: Times text just *appears* in era 0, while era 3 gets a 6px masked rise. Grids reveal with `stagger:{grid:"auto",from:"start",amount:0.4}` so they ripple, not cascade.
- For Skills, Product Management's tiles assemble with `Flip.from` out of one stacked deck at the group header. That one is the hero build; the other groups only ripple.
- Ref: https://tympanus.net/codrops/2025/09/01/recreating-palmers-draggable-product-grid-with-gsap/ (Flip and SplitText detail build)
- Cost M. Perf: outline SVGs are removed after the build.

## 6. Tape-rewind opening
- **The real build timeline, reversed.** `master.timeScale(-6)` with an accelerating CustomEase, so the un-build is literally the build backwards. That is honest, and it is free.
- Over it, a VCR on-screen display: `◀◀ REW` top left and a tape counter rolling Now → 2003, in a CRT face (see 10).
- One tracking-noise band (40px strip, SVG `feTurbulence` + `feDisplacementMap` applied only to that strip) runs upward twice.
- Chroma: a 2px red/cyan `text-shadow` on the display only, not a filter on the page.
- Refs: https://tympanus.net/codrops/2016/05/11/distorted-button-effects-with-svg-filters/ (displacement scale technique), Sixtyfour (below)
- Cost S–M. Perf: the filter is on a 40px strip, never the full viewport.

## 7. Finale pull-back
- **A crane shot with a settle.** The camera scale goes from 1 down to fit the whole Home pane on `slow`, and holds for one beat on the full page. Then it pushes into the hero with a 2% overshoot that lands on the `land` spring (`motion/react` `animate` with spring). The guide's UI leaves by sinking 12px and fading, *after* the camera has stopped.
- The room's lamp warms (exposure +0.15 over 1.2s in three.js) as the last thing. The light switching on is the payoff.
- Ref (room with a GSAP camera flight, React 19 + three): https://tympanus.net/codrops/?p=115219
- Cost S. Perf: one transform plus one uniform.

## 8. Player and scrubber
- See 9: the player *is* the git graph.
- **Tactile scrub:** a GSAP `Draggable` (in the gsap package) on the playhead, with `snap` to chapter years. On release it eases into the nearest chapter. While dragging, the caption shows the chapter title in the mono face, frame-stepped.
- Cost M.

## 9. Signature: "git log --graph of her life"
- The player is a slim horizontal `git log --graph`. Her years are commits, the playhead is `HEAD`, and at 2022 a second lane forks off (product), exactly like the Career graph.
- Scrubbing back is a real `git checkout`: the page un-builds to that commit. The tape-rewind is HEAD running back along this same line.
- Beats 4, 6 and 8 become one object, it tells "PO who still codes" without a word, and no portfolio template has it. It is the same SVG and DrawSVG code as the Career graph.
- Cost M. Any on-screen labels (`HEAD`, `REW`) go through cv-copywriter.

## 10. Typography

**Bug first:** `Anybody` and `Figtree` load `subsets:["latin"]`. U+0219 ș, U+021B ț and ă are in **latin-ext**, so the ș in "Lipșa" renders in a fallback font and ignores the wdth effect. Add `"latin-ext"`. Both families do contain the glyphs (checked).

All glyph checks below were run with fontTools on the actual files, for ș ț ă â î and their capitals. Licences were read in each repo.

**Pick: Recursive + Recursive Mono + Shantell Sans; keep Figtree for body.**
- **Recursive** (Arrow Type, OFL, Google; axes `wght 300–1000`, `CASL 0–1`, `MONO 0–1`, `slnt`, `CRSV`; Romanian OK). Her name's proximity effect morphs *casual ↔ linear and proportional ↔ monospace*: the name turns into code as you approach. That is her story in one glyph. It also replaces JetBrains Mono (Recursive Mono is the same file), so one fewer download. In next/font, limit `axes` to what is used.
  - Licence: https://github.com/arrowtype/recursive/blob/main/OFL.txt
  - Caveat: it has no `wdth`, so the effect becomes weight + casual + mono instead of width.
- **Body: keep Figtree.** It is fine at 15–16px and not an AI default. Don't churn it.
- **Hand: Shantell Sans** (Arrow Type and Shantell Martin, OFL; axes `INFM`, `BNCE`, `SPAC`, `wght`; Romanian OK). Caveat is the most overused handwriting on the web. Shantell's `BNCE` axis can jiggle the sticky note.
  - Licence: https://github.com/arrowtype/shantell-sans/blob/main/OFL.txt
- **CRT/OSD: Sixtyfour** (Jens Kutilek, OFL, Google; C64-inspired, with axes `SCAN` for scanlines and `BLED` for phosphor bleed). Animate `SCAN` and `BLED` during the rewind and on the C64 boot.
  - Licence: https://github.com/jenskutilek/homecomputer-fonts/blob/main/OFL.txt
  - **No ș ț ă**, so use it for digits and caps only (REW, years), never for her name.

**Alternative: Hubot Sans (display) + Mona Sans (body) + Departure Mono.**
- **Hubot Sans and Mona Sans** are GitHub's own faces (OFL, Google; `wdth 75–125`, `wght 200–900`; Romanian OK). Hubot is mechanical and retro-tech, keeps a real width axis for the name, and fits the git-graph story.
  - Licences: https://github.com/github/hubot-sans/blob/main/LICENSE and https://github.com/github/mona-sans/blob/main/LICENSE
- **Departure Mono** (Helena Zhang, OFL font licence in the release zip; Romanian OK) is a lo-fi pixel mono. Self-host it via `next/font/local`.
  - Site: https://departuremono.com
- Risk: Mona Sans is common on developer sites.

**Era faces** (use system stacks, which load nothing and are exactly what those years shipped):
- 2003: `"Times New Roman", Tinos, serif`. Tinos is metric-compatible, so keep it as the fallback.
- Glossy: `"Lucida Grande", "Trebuchet MS", Verdana, "DejaVu Sans", sans-serif`.
- Flat: **Open Sans** (Google, `wdth` + `wght`, Romanian OK). It is *the* 2013 web font. Lazy-load it when the guide starts.

## Do not do
- Fade-up-on-scroll on everything; blur-in text on every line.
- Typewriter with a caret; decrypt or scramble on sentences.
- Glassmorphism caption cards; gradient blobs; particle or confetti bursts at the finale.
- Full-viewport `backdrop-filter` or SVG filters while the stage moves.
- Bounce or elastic eases on commits; jump cuts between panes.
- Generic VHS overlay presets (full-screen noise GIF, RGB-split shader on the whole page).
- Inter, Space Grotesk, Clash, Satoshi, Syne, Poppins, DM Sans.
