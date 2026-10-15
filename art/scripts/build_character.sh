#!/bin/sh
# After export_character.py: art/bake/character_raw.glb -> public/models/character.glb (meshopt + WebP).
# GT is a folder with @gltf-transform/core, @gltf-transform/extensions and meshoptimizer installed (not in package.json):
#   mkdir -p /tmp/gt && (cd /tmp/gt && npm i @gltf-transform/core @gltf-transform/extensions meshoptimizer)
#   GT=/tmp/gt sh art/scripts/build_character.sh
set -e
cd "$(dirname "$0")/../.."
cp art/scripts/pivot_nodes.mjs "$GT/" && node "$GT/pivot_nodes.mjs" art/bake/character_raw.glb art/bake/character_pivot.glb
# flatten/join/palette off: keep node names, hierarchy and material names; simplify off: decimation is done in Blender
npx -y @gltf-transform/cli optimize art/bake/character_pivot.glb public/models/character.glb \
  --compress meshopt --texture-compress webp --flatten false --join false --palette false --simplify false
ls -l public/models/character.glb
