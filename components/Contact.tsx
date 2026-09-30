"use client";
import { useCalm } from "@/lib/useCalm";
import { profile } from "@/content/cv";
import p from "./panes/pane.module.css";
import s from "./Contact.module.css";
import Magnet from "./Magnet";

const Icon = ({ d }: { d: React.ReactNode }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

export const WhatsAppIcon = ({ color = "currentColor", size = 22 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.5 11.6a8.4 8.4 0 0 1-12.3 7.4L3.5 20.5l1.5-4.6A8.4 8.4 0 1 1 20.5 11.6z" />
  </svg>
);

export const LinkedInIcon = () => (
  <Icon d={<><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></>} />
);

export default function Contact() {
  const reduce = useCalm();
  return (
    <div className={s.contact}>
      <h2 className={s.h}>Let’s talk.</h2>
      <p className={p.lede}>{profile.lookingFor}</p>

      <div className={`${p.spec} ${s.waWrap}`} style={{ "--r": "999px" } as React.CSSProperties}>
        <span className={p.specLabel} style={{ left: 12, top: -28 }}>the one to press</span>
        <Magnet padding={60} magnetStrength={4} disabled={!!reduce}>
          <a href={profile.whatsapp} className={s.wa} target="_blank" rel="noopener">
            <WhatsAppIcon color="var(--broth)" />
            Message me on WhatsApp
          </a>
        </Magnet>
      </div>
      <p className={s.hint}>Opens WhatsApp with a first line already written. You only press send.</p>

      <div className={s.rows}>
        <a className={s.row} href={profile.booking} target="_blank" rel="noopener">
          <span><b>Book a call</b><small>30 minutes, on Calendly</small></span>
          <Icon d={<><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>} />
        </a>
        <a className={s.row} href={`mailto:${profile.email}?subject=${encodeURIComponent("Your CV site")}`}>
          <span><b>Email</b><small>{profile.email}</small></span>
          <Icon d={<><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="m4 7 8 6 8-6" /></>} />
        </a>
        <a className={s.row} href={profile.linkedin} target="_blank" rel="noopener">
          <span><b>LinkedIn</b><small>{profile.linkedinHandle}</small></span>
          <LinkedInIcon />
        </a>
      </div>
    </div>
  );
}
