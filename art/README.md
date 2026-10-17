# The room at the end of the page

`public/models/room.glb` is a teenage bedroom at golden-hour sunset, modelled, lit and baked in Blender 5.1
(Cycles). Every surface shows its light baked into one of four 2048² atlases, so the site draws it with
`MeshBasicMaterial` and no lights. `art/room-preview.png` is the Cycles render of the same scene (1500×1200,
transparent) to use as the loading poster.

## Files

- `art/room_source.blend` *(local only, ~45 MB, gitignored)*: the editable scene, before the bake joins things.
- `art/room.blend` *(local only, gitignored)*: the baked room (joined bake groups with their `Lightmap` UVs) plus her
  rigged, animated character (`Her` collection). After a re-bake, bring the room in without touching `Her`: delete
  the objects of the Shell/Furniture/Props/Interactive/Nodes/Lights collections and append those collections from
  the freshly baked file.
- `art/scripts/`: everything that built it. `build_*.py`, `lighting.py`, `light_shaft.py` make the scene;
  `make_*.py` (PIL) make the textures in `art/textures/`; the bake and export steps are below.
- `art/textures/`: band posters (our own lettering, no logos), the sunset window view, rug, CD/game covers.

## Re-bake and re-export

1. Open `art/room_source.blend`, change what you need, save.
2. In Blender's Python (or the MCP), run in order, one call each (the bakes take 1–3 min):
   (after any `build_*` change: `cables.py` re-routes the leads and seats the plugs, `extras.py` re-makes the shadow
   catchers and path empties, `lighting.py` + `light_shaft.py` + `dust.py` re-make the dusk light, the cone and the
   preview-only dust; then `check_contacts.py` must print 0 offenders — nothing may sink > 1 mm into the floor,
   rug or bed, except the backpack's straps, which tuck into the bed on purpose. `check_intersections.py` lists
   every interpenetrating pair for a wider audit.)
   `bake_prep.py` → `bake_cleanup.py` → `bake_uv.py` → `bake.py` (set `BAKE_ONLY = ["Shell"]` etc. and
   `BAKE_SAMPLES = 128` before it to bake one group) → `denoise_save.py` (`denoise_save("Bake_Shell",
   "art/bake/bake_shell.png")` per group: OIDN denoise, saved with the AgX Medium Low Contrast view
   transform so the PNG is the graded colour) → save as `art/room.blend` → `export_glb.py`
   (writes `art/bake/room_raw.glb` and reverts the file).
3. From the repo root:
   ```
   node art/scripts/pivot_nodes.mjs art/bake/room_raw.glb /tmp/room_pivot.glb   # meshes onto <name>Mesh children
   npx @gltf-transform/cli webp /tmp/room_pivot.glb /tmp/room_webp.glb --quality 90
   npx @gltf-transform/cli optimize /tmp/room_webp.glb public/models/room.glb --compress meshopt \
     --texture-compress false --flatten false --join false --simplify false --prune false --instance false --palette false
   node art/scripts/list_nodes.mjs public/models/room.glb     # check the node tree
   ```
   The `false` flags matter: the defaults flatten the hierarchy, join the named meshes and prune the empties.
   `pivot_nodes.mjs` matters too: meshopt quantization folds an offset/scale into any node that carries a mesh,
   so every named node keeps its Blender pivot and its mesh sits on a `<name>Mesh` child (e.g. `ChairSeat` →
   `ChairSeatMesh`; rotate `ChairSeat` to swivel, `Plant` to sway).
   The two `.mjs` need `@gltf-transform/core`, `@gltf-transform/extensions` and `meshoptimizer` installed.

## Mood and preview-only parts

Late sunset, almost dark: dusky blue ambient (world #2A3478, a #5A66C8 fill), AgX Medium Low Contrast at exposure −0.55,
the warm sun spot through the window as the hero, plus fairy lights, lamp and monitor glow. `LightShaft` (the cone,
in `Nodes`) and `Dust` are hidden during the bake: the site draws them live. `room-preview.png` is rendered from
`room_source.blend` with the `PreviewBloom` compositor; `room-preview-her.png` from `room.blend` with the `Her`
collection lit by `HerLights` (key from the cone direction, lavender fill, warm rim; light-linked to `Her` only).

## Credits

Downloaded by Adelina from Sketchfab (licence and author read from each GLB's `asset.extras`), in `art/downloads/props/`:

- Red Stratocaster-style electric: "Electric Guitar Stratocaster Red" by YieldingMist206,
  https://sketchfab.com/3d-models/electric-guitar-stratocaster-red-df357b3a2bf54798b288c90387cb6eb5, CC BY 4.0.
- Office chair: "Office Chair" by Red Fox / nokillnando,
  https://sketchfab.com/3d-models/office-chair-b228a29fa84544c2be501c295653ffe7, CC BY 4.0.
- Keyboard: "keyboard" by 45P3R4, https://sketchfab.com/3d-models/keyboard-ba869e8681974cf088736173b8b86fef, CC BY 4.0.
- Skateboard: "skateboard" by Chaitanya Krishnan, https://sketchfab.com/3d-models/skateboard-xcix0fdyVU8S45VrCpqVzkZJ4Ne,
  CC BY 4.0 (deck tinted green).
- Boxing gloves: "boxing gloves" by ayumi ikeda, https://sketchfab.com/3d-models/boxing-gloves-9d244a5bfaf84ea398cff99154e99eab,
  CC BY 4.0 (cuff labels painted out; hung on a hook above the skateboard).
- Backpack: "[Tomodachi Life: Living The Dream] City Backpack" by StarlightLambda64,
  https://sketchfab.com/3d-models/tomodachi-life-living-the-dream-city-backpack-c0764343c68d43f09af238c3345713ad,
  Sketchfab Standard licence (not CC; check it covers this use; it is a fan model of a Nintendo game asset).

Loaded live in the room, not baked (`public/models/`, optimized with gltf-transform: meshopt, WebP 512 px):

- Camera (`camera.glb`): "Camera" by White_sniper, https://sketchfab.com/3d-models/camera-8e561c5fc7b6489dadae9c02de30f2db,
  CC BY 4.0.
- MP3 player with earbuds (`mp3.glb`): "Cowon iAudio U3" by vodiva83,
  https://sketchfab.com/3d-models/cowon-iaudio-u3-33bcd92cc90d4690af8e96dd3092fb24, CC BY 4.0 (its floor plane is
  dropped at load).
- Record player on the floor (`turntable.glb`): "Vinyl Recorder with "Until i Found You" disc" by ImSiyue,
  https://sketchfab.com/3d-models/vinyl-recorder-with-until-i-found-you-disc-2c6d0ebeea5c4aeaa0353e23d53f3869,
  CC BY 4.0 (normal/AO/roughness maps and the screws dropped, textures 256 px: 12 MB → 216 KB; the record spins).

The boot screen's monitor (`c64-monitor.glb`, `components/Boot.tsx`): "C64 Monitor" by hoschu,
https://sketchfab.com/3d-models/c64-monitor-b005d2125a1545ad9e0994e0deb5e82e, CC BY 4.0 (the download, unmodified;
the 2003 page is real DOM laid over its glass).

In `character.glb`:

- Both cats: "Munchkin Cat" by Nyilonelycompany, https://sketchfab.com/3d-models/munchkin-cat-58873374a64d482ca1ad7130c2f7e586,
  CC BY-NC-SA 4.0 (non-commercial; the adapted cats stay under the same licence). Rigged, posed, given fresh UVs and
  recoloured as a Birman and a European brown tabby by `scripts/build_munchkins.py` + `munchkin_coats.py`; the
  coats are in `textures/munchkin/`, the download in `downloads/munchkin_cat.glb`.

CC0:

- Poly Haven: `wood_floor` texture (Dimitrios Savva), `desk_lamp_arm_01` (Kuutti Siitonen, Yann Kervran),
  `potted_plant_02` (Rico Cilliers). https://polyhaven.com
- Her figures come from `public/models/` (megaman, kid-goku, pokeball, digivice, straw-hat).
- Everything else is modelled for this room; textures are generated with PIL.

# The boot screen's room

`public/media/boot/room-on.webp` and `room-off.webp` are the room behind the boot screen's C64 (`components/Boot.tsx`):
her desk corner at night, rendered in Cycles from `room_source.blend` by `art/scripts/boot_plate.py` from exactly
where the boot screen's three.js camera stands (160 cm straight in front of the glass, level). The C64 glb stands in
the corner unseen by the camera, so only its shadow and the tube's light on the desk are in the render; the live
model is drawn over it. The script only changes its copy of the scene for the shot: the LCD, chair and preview dust
go, the corner posters hang lower, a second fairy-light string droops just above the monitor, the sun is down.
`off` is the same frame with the tube dark (the site crossfades to it at switch-off).

```
cp art/room_source.blend /tmp/boot.blend          # never render from (or save over) the source
B=/Applications/Blender.app/Contents/MacOS/Blender
$B -b /tmp/boot.blend --python art/scripts/boot_plate.py -- on  /tmp/boot-on.png  2400 128
$B -b /tmp/boot.blend --python art/scripts/boot_plate.py -- off /tmp/boot-off.png 2400 128
cwebp -q 80 -sharp_yuv /tmp/boot-on.png  -o public/media/boot/room-on.webp
cwebp -q 75 -sharp_yuv /tmp/boot-off.png -o public/media/boot/room-off.webp
magick /tmp/boot-on.png -resize 24x -strip -quality 60 webp:- | base64   # the instant placeholder in Boot.module.css (.plate)
```
The plate spans `PLATE` frame widths round the glass (same numbers in the script and in Boot.tsx); change one, change both.

# The window at the end of the page

`public/models/window/` is her POV from her parter window in Bucharest, holding a mug of hot chocolate, a pigeon on
the tin sill. Built and baked in Blender from `art/window_source.blend` (local only) by `art/scripts/window/`:

1. `build_view.py` (her window, sills, the street, lampposts, cables) → `build_city.py` (houses across, the bloc up
   the street, trees) → `dacia.py`, `lamppost.py`, `kit_props.py` (downloaded assets placed) → `pov.py` (camera = her
   eyes, the mug, her arms) → `hands.py` (the rigged hands round the mug) → `grip.py` (posed by hand: explicit joint angles about the
   download fist's axes, the right hand mirrors the left, Preserve Volume; the mug's handle points away from her,
   `COCOA_TURN` 90 in `cocoa.py`) → `pigeon_rig.py` (bones for the site).
2. `lighting.py` (DAY / NIGHT) → `bake.py` with `STEP="prep"` (saves `art/window.blend`) then `STEP="bake"` →
   `export.py` → `art/scripts/window/ship.sh` (view.glb + night atlases) and `export_actors.py` (pigeon, Dacia,
   hands) then `gltf-transform` resize/webp/optimize as in ship.sh.

The site (`components/Window.tsx`) blends the DAY and NIGHT bakes by Bucharest's clock and draws the sky, weather,
lamp cones, steam, the pigeon's routine, the sip and the passing Dacia live.

Credits:

- Pigeon: "Gascogne Pigeon Bird (Lowpoly) Free" by Nyilonelycompany,
  https://sketchfab.com/3d-models/gascogne-pigeon-bird-lowpoly-free-10d7975688f740fa9ba34c874da2b9d2, Sketchfab Standard.
- Hands: "hands animation" by hugo colauto, https://sketchfab.com/3d-models/hands-animation-9f63e924253b4179adb79b117a26d385,
  Sketchfab Standard.
- Hot chocolate: "Hot chocolate" by OlegPopka, https://sketchfab.com/3d-models/hot-chocolate-69554e0812484989baef1494a2e18191, CC BY 4.0.
- Dacia 1300: "Dacia 1300 / Renault 12 LowPoly" by solid3DDD,
  https://sketchfab.com/3d-models/dacia-1300-renault-12-lowpoly-11ca7a926045419b93af0f87da295c84, CC BY 4.0.
- Lamppost: "Lamppost" by Liquell, https://sketchfab.com/3d-models/lamppost-cfaae6a74f8a4483bdb0646961967579, CC BY 4.0.
- Bench, bin, postbox: "Sidewalk" by Kadre, https://sketchfab.com/3d-models/sidewalk-086cb3041cfa4e21a80a93dcfdfe8a9f, CC BY 4.0.
- (Not used in the end: "Pigeon" by Fadly.W, CC BY 4.0, in `downloads/pigeon/`.)
- Weather: Open-Meteo (CC BY 4.0), https://open-meteo.com.
