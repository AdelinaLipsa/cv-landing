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

CC BY 4.0 needs visible credit on the site (e.g. a credits line), not only here.

CC0:

- Poly Haven: `wood_floor` texture (Dimitrios Savva), `desk_lamp_arm_01` (Kuutti Siitonen, Yann Kervran),
  `potted_plant_02` (Rico Cilliers). https://polyhaven.com
- Her figures come from `public/models/` (megaman, kid-goku, pokeball, digivice, straw-hat).
- Everything else is modelled for this room; textures are generated with PIL.
