import { existsSync } from "node:fs";
import { join } from "node:path";
import Shell from "@/components/Shell";

export default function Page() {
  return (
    // Adelina's 3D character, if its Mixamo files are in public/models (checked at build, so no 404 probing in the browser).
    <Shell character={existsSync(join(/*turbopackIgnore: true*/ process.cwd(), "public/models/running.fbx"))} />
  );
}
