// Build mode script: Adelina's story, told while the page builds itself.
// One clock; each step lasts 3s + its line length / 20, scaled by speed.
// era: how the page looks (0 = 2003, 1 = glossy, 2 = flat, 3 = now). The web's history is a side note (`web`), not the story.
// builds: the pieces of the page this step builds (earlier ones stay). cues: when a word is typed, a thing lights up. year: the clock's label.
// target: CSS selectors, first visible wins. also: more of the subject (every visible match), framed and lit with it.
// Every fact here is on the CV or in Adelina's own words.

// Pieces of the page the tour builds; a step builds its keys and keeps every earlier one.
export type BuildKey = "home.offduty" | "home.room" | "home.dock" | "home.preview" | "career.head" | "career.edu-psychology" | "career.edu-web" | "career.agrocity" | "career.innovational" | "career.fabelx" | "career.ubisoft" | "career.fork" | "career.siterocket" | "career.yomali" | "career.rest" | "skills.product" | "skills.rest" | "work.owned" | "work.built";
// cue: when the first word of `at` is typed in `say`, the `hot` thing lights up.
export type Cue = { at: string; hot: "phone" | "printer" | "rolodex" | "theme" };

export type Step = {
  title: string;
  era: 0 | 1 | 2 | 3;
  pane: 0 | 1 | 2 | 3;
  target: string;
  also?: string;
  say: string;
  builds: BuildKey[];
  cues?: Cue[];
  year?: string;
  web?: string;
};

// Career rows: the commit's detail card (desktop) is part of the shot.
const CARD = '[data-tour="card"]';

export const steps: Step[] = [
  { title: "Start", era: 0, pane: 0, target: '[data-tour="name"]', builds: [], year: "2003", say: "Every build starts as raw HTML. Mine did too, it just took the scenic route.", web: "Meanwhile, the web: 2003. Please sign the guestbook." },
  { title: "High school", era: 1, pane: 0, target: '[data-tour="highschool"]', also: '[data-tour="highschool-then"]', builds: ["home.offduty"], say: "High school: I modded my Windows, broke it, and emulated the Nintendo and Game Boy games I couldn’t get. My comfort zone, then and now.", web: "Meanwhile, the web got glossy. The buttons looked edible." },
  { title: "2012", era: 1, pane: 2, target: '[data-tour="edu-psychology"]', builds: ["career.head", "career.edu-psychology"], year: "2012", say: "2012 to 2015: psychology, with a focus on criminalistics. After the degree, an internship at SRI, the Romanian Intelligence Service. Yes, that one." },
  { title: "2019", era: 2, pane: 2, target: '[data-tour="edu-web"]', builds: ["career.edu-web"], year: "2019", say: "Photographer, cook, salesperson. Then in 2019 I decided computers were my future. They didn’t get a vote. Web development at The Informal School of IT.", web: "Meanwhile, the web went flat. We deleted every shadow, then quietly missed them." },
  { title: "2020", era: 2, pane: 2, target: '[data-tour="job-agrocity"]', also: CARD, builds: ["career.agrocity"], year: "2020", say: "2020: AgroCity, starting as an intern. PHP, Laravel, Vue, then the mobile apps with Capacitor. My first commit on the dev branch." },
  { title: "2022", era: 2, pane: 2, target: '[data-tour="job-fabelx"]', also: CARD, builds: ["career.innovational", "career.fabelx"], year: "2022", say: "Fabel X: full-stack, then tech lead for the second half of 2023. Same desk, more meetings." },
  { title: "2024", era: 2, pane: 2, target: '[data-tour="job-ubisoft"]', also: CARD, builds: ["career.ubisoft"], year: "2024", say: "Ubisoft: the QA platform testers used every day. Laravel and Vue, shipped to Kubernetes. No, I can’t get you free games." },
  { title: "2025", era: 2, pane: 2, target: '[data-tour="fork"]', also: CARD, builds: ["career.fork"], year: "2025", say: "2025: product branches off. The dev branch never got deleted. I checked." },
  { title: "2025", era: 2, pane: 2, target: '[data-tour="job-siterocket"]', also: CARD, builds: ["career.siterocket"], say: "SiteRocket Labs: technical project manager for a digital health client. I wrote the requirements, built the Caspio side, and wrote the AWS Lambda functions." },
  { title: "Now", era: 3, pane: 2, target: '[data-tour="job-yomali"]', also: CARD, builds: ["career.yomali", "career.rest"], year: "Now", say: "Now, Yomali: I own every gap in the company. I work closely with the founder on whatever is needed, and make sure it gets delivered and actually works. Core engineering, technical support, and lately, a customer support rework. Early on: the team’s training documents, which I wrote, and Factorial for HR." },
  { title: "The stack", era: 3, pane: 3, target: '[data-tour="product"]', builds: ["skills.product", "skills.rest"], say: "Product on top, because that’s the job now. I still ship in every layer under it." },
  { title: "My room", era: 3, pane: 0, target: '[data-tour="cards"]', builds: ["home.room", "home.dock"], cues: [{ at: "phone", hot: "phone" }, { at: "printer", hot: "printer" }, { at: "monitor", hot: "rolodex" }], say: "My teenage room at dusk: guitars, boxing gloves, a skateboard, and two cats. The phone texts me, the printer prints my CV, and the monitor boots Windows 95." },
  { title: "Specs", era: 3, pane: 1, target: '[data-key="gateways"]', builds: ["work.owned"], say: "Some of the specs I write, for the devs who build them. Then I make sure it ships and works." },
  { title: "Things I built", era: 3, pane: 1, target: '[data-key="bite"]', builds: ["work.built", "home.preview"], say: "And the things that didn’t exist until I built them: BITE, which the whole affiliate managers team uses every day, Param Decoder, the customer support automations, and Hookwarden, open source." },
  { title: "Off duty", era: 3, pane: 0, target: '[data-tour="offduty"]', builds: [], say: "Off duty: MMA, drawing in Procreate, electric guitar, anime, games, and cats. Plus how a psychology degree ended up on the dev branch." },
  { title: "Done", era: 3, pane: 0, target: '[data-tour="name"]', builds: [], cues: [{ at: "Light or dark", hot: "theme" }, { at: "Message me", hot: "phone" }], say: "Now it exists. Light or dark, your call. Message me: WhatsApp, email, or a call, your pick. No cover letter needed." },
];

export const ALL_BUILT: ReadonlySet<BuildKey> = new Set(steps.flatMap((s) => s.builds));

export const dur = (s: Step) => 3 + s.say.length / 20;
export const starts = steps.reduce<number[]>((acc, s, i) => [...acc, i ? acc[i - 1] + dur(steps[i - 1]) : 0], []);
export const total = starts[steps.length - 1] + dur(steps[steps.length - 1]);

export function stepAt(t: number) {
  let i = 0;
  while (i < steps.length - 1 && t >= starts[i + 1]) i++;
  return i;
}
