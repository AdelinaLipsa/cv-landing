// Pure logic for the guide's director: what is built when, what is typed when, and the rewind.
import { steps, ALL_BUILT, type BuildKey, type Cue, type Step } from "../content/tour.ts";

export const TYPE_CPS = 28;

export const builtAt = (i: number) => new Set<BuildKey>(steps.slice(0, i + 1).flatMap((s) => s.builds));

export const resolveBuilt = (touring: boolean, i: number): ReadonlySet<BuildKey> => (touring ? builtAt(i) : ALL_BUILT);

// Words whose last letter has been typed `local` seconds in (+1e-9 dodges float error at exact boundaries).
export function wordsShown(say: string, local: number) {
  const chars = Math.floor(local * TYPE_CPS + 1e-9);
  let end = 0, n = 0;
  for (const w of say.split(" ")) {
    end += w.length;
    if (end > chars) break;
    end++; n++;
  }
  return n;
}

// The latest cue whose first word has been typed.
export function cueAt(step: Step, local: number): Cue["hot"] | null {
  const shown = wordsShown(step.say, local);
  const words = step.say.split(" ").map((w) => w.replace(/[^\p{L}\p{N}]+$/u, ""));
  let hot: Cue["hot"] | null = null, last = -1;
  for (const c of step.cues ?? []) {
    const at = words.indexOf(c.at.split(" ")[0]);
    if (at >= 0 && at < shown && at > last) { hot = c.hot; last = at; }
  }
  return hot;
}

export const jobOf = (step: Step) => step.target.match(/^\[data-tour="job-(.+)"\]$/)?.[1] ?? null;

// Rewind progress p (0 to 1): the era steps back from 3 to 0; the first quarter keeps everything built.
export const rewindAt = (p: number): { era: 0 | 1 | 2 | 3; all: boolean } => ({
  era: (p >= 1 ? 0 : 3 - Math.min(3, Math.floor(p * 4))) as 0 | 1 | 2 | 3,
  all: p < 0.25,
});

// The step whose page the rewind shows at p (builtAt of it is what is still built): the build backwards. In each
// quarter the steps of the era on screen come undone newest-first, so an era is bare before the page leaves it.
export function rewindUpto(p: number) {
  const { era } = rewindAt(p);
  const mine = steps.flatMap((s, i) => (s.era === era ? [i] : []));
  const f = Math.min(1, Math.max(0, p * 4 - (3 - era)));
  return mine[0] - 1 + Math.round((1 - f) * mine.length);
}
