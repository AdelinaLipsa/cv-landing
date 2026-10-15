// Run on the raw export BEFORE optimising. Meshopt's quantization folds a dequantization offset/scale into the
// transform of every node that carries a mesh, which would move pivots (the chair's swivel, the plant's sway).
// So every mesh moves onto a child node "<name>Mesh" with an identity transform; the named node keeps its
// Blender pivot and transform, and only the child gets the quantization transform.
//   node pivot_nodes.mjs in.glb out.glb
import { NodeIO } from '@gltf-transform/core';
const [inp, out] = process.argv.slice(2);
const io = new NodeIO();
const doc = await io.read(inp);
for (const n of doc.getRoot().listNodes()) {
  const mesh = n.getMesh();
  if (!mesh || n.getName().endsWith('Mesh')) continue;
  const child = doc.createNode(n.getName() + 'Mesh').setMesh(mesh);
  n.setMesh(null).addChild(child);
}
await io.write(out, doc);
