# Out the window: the end of the page

**Goal:** the page opens inside her room (the hero) and ends looking out of that room's window at Bucharest, live:
her real time of day, her real weather, a street that's alive, and a pigeon on the windowsill. It replaces the
outro's flat heading + buttons + sky card, which she called "too simple and basic", "out of place", "no animation".

**Approved in chat 2026-10-16:** "i like the out the window idea"; "you can build it in blender… to make it also
interactive? like seeing people bike on the street"; "i would love to have a pidgeon pe pervazul geamului!!!"
(a pigeon on the windowsill). She left the view itself to me.

**Stack:** Blender 5.1 (Cycles bake, same pipeline as `art/README.md`), three 0.186, motion 13. No new npm deps.

---

## The scene

**Her POV** (2026-10-16: "i want my POV to be a pidgeon covering my view… as I drink hot chocolate looking out the
window, but from my POV"). The camera is her eyes: sitting at the window, her hands (her character's, black jumper)
round the room's navy mug of hot chocolate at the bottom of the frame, steam rising; right behind it, outside the glass,
the pigeon sits big on the tin sill, in the way. The street and the blocs are beyond it. Click the mug: she takes a sip.
Her flat is on the 3rd floor of a bloc (street at z = −9); a wide boulevard with a tram reserve; blocs across.

| Layer | What | How |
|---|---|---|
| Glass | The window pane: rain/snow droplets when it's really raining there; the sticky note with her email | live shader + HTML |
| Foreground | White PVC double casement (the bloc kind), interior sill with her plant and a mug (steam), sheer curtain hems at the edges; outer tin sill (*pervaz*) | baked |
| **The pigeon** | Grey Bucharest rock pigeon on the outer sill, iridescent green-purple neck, orange eye, pink feet | rigged, live |
| Street | Sidewalks, curb, asphalt with tram tracks and overhead wires, plane trees, street lamps, a parked Dacia 1300, a corner shop with a NON STOP neon, a pharmacy green cross | baked; neon/lamps glow live |
| Across | Two blocs (P+4, P+10): balconies, half of them closed in with mismatched frames, AC units, satellite dishes, a clothesline | baked; lit windows live |
| Back | Skyline cards: the Intercontinental tower and the Palace of Parliament's mass, softened by distance | baked, fog-tinted live |
| Sky | Her sky right now: the existing `SKY` table, sun/moon on its arc, stars, drifting clouds by real cloud cover | live shader |

**Day and night:** the scene is baked twice (DAY: soft sun + sky; NIGHT: moonlit blue + street lamps + neon + some
windows). The site blends the two by Bucharest's clock and tints with the sky's horizon colour, so sunset and dusk are
in between. Lit windows across the street are separate quads switched on/off over the evening.

**Weather:** Open-Meteo (free, no key) `current=weather_code,cloud_cover,is_day,wind_speed_10m` for 44.43 N 26.10 E,
once per page load. Rain codes → rain streaks + drops on the glass; snow codes → flakes; fog → thicker distance fog;
cloud cover → cloud density; wind → tree sway and rain slant. Fetch fails → clear sky. Credit: "Weather: Open-Meteo".

## Life on the street (code-driven loops on paths)

- **The pigeon** (hero): idle head bob, look toward the cursor, peck at crumbs, puff up and coo, preen. At night it
  sleeps, head tucked. Tap/click: coos, flaps off into the street, lands back a few seconds later.
- Two cyclists (different bikes and colours), one with a bell when tapped.
- A walker with a small dog.
- A tram every ~30 s (two-tone, pantograph on the wire, a spark at night); tap: *ding ding*.
- A Dacia driving past now and then.
- Pigeons on the overhead wire; a cat on a balcony across the street that stretches when tapped.
- Tap a lit window across the street: it switches off (and someone else's comes on).
- The whole view leans a little toward the cursor (parallax), like leaning to the glass.
- Night: fewer people, the shop neon flickers, the tram pantograph sparks.

## The section (HTML over the canvas)

- Full-bleed band, desktop ~min(780px, 90vh), phones 640px portrait crop (the pigeon and sill always in frame).
- **Entrance, scroll-linked:** it starts as the sky card she liked (a rounded window into the sky) and opens out to
  full width while the camera eases back from the glass, revealing the frame, the sill and the pigeon.
- **In the sky, top left:** "You made it to the end of the log." (ShuffleHeading) and the line under it, the three
  water-fill buttons (Message me / PDF / LinkedIn), unchanged in behaviour.
- **Clock:** the rolling Counter, "Evening in Bucharest · 1h ahead of you · light rain", the "Open to product roles"
  pill.
- **Sticky note on the glass** (handwritten, taped, slightly rotated): her email (tap to copy) and "30 min on
  Calendly ↗". Plain text, readable at a glance.
- **Sign-off:** "– Adelina" writes itself in; "↑ Back to the top" stays.
- Calm mode: one still render (day or night by her clock) with the live clock; no loops. Canvas is `aria-hidden`; all
  contact stays in real HTML.

## Budgets

- `window.glb` ≤ 2.5 MB (atlases WebP, day+night), `window-actors.glb` ≤ 700 KB. Loads only within 300px of view,
  renders only while visible; pixel ratio ≤ 1.5. The hero room already pauses off-screen.

## Build order

1. Blender: blockout + camera (`art/window_source.blend`, scripts in `art/scripts/window/`). Look, adjust.
2. Foreground window, sills, plant, mug, curtains.
3. Street, blocs, shop, trees, lamps, wires, skyline cards.
4. Pigeon: model, rig, actions (idle, peck, coo, look, sleep, fly).
5. Actors: cyclists, walker + dog, tram, car, wire pigeons, balcony cat.
6. Lighting DAY + NIGHT, bake, denoise, export → `public/models/window.glb`, `window-actors.glb`; preview stills.
7. Site: `components/Window.tsx` (three: baked blend, sky shader, weather, actors, interactions).
8. Outro layout: scroll entrance, overlays, sticky note, sign-off. Copy through cv-copywriter.
9. Verify in the browser (day/night/rain forced via `?sky=` param in dev), phone width, calm mode, perf. Commit.
