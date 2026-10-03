// Loads the arcade's models: glTF with meshopt compression, cached per URL, cloned per use
// (skinned characters too). Rejects on any failure: callers fall back to their procedural models.
// Optimise new models before adding them:
//   npx @gltf-transform/cli optimize in.glb public/arcade/<game>/name.glb --compress meshopt --texture-compress webp --texture-size 1024
import type * as T from "three";

type Loaded = { scene: T.Group; animations: T.AnimationClip[] };
const cache = new Map<string, Promise<Loaded>>();

export async function loadModel(url: string): Promise<Loaded> {
  if (!cache.has(url)) {
    cache.set(url, (async () => {
      const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("three/examples/jsm/libs/meshopt_decoder.module.js"),
      ]);
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      const gltf = await loader.loadAsync(url);
      return { scene: gltf.scene, animations: gltf.animations };
    })().catch((e) => { cache.delete(url); throw e; })); // a failed load can be retried later
  }
  const { scene, animations } = await cache.get(url)!;
  const { clone } = await import("three/examples/jsm/utils/SkeletonUtils.js");
  return { scene: clone(scene) as T.Group, animations };
}
