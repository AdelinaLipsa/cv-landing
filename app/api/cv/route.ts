import { about, certifications, education, jobs, languages, origin, profile, stillShipping, ventures } from "@/content/cv";
import { layers } from "@/content/skills";

// The CV as an API. `curl <site>/api/cv` works.
export const dynamic = "force-static";

export function GET() {
  const { whatsapp, ...contact } = profile; // the phone number is already in contact
  return Response.json(
    {
      ...contact,
      about,
      origin,
      experience: jobs.map(({ short, ...j }) => j),
      stillShipping,
      ventures,
      skills: Object.fromEntries(layers.map((l) => [l.name, l.chips])),
      certifications,
      education,
      languages,
      note: "Hi. If you’re reading this in a terminal, we should talk.",
    },
    { headers: { "X-Robots-Tag": "noindex, nofollow, noarchive" } }
  );
}
