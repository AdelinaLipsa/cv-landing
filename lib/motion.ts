// Motion tokens from design/DESIGN.md. Nothing snappy.
export const drift = { type: "spring", stiffness: 120, damping: 26 } as const; // buttons, toggles, tab pill
export const glide = { type: "spring", stiffness: 90, damping: 22 } as const; // sheets, pane swipes, tile zoom
export const slow = { type: "spring", stiffness: 50, damping: 18 } as const; // era changes, big reveals
export const land = { type: "spring", stiffness: 70, damping: 12 } as const; // once, when the build ends

export const ease = [0.65, 0, 0.35, 1] as const;
export const track = { duration: 1.6, ease } as const; // tabs and tour steps slide the whole page
