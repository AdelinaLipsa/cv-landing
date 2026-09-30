# Design handoff

The `.dc.html` files here are artboards from the design canvas. They are HTML with inline styles, so read them for exact values. They need a canvas runtime to render, so do not try to run them. Screenshots from Adelina, if any, are in `/design/screens`.

## Which artboards to follow

| Artboard | Status | Use it for |
|---|---|---|
| `HomeDesktop.dc.html` | Final quality bar | Desktop layout, backdrop, spec marks, dock, live cards |
| `Home.dc.html` | Final direction | Mobile Home |
| `Wall.dc.html` | Final direction | Masonry, captions under media, one wide tile breaking the grid |
| `Recording.dc.html` | Final mechanics | The whole tour: frame, notch, cursor, bubble, eras, sliding track |
| `Contact.dc.html` | Final | WhatsApp as the one action |
| `Skills.dc.html` | Concept final, styling to lift | The stack layers and pick-a-thing interaction |
| `Career.dc.html` | Concept final, styling to lift | The git graph, two branches |
| `Boot.dc.html` | Final | The 2003 unbuilt page |
| `Main`, `Colour`, `Type`, `Motion` | Tokens and principles | Values below |
| `Tiles.dc.html` | Label system only | Built / Owned / Analysed. Tile styling is older and heavier |

Bring Skills and Career up to the calm style of HomeDesktop: light ground, colour only in content and labels.

## Colour

- **ink** `#17153A` text, primary buttons, dark tiles
- **ink-2** `#2A2760` second dark surface
- **paper** `#F7F6FB` page
- **steam** `#6B6990` secondary text on paper
- **body-2** `#3A385E` long text on paper
- **line** `#E2E0EF` borders and dividers
- **mist** `#E6E4F2` placeholders, soft tiles
- **on-ink** `#D9D8EC` text on ink, `#B8B6D9` muted on ink
- **broth** `#F5B53F` Built label, dev branch, the play dot. Never on chrome
- **naruto** `#EE6E9F` Owned label, product branch
- **blueprint** `#3355FF` Analysed label, spec marks, the tour

Chrome is ink, paper and white only. The accents carry meaning, never decoration.

## Type

- **Anybody 700, width 120 to 125%**, tracking -0.03 to -0.04em. Headlines only. Desktop name 80px, mobile 36 to 38px, section titles 26 to 40px.
- **Figtree** 400 and 600. Everything people read. Body 16 to 18px, line height 1.5 to 1.6.
- **JetBrains Mono** only in the code panel, code cards and the terminal.
- **Tinos** only in the 2003 state.

## Shape and depth

- **Radii:** tiles 18 to 24px, portrait 28px mobile and 36px desktop, buttons fully round.
- **Shadows:** soft and layered, e.g. `0 1px 2px rgba(23,21,58,.06), 0 24px 50px rgba(23,21,58,.14)`. Dark buttons get `0 14px 30px rgba(23,21,58,.22)`.
- **Glass** on the tab bar only: white at 82%, blur, 1px border at 7% ink.

## The signature: spec marks

- **Backdrop:** a 32px grid in `rgba(51,85,255,0.045)`, plus one or two dashed guides in blueprint at 22 to 35% with small labels ("x 120", "baseline").
- **Outline:** 1px dashed blueprint at 55 to 60% opacity, 8 to 10px outside the element, radius matching it plus the offset.
- **Label:** 11 to 12px, weight 600, blueprint, beside the outline ("132 × 132, radius 36", "the one to press", "live, not a screenshot").
- **Rule:** at most two per screen outside the tour. In the tour, one outline glides from target to target.

## Motion

- **Nothing snappy.** Springs: drift 120/26, glide 90/22, slow 50/18, land 70/12 (stiffness/damping).
- **Long eased transitions** for restyles and the track: `cubic-bezier(0.65, 0, 0.35, 1)`, 1.5 to 1.8s.
- **Font changes** between eras crossfade with a short blur.

## The tour, from Recording.dc.html

- **Steps** are data: `{ title, era, pane, box, label, cur, say }`. Duration is 3s plus the line length divided by 20, scaled by speed.
- **Frame** blueprint inset border 5px with a 36px inner glow. **Notch** drops from the top edge: previous, play/pause, next, title, "n of N", speed, close, progress line.
- **Bubble** anchored to the cursor tip: x = cursor x + 6, clamped inside the screen; y = cursor y + 26, or above if it would pass the tab bar. Corner nearest the cursor is sharp (4px). Types 28 characters a second with a blinking caret.
- **Paused** shows "Presentation paused." in the bubble. At the end, play restarts.
- **Track:** Home, Work, Career, Skills side by side; tabs and steps slide it, and the tab pill slides with it.
- **Eras on Home:** 2003, 2010, 2016, 2026 restyle the same elements. Starting the tour un-builds the page back to 2003 first.

## Content

Only what is on the CV, plus what Adelina confirms. Anything marked [TBC] in an artboard is waiting on her.
