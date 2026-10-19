"use client";
import type { Tile } from "@/content/wall";
import { Clip } from "./Film";
import DecoderFilm from "./DecoderFilm";
import { BiteFilm, ChangeLogFilm, CheckoutFilm, DeclinesFilm, GatewaysFilm, HookwardenFilm, MobileFilm, PipelineFilm, SupportFilm, ThisSiteFilm } from "./films";

// Every Work tile is a film: the tool in use, drawn in code (films.tsx, DecoderFilm.tsx), or a recording of the
// real thing. In the grid they play on hover; in the viewer (full) they play with controls.
const FILMS: Record<string, (full?: boolean) => React.ReactNode> = {
  bite: (full) => <BiteFilm full={full} />,
  hookwarden: (full) => <HookwardenFilm full={full} />,
  decoder: (full) => <DecoderFilm full={full} />,
  mobile: (full) => <MobileFilm full={full} />,
  "this-site": (full) => <ThisSiteFilm full={full} />,
  gateways: (full) => <GatewaysFilm full={full} />,
  apms: (full) => <CheckoutFilm full={full} />,
  "change-log": (full) => <ChangeLogFilm full={full} />,
  "support-flows": (full) => <SupportFilm full={full} />,
  declines: (full) => <DeclinesFilm full={full} />,
  "ruined-saints": (full) => <Clip src="/media/ruined-saints.mp4" poster="/media/ruined-saints.webp" length={12.4} full={full} label="The Ruined Saints site: the PRAY? gate, then the hero" />,
  pipeline: (full) => <PipelineFilm full={full} />,
};

export default function Media({ tile, full }: { tile: Tile; full?: boolean }) {
  return FILMS[tile.id]?.(full) ?? null;
}
