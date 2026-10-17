#!/bin/sh
# From the repo root, after export.py: compress the view into public/models/window/ and ship the night atlases.
set -e
OUT=public/models/window; mkdir -p $OUT
T=$(mktemp -d)
npx -y @gltf-transform/cli webp art/bake/window_raw.glb $T/webp.glb --quality 88
npx -y @gltf-transform/cli optimize $T/webp.glb $T/opt.glb --compress meshopt --texture-compress false \
  --flatten false --join false --simplify false --prune false --instance false --palette false
node art/scripts/meshopt_v1.mjs $T/opt.glb $OUT/view.glb   # lossless v1 repack (art/README.md)
for g in near street across; do cwebp -quiet -q 88 art/bake/window_${g}_night.png -o $OUT/${g}-night.webp; done
ls -la $OUT
