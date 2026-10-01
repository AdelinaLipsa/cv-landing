import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Tab icon: her photo, round. Rendered once at build time.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  const photo = `data:image/jpeg;base64,${readFileSync(join(process.cwd(), "public/adelina.jpg")).toString("base64")}`;
  return new ImageResponse(<img src={photo} width={64} height={64} style={{ borderRadius: "50%" }} alt="" />, size);
}
