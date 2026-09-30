# Adelina Lipșa, CV site brief

Read this whole file before writing any code. Work in the phases in section 11 and stop after each one for review.

## 1. The idea

**"It didn't exist, so I built it."** Adelina's edge is making things from nothing. The site proves it instead of claiming it.

- The site opens on a CV that does not exist yet: an empty, unstyled, slightly broken page.
- The main button is **Watch me build it**. The visitor watches the page get built live: a cursor, code typing, components easing into place, the page moving through four eras of the web. It ends on "Now it exists."
- Everything else (the wall, career, skills) supports that one moment.

**Reference:** Bogdan Dobritoiu's CV site (cv-alpha-six-36.vercel.app). App-like chrome, swipeable panes, a video wall of his work, a guided tour, Apple-grade motion. Match its motion quality. Do not copy its code, layout, fonts or copy.

## 2. Audience and job

- **Who:** hiring managers and founders hiring a Technical Product Owner or PM (payments, ops, internal tooling).
- **What they leave with, in under 90 seconds:** she ships, she is both product-minded and technical, she is funny.

## 3. Content rules

- **Source of truth:** `/content/Adelina_Lipsa_CV.pdf`. Transcribe it into typed files in `/content`. Never invent metrics, clients, testimonials or dates.
- **Confidentiality:** no account IDs, offer names, merchant names, internal numbers or real screenshots from her current employer. Internal tools appear only with demo data. The only figures allowed are the ones already on the CV.
- **Not public:** `noindex, nofollow, noarchive` meta and a disallow-all `robots.txt`. Shared by link only.
- **[TBC]** items need Adelina's confirmation before launch.

**About copy** (default; Adelina may swap back to her original):

> I build the thing that's missing. Tools, flows, dashboards, and sometimes the clothes I'm wearing. Allergic to letting my tech knowledge expire like milk. Quietly confident, naturally curious, and perpetually improving my chops one shipped thing at a time.
>
> When I'm not shipping, you'll find me playing video games and eating ramen in the dark like a raccoon with WiFi.
>
> I believe a few lines of code can save the day, that putting milk in before cereal is a federal offense, and that the Oxford comma is non-negotiable.

## 4. Structure

An app shell. On mobile it feels like a phone OS. On desktop it is a centred column with the same chrome, not a phone mockup frame.

Screens are horizontal, swipeable panes with a tab bar:

1. **Boot.** "This CV doesn't exist yet." Unstyled, system font, grey boxes. One button: Watch me build it. A small link: Skip, show me the finished one.
2. **Home.** Name, role, about, actions (Watch me build it, Download PDF, LinkedIn). The role line says both halves, e.g. "Technical Product Owner. Full-stack developer before that, and still ships code." The dev background is part of the identity, not a footnote.
3. **The wall, "Things that didn't exist".** The hero of the site after the build. Spec in section 5.
4. **Career as a git graph.** Two branches. `dev` runs 2020 to 2024 (AgroCity, Innovational, Fabel X with the Tech Lead stretch, Ubisoft), each job a commit with its stack. `product` branches off in 2025 (SiteRocket Labs, Yomali). The merge is the point: the `dev` branch never gets deleted, and the internal tools she still builds show up as commits on both. Tap a commit to open a sheet with role, three lines and stack chips.
5. **Skills as the whole stack.** Five stacked layers, top to bottom: Product, Frontend, Backend, Data, Infra. The product layer sits on top, dark, because that is the job now. Pick something she made (Ubisoft QA platform, eligibility pipeline, Param Decoder, payment analysis) and the layers it touched light up, each skill marked Built it or Specced it. Untouched layers dim. Layers slide and chips re-colour on springs. No grid of cards, no bars, no percentages.
6. **Off duty.** Ruined Saints, sewing [TBC photos], games. Real things she does, shown plainly.
7. **Contact.** One primary action: Message me on WhatsApp, a wa.me link to her CV number with a first line pre-filled ("Hi Adelina, I watched you build your CV. Let’s talk."). Below it, quiet rows for Book a call [TBC], Email (opens the mail app with a subject) and LinkedIn. The spec-mark outline labels the WhatsApp button "the one to press".

## 5. The wall

**Layout**
- Masonry, 3 columns on desktop and 2 on mobile, mixed aspect ratios (phone-tall, landscape, square, pill).
- Each column moves at a slightly different parallax rate, roughly 0.015 to 0.035 of scroll delta. This is what makes the reference feel alive.

**Tile types**
- **video:** muted, loop, playsInline, `preload="none"`, poster frame. Plays only while at least 50% in view.
- **live:** a React/SVG animation rendered in code (charts, flows, diagrams). No recording needed.
- **image.**

**Every tile carries**
- A label: **Built** (she made it), **Owned** (she product-owned it, a team built it) or **Analysed**. The label must be honest.
- A caption in one format: "Didn't exist: problem. Now: thing." One line each.
- Tap opens a shared-element zoom into a sheet with two or three lines and a link where one exists.

**Starting list**

| Tile | Type | Label | Status |
|---|---|---|---|
| Param Decoder (link and postback decoder) | video of the public site | Built | public |
| Hookwarden (webhook security scanner) | video or live terminal | Built | open source [TBC] |
| CS reporting dashboard (replaced a 1.5 to 2 hour daily manual report) | video, demo data | Built | [TBC recording] |
| Checkout change log in ClickUp | video, demo data | Built | [TBC recording] |
| BITE Chrome extension | video, demo data | Built | [TBC] |
| Payment success held at 43–45% Jun to Aug | live chart, no account data | Analysed | CV figure only |
| What actually moved conversion, 25 accounts | live small multiples, fully anonymised | Analysed | CV figure only |
| Refund and return journey | live flow diagram | Owned | |
| AI voice agent to human escalation | live flow diagram | Owned | |
| Self-service refund flow | live flow diagram | Owned | |
| Ubisoft micro-frontends (three Vue apps and an orchestrator) | live architecture diagram | Built | generic, no Ubisoft UI |
| Wallet membership cards | live mock of a pass, generic branding | Owned | |
| Ruined Saints | images | Built | [TBC renders] |
| Her own sites | video | Built | [TBC which are live] |
| Sewing projects | images | Built | [TBC photos] |

## 6. Build mode (Play)

The one orchestrated moment. It plays like a video, about 90 to 120 seconds. Prototype: the "Build mode, recording" artboard in the design canvas.

- **Blueprint frame.** Pressing play draws a blueprint-blue border around the whole viewport with a soft inner glow, fading in over about 1.5s. Blue, not red: during the tour the site shows its own spec layer.
- **Control notch.** A blueprint-blue tab drops from the top edge, attached to the frame: previous step, play/pause, next step, the step title with "3 of 9", speed (0.5× to 2×), close, and a thin progress line across the bottom.
- **Cursor and spec marks.** A cursor glides to each target. A dashed blueprint outline with a size or name label ("96 × 96, radius 28", "the job now") glides from target to target with it.
- **Typewriter narration, always at the cursor.** The blue bubble is anchored just below and right of the cursor tip and travels with it, flipping above when there is no room below. It types the line with a blinking caret. Her voice, one short line per step.
- **The page is one wide surface.** Home, Work, Career and Skills sit side by side on one track. Tabs, buttons and tour steps slide the whole track, and the tab pill slides with it. Every button moves the whole page, never a hard cut.
- **"Watch me build it" becomes "Stop the build"** while the tour runs.
- **Chapters are eras of the web.** 2003 (tables, under construction, visitor counter, Times, outset grey buttons), 2010 (glossy blue buttons, soft gradients, drop shadows), 2016 (flat, material cards), 2026 (the real site). The same content re-styles through each era, then the 2026 build finishes the page section by section.
- **Narration.** Adelina's avatar and one line per beat in a card at the bottom, her voice, dry. No mascot.
- **Everything interpolates.** Colours, radii, shadows, spacing and positions move between eras, never jump. Font changes crossfade with a short blur so they don't pop. Auto-scroll is eased, never a jump.
- **Speed is real.** The whole timeline runs off one clock; speed scales the clock, so animations stay in sync at 0.5× and 2×.
- **Script:** an array of steps `{ at, target, action, say }` on that clock. Actions: `restyle` (era change), `typeCode` (code panel types real source from this repo), `dropIn`, `scrollTo`, `cursor`.
- **Paused state.** While paused, the bubble at the cursor reads "Presentation paused." Play resumes the line where it stopped. At the end, play restarts from step one.
- **Controls:** space toggles pause, arrow keys seek 5s, Esc closes. Any manual scroll pauses.
- **End:** "Now it exists." One soft overshoot, the frame fades, the page stays built. Remember that in localStorage so a return visit opens built, with Replay.
- **Reduced motion:** no build. The page renders finished and the chapters become a static stepper.

## 7. Motion system, the Apple feel

This is the quality bar. Use Motion (framer-motion).

- **Nothing snappy.** Soft springs with long settles, and long eased transitions (cubic-bezier(0.22, 1, 0.36, 1), 1.2 to 2s) for anything the build restyles. Tokens:
  - `drift` stiffness 120, damping 26 (buttons, toggles, tab pill)
  - `glide` stiffness 90, damping 22 (sheets, pane swipes, tile zoom)
  - `slow` stiffness 50, damping 18 (era changes, big reveals)
  - `land` stiffness 70, damping 12 (once, the soft overshoot when the build ends)
- **Interruptible.** Every animation can reverse mid-flight from its current velocity.
- **Gestures with velocity.** Swipe between panes. Drag sheets with velocity-based snap points and rubber-banding past the edges.
- **Shared elements.** `layoutId` for tile to sheet, and a pill that slides between tabs.
- **Glass on chrome only.** Top bar, tab bar, sheets: `backdrop-filter: blur(20px) saturate(180%)`, a 1px inner highlight, a faint specular gradient. Never on content.
- **Restraint.** Scroll reveals fire once, staggered 40 to 60ms within a group. No fade-up on every section. The build is the showpiece.
- **Performance.** Animate only transform and opacity. 60fps on a mid-range Android. Lighthouse mobile performance at least 90, LCP under 2.5s, CLS under 0.05.
- **Reduced motion:** crossfades only.

## 8. Look

The design plan is done. Follow `/design/DESIGN.md` for tokens, components and which artboards are final. The `.dc.html` files in `/design` are the visual source: read their inline styles for exact values. Where DESIGN.md and an artboard disagree, DESIGN.md wins.

- **Not his:** no Bricolage Grotesque with Inter, no copy of his chrome.
- **Avoid the AI tells:** cream with terracotta, black with acid green, all-caps eyebrow labels, middle-dot meta strings, arrows appended to buttons, one identical card style everywhere.
- **One bold element:** the build. Everything around it stays calm.
- **Colour-blind safe:** no red/green pair carrying meaning.
- **Humour is tone, not illustration.** The about lines stay as copy. Do not turn them into characters, mini-games or props. Funny lives in microcopy, errors, empty states and the build narration.

## 9. Easter eggs

- **Devtools.** A short message from Adelina in the console.
- **Terminal mode.** Pressing the backtick key opens a terminal over the page. Commands: `whoami`, `ls projects`, `cat about.txt`, `git log`, `sudo hire adelina`. Mobile gets a small terminal button in Off duty.
- **The CV as an API.** `/api/cv` returns the whole CV as JSON, so `curl` works. Mention it once, in the terminal and in the console message.

## 10. Stack

- Next.js App Router, TypeScript, CSS Modules, Motion. Deployed on Vercel.
- Videos in `/public/wall`: H.264 mp4 plus webm, 5 to 8 second loops, 2 MB max each, with posters.
- No CMS. The CV PDF is downloadable from Home.

## 11. Phases

Stop after each phase and show screenshots at mobile and desktop widths.

1. Read `/design`. Summarise the tokens and the tour mechanics back in a few lines before writing code.
2. Shell: panes, tab bar, sheets, motion tokens.
3. Content transcribed from the CV.
4. The wall, with placeholders for video tiles and the live tiles built.
5. Build mode.
6. Easter eggs and microcopy pass.
7. Polish: performance, accessibility, reduced motion, Open Graph image.

## 12. Done means

- Build mode runs end to end on iPhone Safari and Android Chrome without jank.
- Every number on the site traces back to the CV.
- No [TBC] left.
- noindex is on.

## Open items for Adelina

- **PSPO II:** confirm it is earned before it is listed.
- **Wall tiles:** which exist and can be shown, and who records the demo-data videos.
- **Photos:** Ruined Saints, sewing projects.
- **Sites:** which of her own sites are still live.
- **Contact:** email, booking link, or both.
- **Contract:** check the confidentiality clause before anything from the current role goes on the wall.
