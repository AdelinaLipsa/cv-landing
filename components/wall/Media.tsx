"use client";
import { useEffect, useRef } from "react";
import { useInView } from "motion/react";
import type { Tile } from "@/content/wall";
import { BiteDemo, ChangeLogDemo, Checkout, DecoderDemo, Flow, Gateways, MobileApp, Terminal, ThisSite } from "./Live";

// A screen recording: plays by itself whenever it's on screen, pauses when scrolled away.
function Recording({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const on = useInView(ref, { amount: 0.3 });
  useEffect(() => { const v = ref.current; if (v) { if (on) v.play().catch(() => {}); else v.pause(); } }, [on]);
  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" aria-label={label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", background: "#000" }} />;
}

// Every Work tile is a live demo drawn in code, or a recording of the real thing.
const LIVE: Record<string, () => React.ReactNode> = {
  bite: () => <BiteDemo />,
  hookwarden: () => <Terminal />,
  decoder: () => <DecoderDemo />,
  mobile: () => <MobileApp />,
  "this-site": () => <ThisSite />,
  gateways: () => <Gateways />,
  apms: () => <Checkout />,
  "change-log": () => <ChangeLogDemo />,
  "ruined-saints": () => <Recording src="/media/ruined-saints.mp4" poster="/media/ruined-saints.jpg" label="The Ruined Saints site: the PRAY? gate, then the hero" />,
  pipeline: () => <Flow steps={["Vendor file → S3", "Laravel job, with retries", "SFTP to the partner", "Results → Caspio · Slack alert"]} accent="var(--broth)" />,
};

export default function Media({ tile }: { tile: Tile }) {
  return LIVE[tile.id]?.() ?? null;
}
