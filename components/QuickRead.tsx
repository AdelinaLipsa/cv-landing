"use client";
import { useEffect } from "react";
import { certifications, profile } from "@/content/cv";
import { unlock } from "@/lib/achievements";
import s from "./QuickRead.module.css";

// "Skip the cutscene": the whole CV in 30 seconds, for the busy. Facts only, from content/cv.ts.
const NOW = [
  "Product owner for the payments product: gateways, 3DS/SCA, alternative payment methods, Kount",
  "Product manager for the core engineering team: PRDs, standups, weekly reporting, the change log",
  "Manager of the technical support team: pixels, postbacks, parameters, APIs, checkout",
  "With the head of customer support: I code their automations and run their statistics",
];
const PROOF = [
  "Own the 3DS/SCA rollout across thousands of accounts, and measured what it did to conversion",
  "Built the reporting pipeline that replaced a 1.5 to 2 hour manual daily report",
  "Built BITE, the Chrome extension the affiliate managers team uses daily",
  "Full-stack developer since 2020: React and TypeScript, Laravel, Vue, Rails, Node; Tech Lead at Fabel X; Ubisoft",
];

export default function QuickRead({ contact }: { contact: () => void }) {
  useEffect(() => unlock("recruiter"), []);
  return (
    <div className={s.read}>
      <p className={s.lede}><b>{profile.name}</b>, {profile.role}. {profile.roleSecond}</p>
      <h3>Now, at Yomali</h3>
      <ul>{NOW.map((l) => <li key={l}>{l}</li>)}</ul>
      <h3>Proof</h3>
      <ul>{PROOF.map((l) => <li key={l}>{l}</li>)}</ul>
      <p className={s.meta}>{certifications[0]} · {profile.location}</p>
      <p className={s.meta}><b>Looking for:</b> {profile.lookingFor}</p>
      <div className={s.cta}>
        <a href={profile.pdf} download className={`${s.primary} water`}>Download the PDF</a>
        <button type="button" className={`${s.secondary} water`} onClick={contact}>Message me</button>
      </div>
    </div>
  );
}
