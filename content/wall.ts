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
  image?: { src: string; alt: string };
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
    didntExist: "a fast way to find webhook-verification bugs.", now: "Hookwarden, open source.",
    more: ["A local CLI that finds webhook signature-verification bugs across 21 providers, in JS/TS, Python, PHP and Go.", "Three-state verdicts, and nothing leaves your machine. Ties straight into the payments and fraud work."],
    href: "https://github.com/Hookwarden/hookwarden",
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
    didntExist: "the streetwear label I wanted, and a store to sell it.", now: "Ruined Saints, store included.",
    more: ["Founder and creative director since Jun 2025. Drop-based apparel and fragrance; this is MIR, from Drop One.", "Built the store end to end: Next.js storefront, Medusa v2 backend and admin, Stripe, Sameday and DHL shipping, Resend email."],
    image: { src: "/wall/ruined-saints.jpg", alt: "MIR, a Ruined Saints fragrance bottle on dark linen" },
    tbc: "store isn’t live yet: ruinedsaints.com shows a parking page",
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
  {
    id: "bite", title: "Tracking checker, a Chrome extension", label: "Built", kind: "video", shape: "land",
    didntExist: "a way to check tracking without opening DevTools.", now: "a Chrome extension: present, missing or uncertain.",
    more: ["Checks whether the tracking code is on the page, including code injected later, and says present, missing or uncertain.", "Built hands-on for the team, alongside a video-skipping tool. An internal tool, so it’s shown generically."],
    tbc: "demo-data recording",
  },
  { id: "sites", title: "My own sites", label: "Built", kind: "video", shape: "land", didntExist: "", now: "", tbc: "which sites are still live" },
];
