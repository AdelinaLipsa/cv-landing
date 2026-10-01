import { createContext } from "react";

// Whether a Work demo should animate. Cards on the Work page set it while hovered (always on touch
// screens, which can't hover); everywhere else (the viewer, the Home teaser) it's on by default.
export const Play = createContext(true);
