// Build mode script: Adelina's story, told while the page builds itself.
// One clock; each step lasts 3s + its line length / 20, scaled by speed.
// era: how the page looks (0 = 2003, 1 = glossy, 2 = flat, 3 = now). The web's history is a side note (`web`), not the story.
// stage: which sections have dropped in. target: CSS selectors, first visible wins. code: a real file typed into the code panel.
// Every fact here is on the CV or in Adelina's own words.

export type Step = {
  title: string;
  era: 0 | 1 | 2 | 3;
  pane: 0 | 1 | 2 | 3;
  stage: number;
  target: string;
  label: string | [mobile: string, desktop: string];
  say: string;
  web?: string;
  code?: "motion" | "journey";
};

// Sections appear in this order as the story reaches them.
export const STAGE = { offDuty: 1, portrait: 2, cards: 3, done: 4, finale: 5, all: 99 } as const;

export const steps: Step[] = [
  { title: "Start", era: 0, pane: 0, stage: 0, target: '[data-tour="name"]', label: "raw HTML", say: "Every build starts as raw HTML. Mine did too, it just took the scenic route.", web: "Meanwhile, the web: 2003. Please sign the guestbook." },
  { title: "High school", era: 1, pane: 0, stage: STAGE.offDuty, target: '[data-tour="retro"]', label: "the comfort zone", say: "High school: I rooted my Windows and emulated the Nintendo and Game Boy games I couldn’t get. My comfort zone, then and now.", web: "Meanwhile, the web got glossy. The buttons looked edible." },
  { title: "2012", era: 3, pane: 2, stage: STAGE.portrait, target: '[data-tour="edu-psychology"]', label: "Psychology, 2012 to 2015", say: "2012 to 2015: psychology, with a focus on criminalistics. After the degree, an internship at SRI, the Romanian Intelligence Service. Yes, that one." },
  { title: "2019", era: 3, pane: 2, stage: STAGE.portrait, target: '[data-tour="edu-web"]', label: "Web Development, 2019", say: "Photographer, cook, salesperson. Then in 2019 I decided computers were my future. They didn’t get a vote. Web development at The Informal School of IT.", web: "Meanwhile, the web went flat. We deleted every shadow, then quietly missed them." },
  { title: "2020", era: 3, pane: 2, stage: STAGE.portrait, target: '[data-tour="job-agrocity"]', label: "AgroCity.eu, from Jul 2020", say: "2020: AgroCity, starting as an intern. PHP, Laravel, Vue, then the mobile apps with Capacitor. My first commit on the dev branch." },
  { title: "2022", era: 3, pane: 2, stage: STAGE.portrait, target: '[data-tour="job-fabelx"]', label: "Fabel X, 2022 to 2024", say: "Fabel X: full-stack, then tech lead for the second half of 2023. Same desk, more meetings." },
  { title: "2024", era: 3, pane: 2, stage: STAGE.portrait, target: '[data-tour="job-ubisoft"]', label: "Ubisoft, Mar to Dec 2024", say: "Ubisoft: the QA platform testers used every day. Laravel and Vue, shipped to Kubernetes. No, I can’t get you free games." },
  { title: "2025", era: 3, pane: 2, stage: STAGE.portrait, target: '[data-tour="fork"]', label: "product branches off", say: "2025: product branches off. The dev branch never got deleted. I checked." },
  { title: "2025", era: 3, pane: 2, stage: STAGE.portrait, target: '[data-tour="job-siterocket"]', label: "SiteRocket Labs, Feb to Sep 2025", say: "SiteRocket Labs: technical project manager for a digital health client. I wrote the requirements, built the Caspio side, and wrote the AWS Lambda functions." },
  { title: "Now", era: 3, pane: 2, stage: STAGE.portrait, target: '[data-tour="job-yomali"]', label: "Yomali, Sep 2025 to now", say: "Now, Yomali: product owner on payments, product manager for the core engineering team, and manager of technical support. At the same time, yes." },
  { title: "The stack", era: 3, pane: 3, stage: STAGE.portrait, target: '[data-tour="product"]', label: "the job now", say: "Product on top, because that’s the job now. I still ship in every layer under it." },
  { title: "The job", era: 3, pane: 0, stage: STAGE.cards, target: '[data-tour="cards"]', label: "press pay", say: "Press pay and follow the money. That’s the payments product I own: what ships, in what order, and how it performs.", code: "journey" },
  { title: "Products I own", era: 3, pane: 1, stage: STAGE.done, target: '[data-key="gateways"]', label: "products I own", say: "The products I own: the gateways, the ways to pay, the change log. What ships, in what order, and how it performs." },
  { title: "Things I built", era: 3, pane: 1, stage: STAGE.done, target: '[data-key="bite"]', label: "things I built", say: "And the tools I built because the team kept hitting the same wall: BITE, which the whole affiliate managers team uses every day, Param Decoder, and Hookwarden, open source." },
  { title: "Off duty", era: 3, pane: 0, stage: STAGE.done, target: '[data-tour="retro"]', label: "grab it and turn it", say: "Off duty: MMA, drawing in Procreate, electric guitar, anime, games, and cats. That’s my room. Grab it and turn it, the cat won’t mind." },
  { title: "Done", era: 3, pane: 0, stage: STAGE.finale, target: '[data-tour="name"]', label: "Now it exists.", say: "Now it exists. Light or dark, your call, top right. Message me, it opens WhatsApp. No cover letter needed." },
];

export const dur = (s: Step) => 3 + s.say.length / 20;
export const starts = steps.reduce<number[]>((acc, s, i) => [...acc, i ? acc[i - 1] + dur(steps[i - 1]) : 0], []);
export const total = starts[steps.length - 1] + dur(steps[steps.length - 1]);

export function stepAt(t: number) {
  let i = 0;
  while (i < steps.length - 1 && t >= starts[i + 1]) i++;
  return i;
}
