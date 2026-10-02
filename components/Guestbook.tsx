"use client";
import { useEffect, useState } from "react";
import { unlock } from "@/lib/achievements";
import s from "./Guestbook.module.css";

// The 2003 guestbook, for real. Visitors leave a line; a "like this site" counter for the shy ones.
type Entry = { name: string; message: string; at: number };

function Book() {
  const [data, setData] = useState<{ likes: number; entries: Entry[] } | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [liked, setLiked] = useState(false);
  useEffect(() => { fetch("/api/guestbook").then((r) => r.json()).then(setData).catch(() => setNote("The guestbook is napping. Try again later.")); }, []);

  const sign = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/guestbook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, message }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setNote(d.error ?? "That didn’t work."); return; }
    setData((x) => x && { ...x, entries: [d.entry, ...x.entries] });
    setMessage(""); setNote("Thank you for signing my guestbook!!! :)");
    unlock("guestbook");
  };
  const like = async () => {
    if (liked) return;
    setLiked(true);
    const d = await fetch("/api/guestbook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ like: true }) }).then((r) => r.json()).catch(() => null);
    if (d) setData((x) => x && { ...x, likes: d.likes });
  };

  return (
    <div className={s.book}>
      <p className={s.banner}><span>★</span> Welcome to my guestbook!!! <span>★</span></p>
      <button type="button" className={s.like} onClick={like} disabled={liked}>♥ {liked ? "Thank you!" : "I like this site"} ({data?.likes ?? 0})</button>
      <form onSubmit={sign} className={s.form}>
        <label>Name <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} required /></label>
        <label>Message <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={140} required rows={2} /></label>
        <button type="submit">Sign the guestbook</button>
        {note && <p className={s.note}>{note}</p>}
      </form>
      <ul className={s.entries}>
        {data?.entries.map((e, i) => (
          <li key={i}><b>{e.name}</b> <small>{new Date(e.at).toLocaleDateString()}</small><p>{e.message}</p></li>
        ))}
        {data && !data.entries.length && <li>No entries yet. Be the first, it’s very 2003.</li>}
      </ul>
    </div>
  );
}

// The button shows only once the database answers, so nobody opens an empty, broken guestbook.
export default function GuestbookButton({ open }: { open: (label: string, body: React.ReactNode) => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { fetch("/api/guestbook").then((r) => r.json()).then((d) => setReady(Boolean(d.ready))).catch(() => { }); }, []);
  if (!ready) return null;
  return <button type="button" className={s.open} onClick={() => open("Guestbook", <Book />)}>✍ Sign my guestbook</button>;
}
