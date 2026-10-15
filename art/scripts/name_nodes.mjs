// gltf-transform's quantization moves the mesh of a node that has children (RolodexRing, Tower) onto a new,
// unnamed child node. This names those <parent>Mesh. Run on the optimised file, in place:
//   node name_nodes.mjs public/models/room.glb   (needs @gltf-transform/core, /extensions and meshoptimizer)
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const file = process.argv[2];
const doc = await io.read(file);
const nodes = doc.getRoot().listNodes();
for (const n of nodes) {
  if (!n.getName() && n.getMesh()) {
    const parent = nodes.find((p) => p.listChildren().includes(n));
    n.setName((parent ? parent.getName() : 'Node') + 'Mesh');
    console.log('named', n.getName());
  }
}
await io.write(file, doc);
