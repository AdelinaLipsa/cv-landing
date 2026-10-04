// Klondike Solitaire, as on Windows 95: seven tableau piles, four foundations, draw one from the stock.
// Pure: a game is plain data and every move returns a new one (or the same one when the move isn't legal).
export type Suit = "♠" | "♥" | "♦" | "♣";
export type Card = { suit: Suit; rank: number; up: boolean }; // rank 1 (A) … 13 (K)
export type Game = { stock: Card[]; waste: Card[]; found: Card[][]; tab: Card[][]; moves: number };
export type Where = { pile: "waste" } | { pile: "found"; i: number } | { pile: "tab"; i: number; at: number };

export const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
export const red = (c: Card) => c.suit === "♥" || c.suit === "♦";
export const label = (r: number) => (r === 1 ? "A" : r === 11 ? "J" : r === 12 ? "Q" : r === 13 ? "K" : String(r));

export function deal(rand: () => number = Math.random): Game {
  const deck: Card[] = SUITS.flatMap((suit) => Array.from({ length: 13 }, (_, k) => ({ suit, rank: k + 1, up: false })));
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  const tab: Card[][] = [];
  for (let p = 0; p < 7; p++) tab.push(deck.splice(0, p + 1).map((c, k) => ({ ...c, up: k === p })));
  return { stock: deck, waste: [], found: [[], [], [], []], tab, moves: 0 };
}

const clone = (g: Game): Game => ({ stock: [...g.stock], waste: [...g.waste], found: g.found.map((f) => [...f]), tab: g.tab.map((t) => [...t]), moves: g.moves });

// Stock → waste one card at a time; an empty stock takes the waste back, face down.
export function draw(g: Game): Game {
  const n = clone(g);
  if (n.stock.length) n.waste.push({ ...n.stock.pop()!, up: true });
  else if (n.waste.length) { n.stock = n.waste.reverse().map((c) => ({ ...c, up: false })); n.waste = []; }
  else return g;
  n.moves++;
  return n;
}

// The cards a move would carry: the top of the waste, the top of a foundation, or a tableau run from `at` down.
export function pick(g: Game, from: Where): Card[] {
  if (from.pile === "waste") return g.waste.length ? [g.waste[g.waste.length - 1]] : [];
  if (from.pile === "found") { const f = g.found[from.i]; return f.length ? [f[f.length - 1]] : []; }
  const t = g.tab[from.i];
  if (from.at < 0 || from.at >= t.length || !t[from.at].up) return [];
  return t.slice(from.at);
}

export const fitsFoundation = (f: Card[], c: Card) => (f.length ? f[f.length - 1].suit === c.suit && f[f.length - 1].rank === c.rank - 1 : c.rank === 1);
export const fitsTableau = (t: Card[], c: Card) => {
  if (!t.length) return c.rank === 13;
  const top = t[t.length - 1];
  return top.up && red(top) !== red(c) && top.rank === c.rank + 1;
};

// Move a card (or a run) to a foundation or a tableau pile; flips the newly exposed tableau card.
export function move(g: Game, from: Where, to: { pile: "found"; i: number } | { pile: "tab"; i: number }): Game {
  const cards = pick(g, from);
  if (!cards.length) return g;
  if (to.pile === "found" && (cards.length !== 1 || !fitsFoundation(g.found[to.i], cards[0]))) return g;
  if (to.pile === "tab" && (!fitsTableau(g.tab[to.i], cards[0]) || (from.pile === "tab" && from.i === to.i))) return g;
  const n = clone(g);
  if (from.pile === "waste") n.waste.pop();
  else if (from.pile === "found") n.found[from.i].pop();
  else {
    n.tab[from.i] = n.tab[from.i].slice(0, from.at);
    const t = n.tab[from.i];
    if (t.length && !t[t.length - 1].up) t[t.length - 1] = { ...t[t.length - 1], up: true };
  }
  if (to.pile === "found") n.found[to.i].push(cards[0]);
  else n.tab[to.i].push(...cards);
  n.moves++;
  return n;
}

// Double-click: send a single card to whichever foundation takes it.
export function autoFound(g: Game, from: Where): Game {
  const cards = pick(g, from);
  if (cards.length !== 1) return g;
  for (let i = 0; i < 4; i++) if (fitsFoundation(g.found[i], cards[0])) return move(g, from, { pile: "found", i });
  return g;
}

export const won = (g: Game) => g.found.every((f) => f.length === 13);
