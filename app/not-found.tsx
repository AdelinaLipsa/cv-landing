import Link from "next/link";
import FuzzyText from "@/components/FuzzyText";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 24, textAlign: "center" }}>
      <FuzzyText fontSize="clamp(5rem, 22vw, 12rem)" fontWeight={700} color="#17153A" baseIntensity={0.12} hoverIntensity={0.4}>404</FuzzyText>
      <p style={{ fontSize: 18, color: "var(--body-2)", maxWidth: 360 }}>This page doesn’t exist yet either. I haven’t been annoyed by its absence enough to build it.</p>
      <Link href="/" style={{ fontWeight: 600, textUnderlineOffset: 4 }}>Back to the one that does</Link>
    </main>
  );
}
