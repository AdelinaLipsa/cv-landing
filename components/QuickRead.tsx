"use client";
import { useEffect } from "react";
import { certifications, profile } from "@/content/cv";
import { unlock } from "@/lib/achievements";
import s from "./QuickRead.module.css";

// "Skip the cutscene": the whole CV in 30 seconds, for the busy. Facts only, from content/cv.ts.
// Her own words, 2026-10-19: she works closely with the founder on whatever is needed and makes sure it gets delivered and works.
// Payments is about 1% of it: she writes specs, the devs build.
const NOW = [
  "Working closely with the founder on whatever is needed, and making sure it gets delivered and actually works",
  "Product manager for the core engineering team: PRDs, standups, weekly reporting, the change log",
  "Manager of the technical support team: pixels, postbacks, parameters, APIs, checkout",
  "Reworked the customer support department; with its head, I code the automations and run the statistics",
  "From the start: wrote the team’s training documents and brought them in, and moved HR from spreadsheets to Factorial",
  "Writing the specs for payments work, then delivery with the devs",
];
const PROOF = [
  "Built BITE, the Chrome extension the affiliate managers team uses daily",
  "Built the reporting pipeline that replaced a 1.5 to 2 hour manual daily report",
  "Built Param Decoder: BuyGoods links, postbacks, and about 190 decline codes, checked in the browser",
  "Full-stack developer since 2020: React with TypeScript, Laravel, Vue, Rails, and Node. Tech Lead at Fabel X, web developer at Ubisoft",
];

export default function QuickRead({ contact }: { contact: () => void }) {
  useEffect(() => unlock("recruiter"), []);
  return (
    <div className={s.read}>
      <p className={s.lede}><b>{profile.name}</b>, {profile.role}. {profile.roleSecond}</p>
      <h3>Now, at Yomali: I own every gap</h3>
      <ul>{NOW.map((l) => <li key={l}>{l}</li>)}</ul>
      <h3>Proof</h3>
      <ul>{PROOF.map((l) => <li key={l}>{l}</li>)}</ul>
      <p className={s.meta}>{certifications[0]} · {profile.location}</p>
      <p className={s.meta}><b>Looking for:</b> {profile.lookingFor}</p>
      <div className={s.cta}>
        <a href={profile.pdf} download className={s.primary}>Download the PDF</a>
        <button type="button" className={s.secondary} onClick={contact}>Message me</button>
      </div>
    </div>
  );
}
