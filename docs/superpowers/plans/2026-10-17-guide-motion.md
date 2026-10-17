# Guide Motion Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild "Watch me build it" so the page builds itself along Adelina's years under a camera, with documentary
captions, a year scrubber, a rewind opening and a pull-back finale. This replaces the product-tour overlay.

**Architecture:** A pure "director" (`lib/direction.ts`) turns the tour clock into what is built, what is framed and
which cue is live. `Shell` passes that to the panes through `UI` (`built(key)`, `job`, `cue`). The panes gate their
pieces on it. `Tour.tsx` keeps the one clock and composes three parts: `TourCamera` (pane scroll + a scale transform
on the active pane's stage + a focus overlay with a hole), `Caption` (word-by-word lower third) and `TourPlayer` (the
scrubber). Eras restyle every pane from one global stylesheet keyed on `data-era` and `data-skin`.

**Tech Stack:** Next.js 16, React 19, motion v13 (`motion/react`), CSS Modules + one global CSS file, node:test for
pure logic.

**Spec:** `docs/superpowers/specs/2026-10-17-guide-motion-design.md`

## Global Constraints

- Next.js 16 has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before touching Next
  APIs.
- No new dependencies. Use `motion`, `gsap`, `three` as installed.
- The lines in `content/tour.ts` (`say`, `web`, `title`) stay word for word. Any copy change goes through the
  `cv-copywriter` agent.
- With the guide closed, every pane renders exactly as today: era 3, everything built, no transforms on the stage.
- Motion uses the tokens in `lib/motion.ts` (`track`, `slow`, `glide`, `land`, `ease`). Nothing snappy.
- Camera zoom: at most 1.25× on desktop and at most 1.1× on phones (≤ 640px). No blur on phones.
- Reduced motion keeps the `Stepper` sheet path in `Shell.startTour`.
- Light and dark themes both work.
- `npm test` and `npx tsc --noEmit` stay clean after every task.
- The boot monitor (`components/Boot.tsx`, `Boot.module.css`) belongs to separate work. Don't edit it.
  `onBuild(pull: number)` stays as it is. Start this plan only after that work has landed.
- Done is checked in Chrome on localhost (`npm run dev`) at 1440×900 and 390×844.

## Review Focus

1. **Scrubbing or "previous" backwards un-builds.** Anything built after the new time disappears and the era steps
   back. Pinned by `builtAt` tests in Task 1 and the browser check in Task 5.
2. **Closing mid-guide** (✕, Esc, or a tab click) lands on the fully built era-3 page with stage transforms cleared and
   the focus overlay gone. Pinned in Task 3 (`resolveBuilt` test) and Task 7 (browser check).
3. **Resizing or rotating the window mid-guide** re-frames the subject (rects are read per frame, never cached across
   a resize). Browser check in Task 7.
4. **Fast input** (2× speed, rapid next/next/next, dragging the scrubber) never queues camera moves. The latest step
   wins and earlier animations stop. Browser check in Task 7.
5. **Dark theme mid-guide.** The era skins and the caption read correctly in dark. Browser check in Task 4.

---

### Task 1: Director data and pure logic

**Files:**
- Modify: `content/tour.ts`
- Create: `lib/direction.ts`
- Test: `lib/direction.check.ts`

**Interfaces:**
- Produces, in `content/tour.ts`:
  - `type BuildKey = "home.offduty" | "home.room" | "home.dock" | "home.preview" | "career.head" | "career.edu-psychology" | "career.edu-web" | "career.agrocity" | "career.innovational" | "career.fabelx" | "career.ubisoft" | "career.fork" | "career.siterocket" | "career.yomali" | "career.rest" | "skills.product" | "skills.rest" | "work.owned" | "work.built"`
  - `type Cue = { at: string; hot: "phone" | "printer" | "rolodex" | "theme" }`
  - `Step` drops `label` and `code`, and gains `builds: BuildKey[]`, `cues?: Cue[]` and `year?: string`.
  - `export const ALL_BUILT: ReadonlySet<BuildKey>` (every key).
- Produces, in `lib/direction.ts`:
  - `export const TYPE_CPS = 28`
  - `builtAt(i: number): Set<BuildKey>`: the union of `steps[0..i].builds`.
  - `resolveBuilt(touring: boolean, i: number): ReadonlySet<BuildKey>`: `ALL_BUILT` when not touring.
  - `wordsShown(say: string, local: number): number`
  - `cueAt(step: Step, local: number): Cue["hot"] | null`
  - `jobOf(step: Step): string | null`: the id in a `[data-tour="job-<id>"]` target, else null.
  - `rewindAt(p: number): { era: 0 | 1 | 2 | 3; all: boolean }`

- [ ] **Step 1: Update `content/tour.ts`.**
  Eras per step, in order: 0, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3.
  `builds`, in order: `[]`, `["home.offduty"]`, `["career.head","career.edu-psychology"]`, `["career.edu-web"]`,
  `["career.agrocity"]`, `["career.innovational","career.fabelx"]`, `["career.ubisoft"]`, `["career.fork"]`,
  `["career.siterocket"]`, `["career.yomali","career.rest"]`, `["skills.product","skills.rest"]`,
  `["home.room","home.dock"]`, `["work.owned"]`, `["work.built","home.preview"]`, `[]`, `[]`.
  `year`: Start "2003", 2012 "2012", 2019 "2019", 2020 "2020", 2022 "2022", 2024 "2024", the fork step "2025",
  Now "Now".
  `cues`: "My room" gets `[{at:"phone",hot:"phone"},{at:"printer",hot:"printer"},{at:"monitor",hot:"rolodex"}]`.
  "Done" gets `[{at:"top right",hot:"theme"},{at:"Message me",hot:"phone"}]`.
  Delete `STAGE` (Task 3 removes its users).

- [ ] **Step 2: Write the failing tests in `lib/direction.check.ts`** (import from `"./direction.ts"` and `"../content/tour.ts"`):

```ts
test("nothing is built at the start", () => assert.equal(builtAt(0).size, 0));
test("a step builds its own keys and keeps the earlier ones", () => {
  const b = builtAt(5);
  for (const k of ["home.offduty", "career.edu-web", "career.agrocity", "career.innovational", "career.fabelx"]) assert.ok(b.has(k as BuildKey));
  assert.ok(!b.has("career.ubisoft"));
});
test("scrubbing back un-builds", () => assert.ok(!builtAt(3).has("career.agrocity")));
test("the last step has every key", () => assert.deepEqual([...builtAt(steps.length - 1)].sort(), [...ALL_BUILT].sort()));
test("closed guide: everything built", () => assert.equal(resolveBuilt(false, 0), ALL_BUILT));
test("words appear as their last letter is typed", () => {
  assert.equal(wordsShown("ab cd", 0), 0);
  assert.equal(wordsShown("ab cd", 2 / TYPE_CPS), 1);
  assert.equal(wordsShown("ab cd", 99), 2);
});
test("a cue goes live once its first word shows, the latest wins", () => {
  const room = steps.find((s) => s.title === "My room")!;
  assert.equal(cueAt(room, 0), null);
  assert.equal(cueAt(room, 99), "rolodex");
});
test("job ids come from the target", () => {
  assert.equal(jobOf(steps.find((s) => s.title === "2020")!), "agrocity");
  assert.equal(jobOf(steps[0]), null);
});
test("rewind steps the eras back, un-building after the first quarter", () => {
  assert.deepEqual(rewindAt(0), { era: 3, all: true });
  assert.deepEqual(rewindAt(0.3), { era: 2, all: false });
  assert.deepEqual(rewindAt(1), { era: 0, all: false });
});
```

- [ ] **Step 3: Run `npm test`.** Expected: FAIL, `direction.ts` missing.
- [ ] **Step 4: Implement `lib/direction.ts`.**
  `wordsShown` counts words (split on single spaces) whose end index ≤ `floor(local * TYPE_CPS)`.
  `cueAt` finds each cue's word index (the first word of `at` in `say`) and returns the last cue whose index is
  below `wordsShown`.
  `rewindAt(p)`: era = `3 - min(3, floor(p * 4))` with era 0 at p ≥ 1; `all = p < 0.25`.
- [ ] **Step 5: Run `npm test`.** Expected: PASS. Then run `npx tsc --noEmit`. Expected: errors only where
  `STAGE`/`label`/`code` were used (fixed in Task 3). Note them.
- [ ] **Step 6: Commit** `content/tour.ts lib/direction.ts lib/direction.check.ts`: "The guide's director: what each
  step builds, its cues, and the rewind".

### Task 2: Camera math

**Files:**
- Create: `lib/camera.ts`
- Test: `lib/camera.check.ts`

**Interfaces:**
- Produces:
  - `type Rect = { x: number; y: number; w: number; h: number }`
  - `frame(t: Rect, view: { w: number; h: number }, safe: { top: number; bottom: number }, max: number): { dy: number; s: number }`.
    `dy` is the scroll delta that puts the target's centre at the centre of the safe band
    (`top .. view.h - bottom`). `s` is `clamp(1, max, min(0.8 * band / t.h, 0.86 * view.w / t.w))`.
  - `holePath(view: { w: number; h: number }, t: Rect, r: number, pad: number): string`: a CSS `path()` argument with
    the `evenodd` rule. The outer rect is the viewport; the inner rect is `t` grown by `pad`, with corner radius `r`.

- [ ] **Step 1: Write the failing tests:**

```ts
const view = { w: 1440, h: 900 }, safe = { top: 80, bottom: 200 };
test("centres the target in the safe band", () => {
  const { dy } = frame({ x: 100, y: 700, w: 400, h: 100 }, view, safe, 1.25);
  assert.equal(dy, 700 + 50 - (80 + (900 - 80 - 200) / 2));
});
test("small targets zoom to the cap, tall ones not at all", () => {
  assert.equal(frame({ x: 0, y: 0, w: 200, h: 80 }, view, safe, 1.25).s, 1.25);
  assert.equal(frame({ x: 0, y: 0, w: 1200, h: 800 }, view, safe, 1.25).s, 1);
});
test("hole path: evenodd, viewport first", () => assert.match(holePath(view, { x: 10, y: 10, w: 100, h: 50 }, 16, 8), /^evenodd, M0 0H1440V900H0Z M/));
```

- [ ] **Step 2: Run `npm test`.** Expected: FAIL.
- [ ] **Step 3: Implement `lib/camera.ts`.**
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: Commit**: "Camera framing math for the guide".

### Task 3: Shell plumbing, the flash fix, and clean close

**Files:**
- Modify: `components/Shell.tsx`, `components/Shell.module.css`, `components/panes/Home.tsx`, `app/page.tsx`
- Test: `lib/direction.check.ts` (the `resolveBuilt` test from Task 1 covers the closed state)

**Interfaces:**
- Consumes: `resolveBuilt`, `jobOf`, `steps` (Task 1).
- Produces on `UI` (in `Shell.tsx`), replacing `stage`:
  `built: (k: BuildKey) => boolean`, `job: string | null`, `cue: Cue["hot"] | null`, `finale: boolean` (the last step
  is on).
- Produces `Shell` state `cue` set through a new Tour prop `onCue(c: Cue["hot"] | null)`.
- Produces: each pane is wrapped as `<section data-pane …><div data-stage className={s.stage}><Pane/></div></section>`.
  `.stage` has `transform-origin: 50% 0` and `will-change: transform` only while `[data-touring]`.
- Tour props become `{ from: "boot" | "page"; holdMs: number; onStep(i: number): void; onCue(c: Cue["hot"] | null): void; onClose(): void }`.
  `Snippets` and the `code` prop are deleted from `Tour`, `Shell` and `app/page.tsx`. Nothing else uses them; confirm
  with `grep -rn "Snippets\|code=" components app`.

- [ ] **Step 1: Fix the flash at the root.** In `onBuild`, set `touring`, `step = 0` and `holdMs = ms` in the same
  update as `showBuilt()`, before the pull-back starts. Remove `setTimeout(startTour, ms)`. Tour holds its clock at
  t = 0 for `holdMs`, then runs.
- [ ] **Step 2: Replace `stage` with `built`.** `Home.drop(at: number)` becomes `drop(k: BuildKey)`:
  dock → `home.dock`, room cards → `home.room`, Off duty → `home.offduty`, the preview tiles → `home.preview`.
  `data-marks-off` uses `era < 3`. `animate` on the name uses `ui.finale`.
- [ ] **Step 3: Clean close.** `endTour` clears `cue`, sets `touring` false, and lets the panes settle with `slow`
  (they re-render with `ALL_BUILT`, and the stage transform resets in Task 7's cleanup).
- [ ] **Step 4: Run `npx tsc --noEmit` and `npm test`.** Expected: clean.
- [ ] **Step 5: Browser check at 1440×900.** Reload, press "Watch me build it" on the boot screen, and take a
  screenshot every ~0.2s through the pull-back. Expected: no frame shows the room, the display font or the finished
  page. The page under the pull-back is the 2003 Home.
- [ ] **Step 6: Commit**: "The guide starts at 2003 from the first frame; panes read what is built".

### Task 4: Eras on every pane

**Files:**
- Create: `app/eras.css` (imported once in `app/layout.tsx`)
- Modify: `components/Shell.module.css` (move the `data-era` backgrounds into `eras.css`), `components/panes/Career.tsx`,
  `Skills.tsx`, `Work.tsx`, `Home.tsx` (add `data-skin` attributes), `components/panes/Home.module.css` (move its
  `:global([data-era])` rules into `eras.css` where they are shape rules; keep the Home-only ones)

**Interfaces:**
- Produces `data-skin` values: `card` (SpotlightCard / GlareHover panels, tiles, stat boxes), `title` (pane h1/h2),
  `chip`, `button`, `row` (career rows).
- Era looks, applied under `[data-era="N"]` on `.viewport`:
  - Era 0, 2003: `--font-display` and `--font-body` set to `var(--font-2003)`. Cards are a 1px solid `var(--line)`
    box, radius 0, no shadow, white. Titles are Times bold, normal stretch. Chips and buttons are grey outset. Links
    are blue and underlined.
  - Era 1, glossy: Arial/Helvetica. Radius 8–10px. A top-lit gradient (`linear-gradient(var(--surface), var(--surface-2))`)
    with a `var(--glass)` inset top highlight and `var(--shadow)`. Pill buttons with a gloss highlight.
  - Era 2, flat: `--font-body` stays, `--font-display` is set to `var(--font-body)`. Radius 2px, no shadows, flat
    `var(--surface)` with a 1px `var(--line)`.
  - Era 3: no overrides.
- Every `[data-skin]` property that changes between eras transitions over 0.9s with `var(--ease)` (background,
  border-color, border-radius, box-shadow, color). Fonts swap at the midpoint behind a 0.25s opacity dip on
  `[data-pane]` (`[data-era-changing]` set by Shell for 500ms on era change).

- [ ] **Step 1: Write `app/eras.css`** with the three era skins above, scoped to `[data-era] [data-skin=…]`.
- [ ] **Step 2: Tag the elements** with `data-skin` in the four panes. Keep each tag on the element that owns the
  look (for example the `SpotlightCard` `className` element via a wrapper prop, or the `GlareHover` root).
- [ ] **Step 3: Add `data-era-changing`** in `Shell`: set it on era change, clear it after 500ms.
- [ ] **Step 4: Browser check.** Open the console and run
  `document.querySelector('[data-era]').dataset.era = '0'` (then 1, 2) on Career, Skills and Work in light and dark.
  Expected: each era is clearly its own period on every pane, and nothing overflows or reflows sideways. Set it back
  to 3: identical to before (compare against a screenshot taken before this task).
- [ ] **Step 5: Commit**: "Eras restyle every pane, not only Home".

### Task 5: Career builds commit by commit

**Files:**
- Modify: `components/panes/Career.tsx`, `components/panes/Career.module.css`

**Interfaces:**
- Consumes: `ui.built`, `ui.job`, `ui.touring` (Task 3).
- Row key per row: `career.<job.id>` for jobs, `career.fork` for the fork, `career.rest` for the merge.
  "career.head" gates the heading, legend and the empty graph frame. The stats, Also running, Certifications and
  Languages are gated on `career.rest`, and Education's entries on `career.edu-psychology` / `career.edu-web` (the
  Education card itself shows once either is built).

- [ ] **Step 1: Gate the graph on built keys while touring.** The dev line's `pathLength` runs from the oldest row up
  to the highest built dev row (as a fraction of the full line). The product path draws once `career.fork` is built.
  Each dot and row pops with today's `pop` tween when its key is built, with no `at(i)` delay while touring.
  Innovational pops 0.5s before Fabel X. Rows not yet built take their space but are invisible (`opacity 0`), so
  nothing reflows.
- [ ] **Step 2: The detail card follows the guide.** While touring with `ui.job` set, `sel` is that job's row index.
  The card swaps with the existing `AnimatePresence`.
- [ ] **Step 3: `career.rest`** builds 0.8s after Yomali lands: the merge commit pops, `CountUp` gets `startWhen`
  true, and the Also running / Certifications / Languages cards land in a 0.09s stagger.
- [ ] **Step 4: Closed guide.** It behaves exactly as today (in-view draw, `sel = NOW`).
- [ ] **Step 5: Browser check.** Play the guide from "2012" to "Now". Expected: the graph is empty at 2012, then each
  job appears on its own step, the fork draws at "product branches off", the card always names the job being spoken
  about, and the extra cards and stats arrive after Yomali. Press "previous" twice from "Now". Expected: Yomali and
  SiteRocket disappear again.
- [ ] **Step 6: Commit**: "Her career builds as she tells it".

### Task 6: Skills, Work and Home build on their steps

**Files:**
- Modify: `components/panes/Skills.tsx`, `components/panes/Work.tsx`, `components/panes/Home.tsx`

**Interfaces:**
- Consumes: `ui.built`, `ui.touring`.
- Skills: the Product layer is gated on `skills.product`; the other layers on `skills.rest`, landing 0.4s after Product
  in a 0.09s stagger. The picker and nudge appear with `skills.rest`.
- Work: the "owned" section's tiles on `work.owned`, the "built" section's on `work.built`. Section heads show
  with their tiles.

- [ ] **Step 1: Gate the pieces** using the existing `Land`/`motion` patterns. Unbuilt pieces keep their space
  (`opacity 0`, no pointer events).
- [ ] **Step 2: Browser check.** Play from "The stack" to "Off duty". Expected: each section is empty until its
  step, then builds while the camera is on it, and Home's preview tiles are in place by "Off duty".
- [ ] **Step 3: Commit**: "Skills and Work build on their own steps".

### Task 7: The camera, the focus and the captions, replacing the overlay

**Files:**
- Modify: `components/Tour.tsx`, `components/Tour.module.css`
- Create: `components/TourCamera.tsx`, `components/Caption.tsx`

**Interfaces:**
- Consumes: `frame`, `holePath` (Task 2); `wordsShown`, `cueAt`, `TYPE_CPS` (Task 1); Tour props (Task 3).
- `TourCamera({ target: string, pane: number, finale: boolean })`: owns all camera motion. It reads the target with
  the existing `findTarget`, and its pane via `closest("[data-pane]")` and that pane's `[data-stage]`.
  - Same pane: `pane.scrollTo` by `frame().dy` (smooth), then animate the stage's `scale` to `frame().s` around the
    safe-band centre with `glide`.
  - Pane change: animate the current stage's scale to 0.92 (`slow`, 0.5s), the Shell slide runs (`track`), then the new
    stage scrolls and pushes in to `frame()`. Any running camera animation is stopped when a new step arrives.
  - Caps: `max` is 1.25, or 1.1 at ≤ 640px.
  - Safe band: `top` is the player height + 16, `bottom` is the caption height + 24 (measured).
  - Focus overlay: a fixed full-screen div with `clip-path: path(holePath(...))` updated every animation frame from
    the target's live rect (pad 14, radius 18). Desktop: `backdrop-filter: blur(5px)` plus a `rgba(14, 13, 28, 0.32)`
    tint. ≤ 640px: tint only. While paused, the overlay fades out (0.4s); on play it fades back and the camera
    re-frames.
  - Finale: scale the Home stage to fit the whole pane height (`clientHeight / scrollHeight`, origin top centre) with
    `slow`, hold 1.2s, then return to scale 1 at scroll 0 with `land`.
  - Unmount: reset every stage's `transform` and remove the overlay.
- `Caption({ step: Step, local: number, paused: boolean })`: a lower third, bottom-centred above the tab bar
  (`bottom: calc(96px + env(safe-area-inset-bottom))`, max-width 760px). A 28px portrait with "Adelina" in small caps,
  then the line in `var(--font-display)` at `clamp(19px, 2vw, 26px)`. Each word is a span; shown words animate from
  `opacity 0, blur(6px), y 6px` to sharp with `glide`. Words not yet shown are rendered invisible, so the line never
  reflows. The `web` aside fades in below at 0.8 opacity after the last word. `paused` shows "Paused" in the name
  slot. `aria-live="polite"` on the full line text (screen readers get the line once, not per word).
- Delete from Tour: `.frame`, `.outline`, `.cursor`, `.bubble`, `.code`, `labelFor`, `CODE_CPS`, the typing caret, and
  the per-step pane `scrollTo` (the camera owns scrolling). Tour reports `cueAt` to `onCue` whenever it changes.

- [ ] **Step 1: Build `Caption`** and swap it in for the bubble.
- [ ] **Step 2: Build `TourCamera`** and swap it in for the outline, cursor and scroll effect.
- [ ] **Step 3: Run `npx tsc --noEmit` and `npm test`.** Expected: clean.
- [ ] **Step 4: Browser check at 1440×900**, played start to finish with `gif_creator` recording. Expected: no box,
  bubble or cursor; every subject is framed and sharp, with the rest dimmed and blurred; captions never cover the
  subject; pane changes are one pull-out → slide → push-in move.
  Review Focus 3: resize the window to 1100×800 mid-step. Expected: it re-frames within one move.
  Review Focus 4: at 2×, press next 5 times quickly. Expected: one move to the final step, no backlog.
  Review Focus 2: press Esc mid-guide. Expected: the finished page, scale 1, no overlay.
- [ ] **Step 5: Same at 390×844.** Expected: zoom ≤ 1.1, no blur, captions above the tab bar, nothing cut off.
- [ ] **Step 6: Commit**: "A camera and captions replace the tour overlay".

### Task 8: The year scrubber

**Files:**
- Create: `components/TourPlayer.tsx`
- Modify: `components/Tour.tsx`, `components/Tour.module.css`

**Interfaces:**
- `TourPlayer({ t: number; playing: boolean; speed: number; onSeek(t: number): void; onToggle(): void; onPrev(): void; onNext(): void; onSpeed(): void; onClose(): void })`.
  Its progress fill is written straight to the DOM from Tour's clock, as today's bar is.
- Layout: a slim bar at the top centre (max-width 720px, 44px tall) in the caption's type and colours. Ticks at
  `starts[i] / total` for steps with `year`, labelled with the year. The current step's title sits by the playhead.
  Buttons: previous, play/pause, next, speed (`0.5×, 1×, 1.5×, 2×`), close, each with an `aria-label`.
  `role="slider"` on the track with `aria-valuemin 0`, `aria-valuemax total`, `aria-valuenow t` and
  `aria-valuetext` set to the step title.
- Drag: pointer down/move on the track calls `onSeek(clamp(0, total, x / width * total))`, and pauses while dragging.
- Keys (in Tour): Space toggles, ← / → go to the previous / next step (not ±5s), Esc closes.

- [ ] **Step 1: Build `TourPlayer`** and replace the notch.
- [ ] **Step 2: Browser check.** Drag the scrubber from 2003 to Now and back. Expected: builds, eras and camera follow
  the scrub, un-building on the way back (Review Focus 1). Keyboard-only: Tab reaches every control, and ←/→ step.
- [ ] **Step 3: Commit**: "The player is a timeline of her years".

### Task 9: The room cues and the finale

**Files:**
- Modify: `components/panes/Home.tsx`, `components/ThemeToggle.tsx` / `ThemeToggle.module.css`, `components/Tour.tsx`

**Interfaces:**
- Consumes: `ui.cue`, `ui.finale` (Task 3), the TourCamera finale move (Task 7).
- Home: while touring, `hot` (passed to `Finale`) is `ui.cue` when it is `phone | printer | rolodex`. Otherwise it is
  the hover state, as today.
- ThemeToggle: when `ui.cue === "theme"`, it plays two soft pulses (scale 1 → 1.12 → 1 with a `var(--blueprint)` ring,
  `drift`). ThemeToggle has no `ui`, so Shell sets `data-cue="theme"` on `<html>` and the CSS keys the pulse on
  `:global([data-cue="theme"])`.
- Tour end: after the finale move and the last line, the player and caption leave (caption fades, player slides up,
  `ease` 1.4s). Then `onClose` runs at the same 3.2s hold as today.

- [ ] **Step 1: Wire the cues and the theme pulse.**
- [ ] **Step 2: Browser check.** On "My room" the phone, printer and monitor light in time with the words. On "Done"
  the toggle pulses at "top right", the phone lights at "Message me", and the pull-back shows the whole Home, then
  settles on the hero and room. The chrome leaves and the page is fully usable.
- [ ] **Step 3: Commit**: "The room answers the guide; the ending pulls back".

### Task 10: The rewind opening from the Home button

**Files:**
- Modify: `components/Shell.tsx`, `components/Shell.module.css`

**Interfaces:**
- Consumes: `rewindAt` (Task 1).
- `startTour(from: "boot" | "page")`. For `"page"` without reduced motion, `Shell` animates `rewind` from 0 to 1 over
  1.4s (`ease`). While `rewind != null`, `era = rewindAt(p).era`, and `built` is everything when `.all`, otherwise
  nothing. `.viewport[data-rewinding]` shows the lo-fi tape treatment: a 2px scanline overlay at 0.08 opacity, a ±2px
  RGB split on the panes (`filter: drop-shadow(-2px 0 rgba(255,0,70,.35)) drop-shadow(2px 0 rgba(0,190,255,.35))`) and
  a quick vertical jitter of 2px at 12 fps. Then `rewind = null`, and Tour mounts with `from: "page"`,
  `holdMs: 0`.
- The Home "Watch me build it" / "Replay the build" button calls `startTour("page")`. The boot path stays as in
  Task 3.

- [ ] **Step 1: Implement the rewind.**
- [ ] **Step 2: Browser check.** On the finished page, press "Replay the build". Expected: about 1.4s of rewind
  through the eras with the tape treatment, landing on the 2003 page, then step 1 plays. With reduced motion
  (DevTools emulation) the Stepper sheet opens as today.
- [ ] **Step 3: Commit**: "Replaying the build rewinds the page to 2003 first".

### Task 11: Full pass

- [ ] **Step 1:** `npm test`, `npx tsc --noEmit` and `npm run build`. Expected: all clean.
- [ ] **Step 2:** Play the whole guide from the boot screen at 1440×900, light, recording with `gif_creator`
  (`guide_desktop_light.gif`). Then at 390×844 dark (`guide_phone_dark.gif`). Check every row of the spec's sequence
  table against the recording, and the five Review Focus items.
- [ ] **Step 3:** Run the anti-goals as a checklist: no product-tour look, no slideshow, nothing covered, no jank
  (Performance panel at 1440×900: no long frames over 50ms during camera moves), no half-built page after closing.
- [ ] **Step 4:** Fix what the pass finds in the task that owns it, re-run that task's check, and commit.
