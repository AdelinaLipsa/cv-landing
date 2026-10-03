// Achievements: found things unlock with a toast ("🏆 Konami master · 4/18"). Kept per visitor in localStorage.
// Anything can call unlock(id); the toast component listens for the event.
export const ACHIEVEMENTS = {
  console: { name: "I’m in", hint: "Run a command in the browser console" },
  konami: { name: "Up up down down", hint: "Enter the Konami code" },
  ramen: { name: "Ramen rain", hint: "Make it rain ramen" },
  terminal: { name: "Root access", hint: "Open the terminal (press `)" },
  tour: { name: "Director’s cut", hint: "Watch the whole build" },
  dark: { name: "Lights out", hint: "Switch to dark mode" },
  night: { name: "Night owl", hint: "Visit between midnight and 5am" },
  arcade: { name: "Insert coin", hint: "Open the arcade" },
  backlog: { name: "Backlog cleared", hint: "Beat The Backlog in Space shooter" },
  scope: { name: "Scope contained", hint: "Beat Scope Creep in Ship It!" },
  stakeholder: { name: "Roadmap approved", hint: "Beat The Stakeholder in Sprint Fighter" },
  perfect: { name: "Flawless", hint: "Win a Sprint Fighter round without a scratch" },
  cat: { name: "Cat person", hint: "Pet the cat" },
  guestbook: { name: "It’s 2003 again", hint: "Sign the guestbook" },
  recruiter: { name: "Speed run", hint: "Open the 30-second version" },
  explorer: { name: "Explorer", hint: "Visit all four tabs" },
  roles: { name: "Four hats", hint: "Open all four roles in the hero card" },
  chaos: { name: "Chaos engineer", hint: "Break the checkout all five ways" },
  lost: { name: "Lost and found", hint: "Find the 404 page" },
  sudo: { name: "Incident reported", hint: "Try to sudo the page" },
  boo: { name: "Spooked", hint: "Type boo" },
} as const;
export type AchievementId = keyof typeof ACHIEVEMENTS;

const KEY = "cv-achievements";
export const unlocked = (): AchievementId[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };

export type Toast = { icon: string; title: string; body: string };
export const toast = (t: Toast) => window.dispatchEvent(new CustomEvent<Toast>("cv:toast", { detail: t }));

export const unlock = (id: AchievementId) => {
  if (typeof window === "undefined") return;
  const got = unlocked();
  if (got.includes(id)) return;
  got.push(id);
  try { localStorage.setItem(KEY, JSON.stringify(got)); } catch { }
  toast({ icon: "🏆", title: ACHIEVEMENTS[id].name, body: `Achievement unlocked · ${got.length}/${Object.keys(ACHIEVEMENTS).length}` });
};
