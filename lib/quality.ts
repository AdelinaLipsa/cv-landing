// How hard the arcade's 3D views work. Picked from the device, stepped down live if frames drop.
export type Tier = "low" | "medium" | "high";
export type Device = { touch: boolean; cores: number; memoryGB?: number; dpr: number };
export type TierSettings = { pixelRatio: number; antialias: boolean; shadows: boolean; smaa: boolean; finish: boolean; particles: number };

export const TIERS: Record<Tier, TierSettings> = {
  low: { pixelRatio: 1, antialias: false, shadows: false, smaa: false, finish: false, particles: 0.4 },
  medium: { pixelRatio: 1.5, antialias: false, shadows: false, smaa: true, finish: true, particles: 0.7 },
  high: { pixelRatio: 2, antialias: true, shadows: true, smaa: true, finish: true, particles: 1 },
};
const ORDER: Tier[] = ["low", "medium", "high"];

export function pickTier(d: Device, saved?: string | null): Tier {
  if (saved === "low" || saved === "medium" || saved === "high") return saved;
  if (d.cores <= 4 || (d.memoryGB !== undefined && d.memoryGB <= 4)) return "low";
  return d.touch ? "medium" : "high";
}

export const lower = (t: Tier): Tier | null => (t === "low" ? null : ORDER[ORDER.indexOf(t) - 1]);

// Averages frame times over a window; under `floor` fps, calls onDrop. Skips the first frames
// (shaders compiling stutter) and waits a while after each drop before judging again.
export function fpsGovernor(onDrop: () => void, window = 120, floor = 45) {
  let n = 0, sum = 0, skip = 30;
  return (dt: number) => {
    if (skip > 0) { skip--; return; }
    n++; sum += dt;
    if (n < window) return;
    const fps = n / sum;
    n = 0; sum = 0;
    if (fps < floor) { skip = window; onDrop(); }
  };
}
