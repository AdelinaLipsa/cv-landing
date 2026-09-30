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
  code?: "motion" | "wall";
};

// Sections appear in this order as the story reaches them.
export const STAGE = { offDuty: 1, portrait: 2, cards: 3, done: 4, finale: 5, all: 99 } as const;

export const steps: Step[] = [
  { title: "Start", era: 0, pane: 0, stage: 0, target: '[data-tour="name"]', label: "raw HTML", say: "Every build starts as raw HTML. Let me tell you how mine got built.", web: "Meanwhile, the web: 2003. Please sign the guestbook." },
  { title: "High school", era: 1, pane: 0, stage: STAGE.offDuty, target: '[data-tour="retro"]', label: "the comfort zone", say: "High school: I rooted my Windows and emulated the Game Boy games I couldn’t get. I’d run home to this.", web: "Meanwhile, the web got glossy. The buttons looked edible." },
  { title: "2012", era: 1, pane: 0, stage: STAGE.offDuty, target: '[data-tour="role"]', label: "the other half", say: "Then a psychology degree, 2012 to 2015. Handy later, for reading stakeholders." },
  { title: "2019", era: 2, pane: 0, stage: STAGE.offDuty, target: '[data-tour="preview"]', label: "cards, flat", say: "2019: web development at The Informal School of IT. Back to building things.", web: "Meanwhile, the web went flat. We deleted every shadow, then quietly missed them." },
  { title: "2020", era: 3, pane: 0, stage: STAGE.portrait, target: '[data-tour="portrait"]', label: "the real page starts here", say: "2020: AgroCity, starting as an intern. PHP, Laravel, Vue. The page starts getting built properly.", web: "Meanwhile, the web: this." },
  { title: "2022", era: 3, pane: 0, stage: STAGE.portrait, target: '[data-tour="name"]', label: "Anybody 700, width 125%", say: "Fabel X: full-stack, then tech lead. This is real code from this repo. Nothing here is snappy.", code: "motion" },
  { title: "2024", era: 3, pane: 1, stage: STAGE.portrait, target: '[data-key="micro-frontends"]', label: "Built", say: "Ubisoft: three Vue apps on one page, shipped to Kubernetes. Testers used it every day." },
  { title: "2025", era: 3, pane: 2, stage: STAGE.portrait, target: '[data-tour="graph"]', label: "product branches off", say: "2025: product branches off. SiteRocket Labs, then Yomali. The dev branch never got deleted." },
  { title: "Now", era: 3, pane: 3, stage: STAGE.portrait, target: '[data-tour="product"]', label: "the job now", say: "Now: Technical Product Owner on payments. 3DS, checkout, chargebacks. The rest of the stack is why my specs are good." },
  { title: "Still shipping", era: 3, pane: 0, stage: STAGE.cards, target: '[data-tour="cards"], [data-tour="preview"]', label: "live, not a screenshot", say: "I still build the tools I need: a link decoder, a change log, a webhook scanner.", code: "wall" },
  { title: "Analysed", era: 3, pane: 1, stage: STAGE.done, target: '[data-tour="wide"]', label: "Analysed", say: "Sometimes what I build is an answer: payment success held at 43–45%, so the drop sat before payment." },
  { title: "Off duty", era: 3, pane: 0, stage: STAGE.done, target: '[data-tour="retro"]', label: "still my comfort zone", say: "Off duty: games, ramen in the dark, and a streetwear label called Ruined Saints." },
  { title: "Done", era: 3, pane: 0, stage: STAGE.finale, target: '[data-tour="name"]', label: "Now it exists.", say: "Now it exists. Message me, it opens WhatsApp." },
];

export const dur = (s: Step) => 3 + s.say.length / 20;
export const starts = steps.reduce<number[]>((acc, s, i) => [...acc, i ? acc[i - 1] + dur(steps[i - 1]) : 0], []);
export const total = starts[steps.length - 1] + dur(steps[steps.length - 1]);

export function stepAt(t: number) {
  let i = 0;
  while (i < steps.length - 1 && t >= starts[i + 1]) i++;
  return i;
}
