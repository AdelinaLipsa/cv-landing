// The space shooter as it was: pixel sprites, three layers of square stars, drawn on the 2D layer.
export type SpaceFrame = {
  t: number; dt: number; warp: number; shake: number;
  ship: { x: number; visible: boolean; trim: string; shield: boolean };
  aliens: { x: number; y: number; alive: boolean; diving: boolean }[]; kind: number;
  boss: { x: number; y: number; hit: boolean; hp: number } | null;
  shots: { x: number; y: number; vx: number; vy: number }[];
  bombs: { x: number; y: number }[];
  drops: { x: number; y: number; color: string }[];
  sparks: { x: number; y: number; life: number; max: number; color: string }[];
};
export type SpaceView = { draw: (f: SpaceFrame) => void; boom: (x: number, y: number, color: string, power: number) => void; dispose: () => void };

const SHIP = ["...#...", "..###..", ".#####.", "##.#.##", "#..#..#"];
const FRAMES = [
  [["..#.#..", ".#####.", "##.#.##", "#######", ".#...#."], [".#.#.#.", ".#####.", "##.#.##", "#######", "#.#.#.#"]],
  [["#.....#", ".#####.", "##.#.##", "#######", "#.#.#.#"], ["#.....#", "#######", "##.#.##", ".#####.", ".#...#."]],
  [["..###..", ".#####.", "#.#.#.#", "#######", ".#.#.#."], ["..###..", ".#####.", "#.#.#.#", "#######", "#.....#"]],
];
const BOSS = ["....#######....", "..###########..", ".##..#####..##.", "###############", "#.###########.#", "#.#...#.#...#.#", "...##.....##...", "..#.........#.."];

export function retroSpace(ctx: CanvasRenderingContext2D, W: number, H: number, tint: string[], bossColor: string): SpaceView {
  const stars = Array.from({ length: 60 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, layer: i % 3 }));
  const sprite = (rows: string[], x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === "#") ctx.fillRect(Math.round(x) + i, Math.round(y) + j, 1, 1); });
  };
  return {
    draw(f: SpaceFrame) {
      ctx.save();
      if (f.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 4));
      ctx.fillStyle = "#07061a";
      ctx.fillRect(-4, -4, W + 8, H + 8);
      for (const st of stars) {
        st.y = (st.y + (6 + st.layer * 9) * f.warp * f.dt) % H;
        ctx.fillStyle = ["#2e2b5c", "#5a56a0", "#a9a6e8"][st.layer];
        ctx.fillRect(Math.round(st.x), Math.round(st.y), 1, f.warp > 1 ? 1 + st.layer * 2 : 1);
      }
      const pose = Math.floor(Math.max(0, f.t) * 2) % 2;
      f.aliens.forEach((a) => a.alive && sprite(FRAMES[f.kind][pose], a.x, a.y, tint[f.kind]));
      if (f.boss) sprite(BOSS, f.boss.x, f.boss.y, f.boss.hit ? "#ffffff" : bossColor);
      for (const d of f.drops) {
        ctx.fillStyle = d.color; ctx.fillRect(Math.round(d.x) - 3, Math.round(d.y) - 3, 7, 7);
        ctx.fillStyle = "#07061a"; ctx.fillRect(Math.round(d.x) - 2, Math.round(d.y) - 2, 5, 5);
      }
      if (f.ship.visible) {
        if (Math.floor(f.t * 20) % 2) { ctx.fillStyle = "#F5B53F"; ctx.fillRect(Math.round(f.ship.x), H - 3, 1, 2); }
        sprite(SHIP, f.ship.x - 3, H - 9, f.ship.trim);
        if (f.ship.shield) { ctx.strokeStyle = "#5fd0ff"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(f.ship.x + 0.5, H - 6.5, 6, 0, Math.PI * 2); ctx.stroke(); }
      }
      ctx.fillStyle = "#ffffff"; f.shots.forEach((p) => ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 3));
      ctx.fillStyle = "#ff5a5a"; f.bombs.forEach((p) => ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 2));
      for (const p of f.sparks) { ctx.globalAlpha = p.life / p.max; ctx.fillStyle = p.color; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
      ctx.globalAlpha = 1;
      ctx.restore();
    },
    boom() { },
    dispose() { },
  };
}
