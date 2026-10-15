# The room at the end of the page

`public/models/room.glb` is a teenage bedroom at golden-hour sunset, modelled, lit and baked in Blender 5.1
(Cycles). Every surface shows its light baked into one of four 2048² atlases, so the site draws it with
`MeshBasicMaterial` and no lights. `art/room-preview.png` is the Cycles render of the same scene (1500×1200,
transparent) to use as the loading poster.

## Files

- `art/room_source.blend` *(local only, ~45 MB, gitignored)*: the editable scene, before the bake joins things.
- `art/room.blend` *(local only, ~45 MB, gitignored)*: the baked state: joined bake groups with their `Lightmap` UVs.
- `art/scripts/`: everything that built it. `build_*.py`, `lighting.py`, `light_shaft.py` make the scene;
  `make_*.py` (PIL) make the textures in `art/textures/`; the bake and export steps are below.
- `art/textures/`: band posters (our own lettering, no logos), the sunset window view, rug, CD/game covers.

## Re-bake and re-export

1. Open `art/room_source.blend`, change what you need, save.
2. In Blender's Python (or the MCP), run in order, one call each (the bakes take 1–3 min):
   `bake_prep.py` → `bake_cleanup.py` → `bake_uv.py` → `bake.py` (set `BAKE_ONLY = ["Shell"]` etc. and
   `BAKE_SAMPLES = 128` before it to bake one group) → `denoise_save.py` (`denoise_save("Bake_Shell",
   "art/bake/bake_shell.png")` per group: OIDN denoise, saved with the AgX Medium Low Contrast view
   transform so the PNG is the graded colour) → save as `art/room.blend` → `export_glb.py`
   (writes `art/bake/room_raw.glb` and reverts the file).
3. From the repo root:
   ```
   npx @gltf-transform/cli webp art/bake/room_raw.glb /tmp/room_webp.glb --quality 90
   npx @gltf-transform/cli optimize /tmp/room_webp.glb public/models/room.glb --compress meshopt \
     --texture-compress false --flatten false --join false --simplify false --prune false --instance false --palette false
   node art/scripts/name_nodes.mjs public/models/room.glb     # names RolodexRingMesh / TowerMesh
   node art/scripts/list_nodes.mjs public/models/room.glb     # check the node tree
   ```
   The `false` flags matter: the defaults flatten the hierarchy, join the named meshes and prune the empties.
   The two `.mjs` need `@gltf-transform/core`, `@gltf-transform/extensions` and `meshoptimizer` installed.

## Credits (all CC0)

- Poly Haven: `wood_floor` texture (Dimitrios Savva), `desk_lamp_arm_01` (Kuutti Siitonen, Yann Kervran),
  `potted_plant_02` (Rico Cilliers). https://polyhaven.com
- Her figures come from `public/models/` (megaman, kid-goku, pokeball, digivice, straw-hat).
- Everything else is modelled for this room; textures are generated with PIL.
