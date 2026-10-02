"use client";
import { useEffect, useRef } from "react";

// Attract mode: a tiny looping scene for each arcade card, like a cabinet waiting for a coin. 96 × 60 pixels.
const W = 96, H = 60;
const ALIEN = ["..#.#..", ".#####.", "##.#.##", "#######", ".#...#."];
const ROBOT = ["..kkkk..", ".kbbbbk.", ".kbsskk.", ".kbbbbk.", "kbbbbbbk", ".kbbbbk.", ".kk..kk."];
const COL: Record<string, string> = { k: "#0b0a1f", b: "#2f6bff", s: "#f2c29b" };

const scenes: Record<string, (c: CanvasRenderingContext2D, t: number) => void> = {
  space: (c, t) => {
    c.fillStyle = "#07061a"; c.fillRect(0, 0, W, H);
    c.fillStyle = "#5a56a0"; for (let i = 0; i < 24; i++) c.fillRect((i * 37) % W, Math.floor((i * 23 + t * (8 + (i % 3) * 6)) % H), 1, 1);
    const off = Math.sin(t * 1.2) * 10;
    ["#F5B53F", "#ff7ac6", "#5fd0ff"].forEach((color, r) => { c.fillStyle = color; for (let k = 0; k < 5; k++) ALIEN.forEach((row, j) => [...row].forEach((p, i) => p === "#" && c.fillRect(Math.round(14 + k * 14 + off) + i, 6 + r * 9 + j, 1, 1))); });
    const sx = Math.round(W / 2 + Math.sin(t * 1.7) * 30);
    c.fillStyle = "#5fd897"; c.fillRect(sx - 3, H - 6, 7, 2); c.fillRect(sx - 1, H - 8, 3, 2); c.fillRect(sx, H - 9, 1, 1);
    c.fillStyle = "#ffffff"; for (let i = 0; i < 3; i++) c.fillRect(sx, Math.round(H - 12 - ((t * 60 + i * 15) % 40)), 1, 3);
  },
  shipit: (c, t) => {
    c.fillStyle = "#0b0a24"; c.fillRect(0, 0, W, H);
    const off = (t * 20) % 24;
    for (let i = -1; i < 6; i++) { const x = Math.round(i * 24 - off); c.fillStyle = "#161437"; c.fillRect(x, 0, 23, H); c.fillStyle = "#24215a"; c.fillRect(x + 16, 0, 3, H); c.fillStyle = (Math.floor(t * 2) + i) % 3 ? "#2a2560" : "#ff5a5a"; c.fillRect(x + 5, 12, 2, 2); }
    for (let x = -Math.round((t * 40) % 8); x < W; x += 8) { c.fillStyle = "#3a3f7a"; c.fillRect(x, H - 10, 8, 10); c.fillStyle = "#F5B53F"; c.fillRect(x, H - 10, 8, 1); c.fillStyle = "#9aa1dd"; c.fillRect(x + 2, H - 8, 1, 1); }
    const hop = Math.abs(Math.sin(t * 3)) * 6;
    ROBOT.forEach((row, j) => [...row].forEach((p, i) => { if (p !== ".") { c.fillStyle = COL[p]; c.fillRect(30 + i, Math.round(H - 17 - hop) + j, 1, 1); } }));
    c.fillStyle = "#fff1a8"; for (let i = 0; i < 2; i++) c.fillRect(40 + ((t * 70 + i * 30) % 60), Math.round(H - 14 - hop), 3, 2);
    c.fillStyle = "#8c94c9"; const dy = 18 + Math.sin(t * 3) * 4; c.fillRect(72, Math.round(dy), 7, 4); c.fillStyle = "#0b0a1f"; c.fillRect(70 + (Math.floor(t * 10) % 2) * 2, Math.round(dy) - 2, 7, 1);
  },
  fighter: (c, t) => {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#1b1040"); g.addColorStop(0.6, "#b8335f"); g.addColorStop(1, "#F5B53F");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = "#ffd27a"; c.beginPath(); c.arc(W / 2, 40, 10, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#2a1640"; for (let i = 0; i < 9; i++) c.fillRect(i * 11, 44 - ((i * 7) % 9), 10, 20);
    c.fillStyle = "#4b2f66"; c.fillRect(0, H - 8, W, 8);
    const bob = Math.round(Math.sin(t * 5)), fighter = (x: number, top: string, face: number) => {
      c.fillStyle = top; c.fillRect(x - 2, H - 22 + bob, 5, 8); c.fillRect(x - 3, H - 14, 2, 6); c.fillRect(x + 2, H - 14, 2, 6);
      c.fillStyle = "#f2c29b"; c.fillRect(x - 1, H - 26 + bob, 4, 4); c.fillRect(x + face * 3, H - 20 + bob, 3, 2);
    };
    fighter(30, "#3f7cff", 1); fighter(66, "#5a5f7a", -1);
    const bx = 36 + ((t * 30) % 26); c.fillStyle = "#5fd0ff"; c.fillRect(Math.round(bx), H - 20, 4, 4); c.fillStyle = "#ffffff"; c.fillRect(Math.round(bx) + 1, H - 19, 2, 2);
  },
};

export default function GamePreview({ id, className }: { id: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!.getContext("2d")!, draw = scenes[id];
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => { draw(c, (now - t0) / 1000); if (!calm) raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [id]);
  return <canvas ref={ref} width={W} height={H} className={className} aria-hidden="true" />;
}
