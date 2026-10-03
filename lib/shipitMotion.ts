// Ship It!'s HD motion, kept pure so it can be tested: which animation the robot plays, where the camera
// leads, and how the boss squashes and stretches. View-only: none of this changes what can be hit.
export type Clip = "Idle" | "Running" | "Jump" | "ThumbsUp";

export function heroClip(s: { won: boolean; ground: boolean; vx: number }): Clip {
  if (s.won) return "ThumbsUp";
  if (!s.ground) return "Jump";
  return Math.abs(s.vx) > 1 ? "Running" : "Idle";
}

// The camera leads where you run: eases toward 16 units ahead of your facing, back to centre when you stop.
// In the boss room the game locks the camera, so the lead goes to 0.
const LEAD = 16, RATE = 3;
export function lookAhead(prev: number, face: number, vx: number, dt: number, locked: boolean) {
  const target = !locked && Math.abs(vx) > 1 ? face * LEAD : 0;
  return prev + (target - prev) * Math.min(1, dt * RATE);
}

// Squash to 70% on a hard landing and spring back; stretch up to 20% while airborne, with speed.
export function squash(prev: number, landedHard: boolean, ground: boolean, vy: number, dt: number) {
  let s = landedHard ? 0.7 : prev;
  if (!landedHard) s += (1 - s) * Math.min(1, dt * 8);
  return { s, y: ground ? s : 1 + Math.min(0.2, Math.abs(vy) / 900) };
}
