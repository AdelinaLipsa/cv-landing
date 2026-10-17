# "Watch me build it", as motion design

## Intent

The guide ("Watch me build it", `components/Tour.tsx`, script in `content/tour.ts`) has a good idea: the CV builds
itself from a 2003 page into the finished site while Adelina tells her story. Today it reads as cheap. Adelina:
"the idea is there, it's cool and pretty, but it can be way better with motion design."

What is wrong today (watched end to end at 1440×900 on 2026-10-17):

1. **The opening spoils itself.** On "Watch me build it" the finished page (room, fonts, styles) flashes for about a
   second, then snaps to the raw 2003 page. Cause: `Shell` calls `showBuilt()` at once but `startTour` only after the
   boot pull-back (`setTimeout(startTour, ms)`), so the page comes up at era 3 and only then drops to era 0.
2. **The build stops at step 2.** Eras only restyle the Home pane, and from "2012" on every step is era 3. From there
   it is a narrated scroll through a finished page.
3. **What's on screen doesn't match the story.** On Career the detail card stays on Yomali while the tour talks about
   Fabel X, Ubisoft and AgroCity. Every job is already on the graph before the story gets to it.
4. **Generic product-tour look.** A blue inset viewport frame, a dashed outline with an 11px label, a blue chat bubble
   with a typewriter and caret, a fake cursor, and a blue notch player. They look the same in every era, so they
   belong to no era, and the bubble covers what it describes (the Education card, the stack).
5. **Jump cuts.** Panes whip Home → Career → Skills → Home → Work → Home, with smooth-scroll jumps in between.
6. **No payoff.** "Now it exists" is the same bubble again, and the overlay just stays on screen.

**The direction (approved by Adelina): the page builds itself along her years, and a camera replaces the tooltip.**

## Goals

- **The build is real all the way through.** Each step builds the thing it talks about, and nothing from later in her
  story is on screen before its moment.
- **The eras follow her timeline** and restyle every pane the guide visits, not only Home.
- **One continuous camera.** A framed move (scale + pan, the rest of the page dimmed and softly blurred) points at
  things. No box, bubble or cursor. No jump cuts: changing panes is one move (pull out, slide, push in).
- **Her words are documentary captions**, a lower third in large readable type, revealed word by word, never covering
  the subject.
- **The player is a timeline of her years** that she or a visitor can scrub.
- **An ending that pays off**: the camera pulls back to the whole finished page coming together and lands on her room.
- Senior motion-design quality, in the lo-fi mood the site already has (see the art direction in `art/README.md`
  and the hero room).

## Non-goals

- Changing the story. The lines in `content/tour.ts` stay as written. If a caption has to be shorter to fit, the
  change goes through the `cv-copywriter` agent (no overclaiming, no new detail about Yomali or any employer).
- Changing the site outside the guide. With the guide closed, every pane looks and behaves exactly as it does now.
- The reduced-motion path. It keeps the "The build, chapter by chapter" sheet (`Stepper`).
- A new 3D scene. three.js is used where it already lives (the boot monitor, the hero room).

## Anti-goals (a failure even if it works)

- Anything that still reads as a product-tour or onboarding overlay.
- A slideshow: headline over a static screenshot, cut, next headline. The page itself has to move and build.
- A caption or control sitting on top of the thing being described.
- Jank: dropped frames on camera moves on a recent laptop, layout jumps, or text reflowing mid-read.
- Leaving the site in a half-built state when the guide is closed mid-way (closing jumps cleanly to the finished page).

## The sequence

Steps and lines stay as they are in `content/tour.ts`. What changes is what each step builds and how the camera
frames it.

| # | Step | Era | What builds | Camera |
|---|------|-----|-------------|--------|
| 1 | Start | 0 (2003) | The boot pull-back lands on the raw 2003 Home: Times, grey outset buttons, "Under construction", visitor counter. No flash of the finished page. | Holds wide, then eases to the name. |
| 2 | High school | 1 (glossy) | Glossy era restyles the page; Off duty drops in. | Pushes down to Off duty's "High school" lines. |
| 3 | 2012 | 1 | Career pane appears empty: the graph has no commits yet. The Education card (psychology) builds. | Pull out, slide to Career, push in on Education. |
| 4 | 2019 | 2 (flat) | The web goes flat (the `web` line says so). The Web Development education entry builds. | Small move within Education. |
| 5–10 | 2020 → Now | 2, then 3 at "Now" | One commit per step: the dev line grows up from AgroCity, each job's dot pops as it is named, the product branch forks at "product branches off", Yomali lands last. The detail card follows the step. The header stats count up when the graph is complete. Era 3 (the site as it is now) arrives with "Now". | Climbs the graph with the line, the newest commit framed each time, the detail card in shot. |
| 11 | The stack | 3 | Skills: Product Management builds first, the other groups after it. | Pull out, slide to Skills, push in on Product. |
| 12 | My room | 3 | The hero room switches on. As the caption names things, they light up in turn: the phone, the printer, the monitor with her LinkedIn (`Finale`'s `hot` already does these three). | Slide home, frame the room. |
| 13 | Products I own | 3 | The product tiles build. | Slide to Work, push in. |
| 14 | Things I built | 3 | The "things that didn't exist" tiles build. | Move within Work. |
| 15 | Off duty | 3 | Off duty in its final style. | Slide home, frame Off duty. |
| 16 | Done | 3 | Pull back over the Home pane, top to bottom (not all four panes side by side). The name lands (the `land` spring). The guide's chrome leaves. "Light or dark, your call, top right" pulses the theme toggle. "Message me, it opens WhatsApp" lights the phone in the room. | Wide, then settles on the hero and room, at rest. The visitor has the site back. |

### Items no step names

- **Innovational** (Dec 2020 to Oct 2021) pops silently as the dev line grows past it between AgroCity and Fabel X.
- **"Still shipping"** (the merge commit above Yomali), **Also running**, **Certifications** and **Languages** build
  together right after Yomali lands at "Now", with the stats counting up.
- **Home's Work preview tiles** stay unbuilt until "Products I own" has played; they are in place when the camera
  comes home for "Off duty".
- No new lines are added for them.

### Starting from the Home button

"Watch me build it" / "Replay the build" on the finished page opens with its own short beat before step 1: the page
rewinds to 2003, like a tape. The panes un-build in reverse, eras step back 3 → 2 → 1 → 0, about 1.2–1.5s, slightly
lo-fi (a brief scanline and chroma wobble during the rewind, nothing heavy). Then step 1 plays as from the boot
screen. Reduced motion skips the rewind as today.

### The boot handoff

The boot screen's monitor is being replaced by a 3D C64 model in parallel (`components/Boot.tsx`,
`Boot.module.css`, `public/models/c64-monitor.glb`). On phones the monitor never stretches. The shot starts pushed in close on the C64 (the glass nearly fills the
phone, the bezel just visible), and a button press pulls back to the whole monitor before the tube switches off.
The guide's first beat starts from wherever that pull-back ends. `Boot`'s `onBuild(pull)` contract (pull-back length
in ms) stays as it is. The guide work starts after the monitor work has landed, so the two don't edit `Shell` at the
same time.
The page that comes up under it must already be era 0 at stage 0. Fix this at the root in `Shell` (tour state set
before or with `showBuilt`), not by hiding the flash.

### Eras across panes

Today eras are per-component CSS in `Home.module.css` (`:global([data-era="N"])`), plus a background in
`Shell.module.css`. Every pane the guide visits (Career, Skills, Work) needs eras 0 to 2, so eras should mostly be
token overrides on `.viewport[data-era]`: font family, radius scale, shadow, surface and border, button style. The
panes then inherit them. Changing era is itself a beat: a visible restyle eased with `slow`, not an instant swap.

### Camera

- One move at a time, eased with the site's tokens (`lib/motion.ts`: `track` for pane changes, `slow` for big
  reveals, `glide` within a pane). Nothing snappy.
- Focus: the subject is framed, and everything else dims and softly blurs (depth of field). The subject is never cut
  off by the caption band or the player.
- Pane changes are one continuous move: pull out a little, the track slides, push in on the new subject.
- During the guide the page is a stage. Drag and swipe are already off while touring. Scrolling or swiping pauses
  the guide (as today): the focus lifts (dim and blur clear) so the visitor can read freely, the build stays where it
  is, and play re-frames the current subject with one camera move. Closing the guide at any point lands on the
  finished page (era 3, `STAGE.all`) with one `slow` settle, not a cut.

### Captions

- A lower third: her small portrait and "Adelina", then the line in large type (around 22–28px desktop), revealed word
  by word in time with the existing clock (the words-per-second pacing replaces the character typewriter). There's a
  React Bits text component in `components/` (`BlurText`, `DecryptedText`, `ShuffleHeading`); use one if it fits.
- The `web` aside ("Meanwhile, the web: …") is a quieter second line, like a footnote, appearing after the main line.
- The captions are the guide's own voice and stay the same across eras. Only the page changes era.

### Player

- A slim timeline scrubber showing her years (2003, 2012, 2019, 2020, 2022, 2024, 2025, Now) with chapter titles.
  The progress runs along her years. Dragging scrubs (calls the existing `seek`).
- Keeps play/pause, previous/next, speed (0.5×–2×) and close, all as real buttons with labels. Keyboard: Space
  play/pause, ←/→ steps, Esc closes.
- Its look belongs to the caption system, not the old blue notch.

### Removed

The inset blue frame, the dashed outline and its label, the fake cursor, the chat bubble and its caret. The code panel
(`Step.code`, `Snippets`) is unused by any step today. Delete it if nothing else needs it.

## Constraints

- Next.js 16 with breaking changes: read the relevant guide in `node_modules/next/dist/docs/` before touching Next APIs
  (AGENTS.md).
- Use what's installed: `motion` (v13, `motion/react`), `gsap`, `three`. No new dependencies unless one clearly earns
  it.
- CSS Modules and the existing tokens in `app/globals.css`. Emphasis through React Bits components, not tinted pills
  or icon chips.
- One clock stays the source of truth (`Tour.tsx`), so speed, scrubbing, captions and camera stay in sync, and it
  still only re-renders when a visible thing changes.
- With the guide closed, nothing changes: era 3, `STAGE.all`, every pane as it is now.
- Light and dark themes both work.
- Phones (390px wide) work: the camera moves without heavy zoom (≤ 1.1×), blur is off, captions sit above the tab bar.
  The same story and builds play.
- Reduced motion keeps the `Stepper` sheet path.
- `npm test` and `npx tsc --noEmit` stay clean.
- Done means checked on localhost in Chrome at 1440×900 and 390×844, light and dark, played start to finish with a
  recording. Adelina judges it on localhost.

## Decided by Adelina

- The direction above: the page builds along her years, a camera instead of the tooltip, documentary captions, a
  timeline player, a pull-back finale landing on the room.
- The guide's on-site credits line was removed in this session. Credits live in `art/README.md` only.

## My calls (Claude), open to her veto

- The era mapping in the table (glossy from High school, flat from 2019, now from "Now").
- The Education card carries 2012 and 2019, before the first commit.
- The room step lights only the three objects `Finale` already wires (phone, printer, monitor). The guitars, gloves,
  skateboard and cats lighting up is a stretch goal if `Finale` can do it cheaply.
- Pacing stays on today's formula (`3s + line length / 20`). The camera moves fit inside it.
- The finale's pull-back covers the Home pane only.
- Scrolling during the guide pauses it and lifts the focus. Play re-frames. Close settles on the finished page.
- When the unnamed items build (see "Items no step names"), with no copy added for them.
- The tape-rewind opening when the guide starts from the Home button.
- No sound design in this pass. If sound is on, existing `sfx` may mark a pane move or a commit, quietly.

## Left to the builder

How the camera is built (transform on the pane, a focus mask, or both), the exact easing per move, how the eras'
token sets look in detail within each era's character, caption typography within the site's fonts, and the
scrubber's visual design.
