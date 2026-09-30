// Build mode script. One clock; each step lasts 3s + its line length / 20, scaled by speed.
// era: 0 = 2003, 1 = 2010, 2 = 2016, 3 = now. stage: which 2026 sections have dropped in.
// target: CSS selectors, first visible one wins. code: a real file from this repo typed into the code panel.

export type Step = {
  title: string;
  era: 0 | 1 | 2 | 3;
  pane: 0 | 1 | 2 | 3;
  stage: number;
  target: string;
  label: string | [mobile: string, desktop: string];
  say: string;
  code?: "motion" | "wall";
};

export const STAGE = { portrait: 1, cards: 2, offDuty: 3, done: 4, finale: 5, all: 99 } as const;

export const steps: Step[] = [
  { title: "2003", era: 0, pane: 0, stage: 0, target: '[data-tour="name"]', label: "h1, Times, 2003", say: "This is my CV the way it would have looked in 2003. Please sign the guestbook." },
  { title: "2003", era: 0, pane: 0, stage: 0, target: '[data-tour="counter"]', label: "a visitor counter", say: "Every site had one of these. Nobody knew why." },
  { title: "2010", era: 1, pane: 0, stage: 0, target: '[data-tour="build"]', label: "button, glossy", say: "Then everything got glossy. The buttons looked edible." },
  { title: "2010", era: 1, pane: 0, stage: 0, target: '[data-tour="portrait"]', label: "3px white border, drop shadow", say: "Photos got a white border and a drop shadow. It was a look." },
  { title: "2016", era: 2, pane: 0, stage: 0, target: '[data-tour="preview"]', label: "cards, flat", say: "Then flat. We deleted every shadow, then quietly missed them." },
  { title: "Now", era: 3, pane: 0, stage: STAGE.portrait, target: '[data-tour="portrait"]', label: "2026, the real one", say: "And now it exists. Let me build the rest properly." },
  { title: "Build", era: 3, pane: 0, stage: STAGE.portrait, target: '[data-tour="name"]', label: "Anybody 700, width 125%", say: "Real code, from this repo. The springs are soft on purpose. Nothing here is snappy.", code: "motion" },
  { title: "Build", era: 3, pane: 0, stage: STAGE.cards, target: '[data-tour="cards"], [data-tour="preview"]', label: "live, not a screenshot", say: "These are drawn in code. No screenshots, no stock photos.", code: "wall" },
  { title: "Build", era: 3, pane: 0, stage: STAGE.offDuty, target: '[data-tour="retro"]', label: "the comfort zone", say: "Where it started: rooting Windows and emulating Game Boy games in high school." },
  { title: "Home", era: 3, pane: 0, stage: STAGE.done, target: '[data-tour="build"]', label: "the button that started this", say: "Every button here moves the whole page. Watch." },
  { title: "Work", era: 3, pane: 1, stage: STAGE.done, target: '[data-key="decoder"]', label: "Built", say: "Things that didn’t exist until somebody got annoyed enough. Usually me." },
  { title: "Work", era: 3, pane: 1, stage: STAGE.done, target: '[data-tour="wide"]', label: "Analysed", say: "Not everything I make is code. Sometimes it’s the answer to a question." },
  { title: "Work", era: 3, pane: 1, stage: STAGE.done, target: '[data-key="self-refund"]', label: "Owned", say: "Some I owned and a team built. The label always says which." },
  { title: "Career", era: 3, pane: 2, stage: STAGE.done, target: '[data-tour="graph"]', label: "dev, 2020 to now", say: "Four years writing code, then product. The dev branch never got deleted." },
  { title: "Career", era: 3, pane: 2, stage: STAGE.done, target: '[data-tour="merge"]', label: "on both branches", say: "The tools I still build land on both branches. That’s the point." },
  { title: "Skills", era: 3, pane: 3, stage: STAGE.done, target: '[data-tour="product"]', label: "the job now", say: "The top layer is the job. The rest is why my specs are good." },
  { title: "Done", era: 3, pane: 0, stage: STAGE.finale, target: '[data-tour="name"]', label: "Now it exists.", say: "Now it exists. That’s the tour. Message me, it opens WhatsApp." },
];

export const dur = (s: Step) => 3 + s.say.length / 20;
export const starts = steps.reduce<number[]>((acc, s, i) => [...acc, i ? acc[i - 1] + dur(steps[i - 1]) : 0], []);
export const total = starts[steps.length - 1] + dur(steps[steps.length - 1]);

export function stepAt(t: number) {
  let i = 0;
  while (i < steps.length - 1 && t >= starts[i + 1]) i++;
  return i;
}
