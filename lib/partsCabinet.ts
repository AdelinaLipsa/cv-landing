// The Skills cabinet: one drawer per skill group, opened as far as the picked role used it.
// Even one chip opens a drawer to 35%, so "touched" always reads as open.
export type Drawer = { name: string; total: number; used: number; open: number; col: 0 | 1; row: number; wide: boolean };

export function drawers(layers: readonly { name: string; chips: readonly string[] }[], used: readonly string[], all: boolean): Drawer[] {
  return layers.map((l, i) => {
    const n = l.chips.filter((c) => used.includes(c)).length;
    return {
      name: l.name,
      total: l.chips.length,
      used: n,
      open: all || !n ? 0 : 0.35 + (0.65 * n) / l.chips.length,
      wide: i === 0,
      row: i === 0 ? 0 : 1 + Math.floor((i - 1) / 2),
      col: (i === 0 ? 0 : (i - 1) % 2) as 0 | 1,
    };
  });
}
