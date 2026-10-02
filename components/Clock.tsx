"use client";
import { useEffect } from "react";
import { toast, unlock } from "@/lib/achievements";

// The site knows what time it is for you, and says something about it once per visit.
// Midnight to 5am also turns the lights off before first paint (layout's GATE script), unless you chose a theme.
export default function Clock() {
  useEffect(() => {
    try { if (sessionStorage.getItem("cv-clock")) return; sessionStorage.setItem("cv-clock", "1"); } catch { }
    const now = new Date(), h = now.getHours(), day = now.getDay();
    const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const note =
      h < 5 ? { icon: "🍜", title: `${time}? Respect.`, body: "Dark mode, on the house. Ramen is optional." }
      : day === 6 || day === 0 ? { icon: "📅", title: `Job hunting on a ${day === 6 ? "Saturday" : "Sunday"}?`, body: "Same energy. Let’s talk on Monday." }
      : day === 5 && h >= 17 ? { icon: "🍻", title: "Friday evening, and you’re here.", body: "This is either dedication or a very good CV." }
      : h >= 22 ? { icon: "🌙", title: "Late one?", body: "Try the dark mode, top right." }
      : null;
    const id = setTimeout(() => {
      if (h < 5) unlock("night");
      if (note) toast(note);
    }, 2500);
    return () => clearTimeout(id);
  }, []);
  return null;
}
