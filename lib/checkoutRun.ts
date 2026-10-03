// Break my checkout: a payment run as a timeline of events, so the card can replay it one beat at a time.
// One thing goes wrong at one step: it either recovers (the run goes on) or stops safely (the run ends).
export type Fail = { step: number; code: string; recover?: string; stop?: string };

// The run as a timeline of events; `at` is how many have happened. A step goes now → done, or now → failed → recovered.
export type Event = { step: number; to: "now" | "failed" | "recovered" };
export function timeline(count: number, fail: Fail | null): Event[] {
  const ev: Event[] = [];
  for (let i = 0; i < count; i++) {
    ev.push({ step: i, to: "now" });
    if (fail?.step !== i) continue;
    ev.push({ step: i, to: "failed" });
    if (!fail.recover) break;
    ev.push({ step: i, to: "recovered" });
  }
  return ev;
}
export type State = "todo" | "now" | "done" | "failed" | "recovered";
export function states(count: number, ev: Event[], at: number): State[] {
  const st: State[] = Array(count).fill("todo");
  for (const e of ev.slice(0, at)) {
    st.forEach((v, i) => { if (v === "now" && i !== e.step) st[i] = "done"; }); // reaching a new step finishes the last
    st[e.step] = e.to;
  }
  if (at >= ev.length) st.forEach((v, i) => { if (v === "now") st[i] = "done"; });
  return st;
}
