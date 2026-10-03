// Sprint Fighter's poses, kept pure so the game, the pixel view and the tests share them.

export type Look = { skin: string; top: string; sleeve: string; legs: string; hair: string; extra: string; name: string; move: string };

export const PO: Look = { skin: "#f2c29b", top: "#3f7cff", sleeve: "#2f5fd0", legs: "#2a4fb8", hair: "#17153a", extra: "#ff5a5a", name: "THE PO", move: "SHIP-O-KEN!" };
export const SH: Look = { skin: "#e8b48f", top: "#5a5f7a", sleeve: "#4a4e66", legs: "#33364a", hair: "#b9b6c8", extra: "#ff5a5a", name: "STAKEHOLDER", move: "SCOPE CHANGE!" };

// Poses: [lean, front arm (upper, lower), back arm, front leg (thigh, shin), back leg, hip drop]. Angles from straight down, + is forward.
export type Pose = [number, [number, number], [number, number], [number, number], [number, number], number];
export const POSES: Record<string, Pose> = {
  idle: [0.1, [1.1, 2.3], [0.7, 2.5], [0.35, 0.05], [-0.35, -0.05], 0],
  idle2: [0.1, [1.15, 2.35], [0.7, 2.55], [0.38, 0.0], [-0.38, -0.1], 1],
  walk1: [0.12, [1.1, 2.3], [0.7, 2.5], [0.5, 0.2], [-0.2, -0.45], 0],
  walk2: [0.12, [1.1, 2.3], [0.7, 2.5], [-0.1, -0.4], [0.4, 0.1], 0],
  punch: [0.25, [1.57, 1.57], [0.5, 2.6], [0.45, 0.05], [-0.5, -0.1], 0],
  lowpunch: [0.3, [1.4, 1.5], [0.6, 2.5], [1.2, -0.2], [0.3, -1.2], 5],
  kick: [-0.35, [1.0, 2.4], [0.4, 2.4], [1.6, 1.6], [-0.15, 0], 0],
  crouch: [0.15, [1.1, 2.3], [0.7, 2.5], [1.2, -0.2], [0.3, -1.2], 5],
  jump: [0.1, [1.6, 2.6], [1.0, 2.6], [1.3, -0.6], [0.6, -1.1], 0],
  airkick: [-0.2, [1.4, 2.6], [0.8, 2.6], [1.4, 1.5], [0.3, -1.2], 0],
  special: [0.3, [1.5, 1.6], [1.4, 1.7], [0.6, 0.1], [-0.6, -0.1], 1],
  hit: [-0.45, [-0.3, 0.4], [0.3, 1.0], [0.25, 0.05], [-0.25, 0], 0],
  block: [-0.1, [1.3, 2.9], [1.1, 2.9], [0.3, 0.05], [-0.4, -0.05], 0],
  win: [0, [3.0, 3.1], [0.3, 0.2], [0.2, 0], [-0.2, 0], 0],
};

// Which pose a fighter shows: the same choice the pixel version has always made.
export function poseName(f: { act: string; low: boolean; y: number }, t: number) {
  if (f.act === "walk") return Math.floor(t * 6) % 2 ? "walk1" : "walk2";
  if (f.act === "idle") return Math.floor(t * 2.5) % 2 ? "idle" : "idle2";
  if (f.act === "punch" && f.low) return "lowpunch";
  if (f.act === "kick" && f.y < 0) return "airkick";
  if (f.act === "ko") return "hit";
  return POSES[f.act] ? f.act : "idle";
}
