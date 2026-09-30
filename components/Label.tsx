import type { Label as Kind } from "@/content/wall";

const DOT: Record<Kind, string> = { Built: "var(--broth)", Owned: "var(--naruto)", Analysed: "var(--blueprint)" };

export default function Label({ kind }: { kind: Kind }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--steam)" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: DOT[kind] }} aria-hidden="true" />
      {kind}
    </span>
  );
}
