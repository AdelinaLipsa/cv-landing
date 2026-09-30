"use client";
import { useEffect, useRef } from "react";
import type { Tile } from "@/content/wall";
import { Accounts25, Flow, MicroFrontends, PaymentsChart, Terminal, WalletPass } from "./Live";
import s from "./wall.module.css";

const LIVE: Record<string, () => React.ReactNode> = {
  payments: () => <PaymentsChart />,
  "three-ds": () => <Accounts25 />,
  "self-refund": () => <Flow steps={["Customer", "Find order", "Pick a reason", "Refund done"]} />,
  "refund-journey": () => <Flow steps={["Find order", "Return or refund", "Done"]} />,
  "voice-escalation": () => <Flow steps={["AI voice agent", "Can’t resolve", "A person"]} />,
  "micro-frontends": () => <MicroFrontends />,
  wallet: () => <WalletPass />,
  hookwarden: () => <Terminal />,
};

// muted, loop, playsInline, preload none, poster. Plays only while at least 50% in view.
function Video({ src }: { src: NonNullable<Tile["video"]> }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current!;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.5 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video ref={ref} className={s.video} muted loop playsInline preload="none" poster={src.poster}>
      <source src={src.webm} type="video/webm" />
      <source src={src.mp4} type="video/mp4" />
    </video>
  );
}

export default function Media({ tile }: { tile: Tile }) {
  if (LIVE[tile.id]) return LIVE[tile.id]();
  if (tile.video) return <Video src={tile.video} />;
  const dark = tile.kind === "video";
  return (
    <div className={`${s.live} ${dark ? (tile.id === "cs-dashboard" ? s.ink2 : s.ink) : s.mist} ${s.placeholder}`}>
      <span>{tile.kind === "video" ? "[recording, demo data]" : "[photo]"}</span>
    </div>
  );
}
