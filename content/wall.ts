// The wall, from the brief's starting list, in the Wall artboard's order.
// Caption format: "Didn't exist: problem. Now: thing." One line each.
// Figures are CV figures only. tbc = waiting on Adelina.

export type Label = "Built" | "Owned" | "Analysed";
export type TileKind = "video" | "live" | "image";
export type Shape = "tall" | "square" | "land";

export type Tile = {
  id: string;
  title: string;
  label: Label;
  kind: TileKind;
  shape: Shape;
  didntExist: string;
  now: string;
  more?: string[];
  href?: string;
  video?: { mp4: string; webm: string; poster: string };
  tbc?: string;
  wide?: boolean; // breaks the grid, full width
};

export const tiles: Tile[] = [
  {
    id: "decoder", title: "Param Decoder", label: "Built", kind: "video", shape: "tall",
    didntExist: "a way to read an affiliate link.", now: "Param Decoder.",
    more: ["A link and postback decoder, built hands-on because the team kept hitting the same pain point."],
    tbc: "public link and recording",
  },
  {
    id: "cs-dashboard", title: "CS dashboard", label: "Built", kind: "video", shape: "square",
    didntExist: "a daily report that didn’t take 1.5 to 2 hours.", now: "a dashboard the CS team uses.",
    more: ["Built the reporting pipeline and dashboard that replaced a 1.5 to 2 hour manual daily report.", "The CS team uses it to track complaints, chargeback threats and cancellation reasons."],
    tbc: "demo-data recording",
  },
  {
    id: "change-log", title: "Checkout change log", label: "Built", kind: "video", shape: "land",
    didntExist: "one view of what changed, and when.", now: "a change log in ClickUp.",
    more: ["Part of running PRDs, standups and weekly reporting end-to-end in ClickUp.", "Gives leadership one view of dependencies, risks and timelines."],
    tbc: "demo-data recording",
  },
  {
    id: "hookwarden", title: "Hookwarden", label: "Built", kind: "live", shape: "tall",
    didntExist: "a quick check of webhook signature handling.", now: "Hookwarden.",
    more: ["A webhook security scanner."],
    tbc: "not on the current CV, confirm it can be shown and add the repo link",
  },
  {
    id: "payments", title: "Payment success held", label: "Analysed", kind: "live", shape: "land", wide: true,
    didntExist: "a clear answer to where conversion fell.", now: "the drop sat before payment.",
    more: ["Analysed payment performance across gateways with Datadog, log data and SQL.", "Payment success held at 43–45% from June to August, placing a platform-wide conversion decline before the payment step."],
  },
  {
    id: "micro-frontends", title: "Three Vue apps, one page", label: "Built", kind: "live", shape: "square",
    didntExist: "one place for testers to find everything.", now: "three Vue apps on one page.",
    more: ["Ubisoft QA platform: a micro-frontend architecture of three Vue apps on one page, coordinated by an orchestrator for shared data and events.", "Generic diagram, no Ubisoft UI."],
  },
  {
    id: "wallet", title: "Wallet membership cards", label: "Owned", kind: "live", shape: "tall",
    didntExist: "member cards in Apple and Google Wallet.", now: "a self-hosted card service, scoped.",
    more: ["Scoped a self-hosted Apple Wallet and Google Wallet membership card service, branded per client, keeping member data in-house.", "Wrote the engineering estimation brief. Generic branding here."],
  },
  {
    id: "self-refund", title: "Self-service refunds", label: "Owned", kind: "live", shape: "land",
    didntExist: "a refund without a multi-day email thread.", now: "one self-service flow, in testing.",
    more: ["Proposed a single self-service refund flow to replace a multi-day email process. Now in testing."],
  },
  {
    id: "ruined-saints", title: "Ruined Saints", label: "Built", kind: "image", shape: "tall",
    didntExist: "an independent streetwear label.", now: "Ruined Saints, since Jun 2025.",
    more: ["Founder and creative director."],
    tbc: "renders",
  },
  {
    id: "three-ds", title: "What moved conversion", label: "Analysed", kind: "live", shape: "square",
    didntExist: "a way to tell the 3DS effect from the wider decline.", now: "3DS tracking across 25 accounts.",
    more: ["Built 3DS rollout tracking in ClickUp and analysed 25 accounts to separate the 3DS effect from the wider conversion decline.", "Fully anonymised. The grid is the 25 accounts, not their data."],
  },
  {
    id: "refund-journey", title: "Refund and return journey", label: "Owned", kind: "live", shape: "land",
    didntExist: "a customer finding their own order.", now: "Find Order.",
    more: ["Product owner for the refund and return journey, Find Order."],
  },
  {
    id: "voice-escalation", title: "AI voice agent, human escalation", label: "Owned", kind: "live", shape: "square",
    didntExist: "a clean handover from the AI agent to a person.", now: "a human escalation protocol.",
    more: ["Product owner for the human escalation protocol for the AI voice agent."],
  },
  {
    id: "sewing", title: "Sewing projects", label: "Built", kind: "image", shape: "square",
    didntExist: "the clothes I wanted.", now: "clothes I made.",
    tbc: "photos",
  },
  { id: "bite", title: "BITE Chrome extension", label: "Built", kind: "video", shape: "land", didntExist: "", now: "", tbc: "not on the current CV, confirm what it is and whether it can be shown" },
  { id: "sites", title: "My own sites", label: "Built", kind: "video", shape: "land", didntExist: "", now: "", tbc: "which sites are still live" },
];
