// The CV's public roadmap: what I might build on this site next. Visitors vote; nobody else adds items.
// Edit freely: ids must stay unique and stable (votes are stored by id), titles are what people see.
export const ideas = [
  { id: "glossary", title: "A payments glossary for non-payments people", note: "3DS, acquirers, decline codes and chargebacks, in plain words." },
  { id: "checkout-teardown", title: "A checkout teardown: where a payment gets lost", note: "Every step from Pay to the money, and what to measure at each one." },
  { id: "deadline", title: "A new Sprint Fighter boss: The Deadline", note: "It gets faster as the clock runs down." },
  { id: "two-player", title: "Two-player Sprint Fighter", note: "Same keyboard, two product owners, one backlog." },
  { id: "xmas-level", title: "A Christmas level in Ship It!", note: "Snow on the steel, a boss in a Santa hat." },
  { id: "ramen", title: "A ramen recipe hidden in the terminal", note: "Mine. Tested in the dark, like all good ramen." },
  { id: "resume-2003", title: "Print the CV as a 2003 résumé", note: "Times New Roman, clip art, a visitor counter on paper." },
  { id: "cat-night", title: "The cat gets night vision in dark mode", note: "Glowing eyes. Still purrs." },
] as const;
export type IdeaId = (typeof ideas)[number]["id"];

// Release notes: what already shipped, newest first.
export const shipped = [
  { v: "v3.5", title: "A Windows 95 desktop inside the retro computer, with Solitaire" },
  { v: "v3.4", title: "Arcade challenges: send your score, they try to beat it" },
  { v: "v3.3", title: "The trophy case: every achievement on a shelf" },
  { v: "v3.2", title: "Break my checkout: five ways to break the $49 payment" },
  { v: "v3.1", title: "Halloween deprecated. The pumpkin had a good run." },
  { v: "v3.0", title: "The arcade goes back to pixels" },
];
