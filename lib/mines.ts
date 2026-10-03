// Scope Mines: Minesweeper on the Win98 desktop, where every mine is a scope change.
// Pure: a board is plain data, every move returns a new one. The first click is always safe (mines are laid after it).
export type Cell = { mine: boolean; open: boolean; flag: boolean; near: number };
export type Board = { w: number; h: number; mines: number; cells: Cell[]; laid: boolean; state: "play" | "won" | "lost" };

export const newBoard = (w = 9, h = 9, mines = 10): Board => ({
  w, h, mines, laid: false, state: "play",
  cells: Array.from({ length: w * h }, () => ({ mine: false, open: false, flag: false, near: 0 })),
});

const around = (b: Board, i: number) => {
  const x = i % b.w, y = Math.floor(i / b.w), out: number[] = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, ny = y + dy;
    if ((dx || dy) && nx >= 0 && ny >= 0 && nx < b.w && ny < b.h) out.push(ny * b.w + nx);
  }
  return out;
};

// Lay the mines anywhere but the first click and its neighbours, so the first click opens an area.
function lay(b: Board, safe: number, rand: () => number): Cell[] {
  const keep = new Set([safe, ...around(b, safe)]);
  const spots = b.cells.map((_, i) => i).filter((i) => !keep.has(i));
  for (let i = spots.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [spots[i], spots[j]] = [spots[j], spots[i]]; }
  const mined = new Set(spots.slice(0, b.mines));
  const cells = b.cells.map((c, i) => ({ ...c, mine: mined.has(i) }));
  return cells.map((c, i) => ({ ...c, near: around(b, i).filter((n) => cells[n].mine).length }));
}

export function reveal(b: Board, i: number, rand: () => number = Math.random): Board {
  if (b.state !== "play" || b.cells[i].open || b.cells[i].flag) return b;
  let cells = b.laid ? b.cells.map((c) => ({ ...c })) : lay(b, i, rand);
  if (cells[i].mine) {
    cells = cells.map((c) => (c.mine ? { ...c, open: true } : c));
    return { ...b, cells, laid: true, state: "lost" };
  }
  // Open the cell; an empty one (no mines near) opens its neighbours too.
  const stack = [i];
  while (stack.length) {
    const k = stack.pop()!;
    if (cells[k].open || cells[k].flag) continue;
    cells[k].open = true;
    if (cells[k].near === 0) stack.push(...around(b, k).filter((n) => !cells[n].open));
  }
  const won = cells.every((c) => c.mine || c.open);
  return { ...b, cells, laid: true, state: won ? "won" : "play" };
}

export function flag(b: Board, i: number): Board {
  if (b.state !== "play" || b.cells[i].open) return b;
  return { ...b, cells: b.cells.map((c, k) => (k === i ? { ...c, flag: !c.flag } : c)) };
}
