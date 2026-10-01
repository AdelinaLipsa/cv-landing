import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Shell from "@/components/Shell";

// Real source from this repo, typed into the build's code panel. Read at build time.
const read = (p: string) => readFileSync(join(/*turbopackIgnore: true*/ process.cwd(), p), "utf8"); // static page: nothing to trace
// The hero's payment journey: the steps a payment takes, each one hers.
const journey = read("components/PaymentJourney.tsx");
const steps = journey.slice(journey.indexOf("const steps = "), journey.indexOf("];", journey.indexOf("const steps = ")) + 3);

export default function Page() {
  return (
    <Shell
      // Adelina's 3D character, if its Mixamo files are in public/models (checked at build, so no 404 probing in the browser).
      character={existsSync(join(/*turbopackIgnore: true*/ process.cwd(), "public/models/running.fbx"))}
      code={{
        motion: { path: "lib/motion.ts", text: read("lib/motion.ts") },
        journey: { path: "components/PaymentJourney.tsx", text: steps },
      }}
    />
  );
}
