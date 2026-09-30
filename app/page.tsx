import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Shell from "@/components/Shell";

// Real source from this repo, typed into the build's code panel. Read at build time.
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const wall = read("content/wall.ts");
const decoder = wall.slice(wall.indexOf("  {\n    id: \"decoder\""), wall.indexOf("  },", wall.indexOf("id: \"decoder\"")) + 4);

export default function Page() {
  return (
    <Shell
      // Adelina's 3D character, if its Mixamo files are in public/models (checked at build, so no 404 probing in the browser).
      character={existsSync(join(process.cwd(), "public/models/running.fbx"))}
      code={{
        motion: { path: "lib/motion.ts", text: read("lib/motion.ts") },
        wall: { path: "content/wall.ts", text: decoder },
      }}
    />
  );
}
