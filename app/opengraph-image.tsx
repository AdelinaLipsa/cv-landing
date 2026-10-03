import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { font } from "@/lib/ogFont";

// The link preview for WhatsApp, LinkedIn, Slack. Rendered once at build time.
export const alt = "Adelina Lipșa, Technical Product Owner. It didn’t exist, so I built it.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const name = "Adelina Lipșa";
  const line = "It didn’t exist, so I built it.";
  const role = "Technical Product Owner. Also a full-stack developer, still shipping code.";
  const photo = `data:image/jpeg;base64,${readFileSync(join(process.cwd(), "public/adelina.jpg")).toString("base64")}`;
  const [display, body] = await Promise.all([
    font("Anybody", "wdth,wght@125,700", name + line),
    font("Figtree", "wght@600", role),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#F7F6FB", color: "#17153A", backgroundImage: "linear-gradient(rgba(51,85,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(51,85,255,0.05) 1px, transparent 1px)", backgroundSize: "32px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <img src={photo} width={132} height={132} style={{ borderRadius: 36 }} alt="" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontFamily: "Anybody", fontSize: 72, letterSpacing: "-0.03em" }}>{name}</div>
            <div style={{ fontFamily: "Figtree", fontSize: 28, color: "#6B6990" }}>{role}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: "#17153A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 30, height: 30, borderRadius: 15, background: "#F5B53F" }} />
          </div>
          <div style={{ fontFamily: "Anybody", fontSize: 56, letterSpacing: "-0.03em" }}>{line}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        ...(display ? [{ name: "Anybody", data: display, weight: 700 as const }] : []),
        ...(body ? [{ name: "Figtree", data: body, weight: 600 as const }] : []),
      ],
    }
  );
}
