// The Work page: twelve pieces in two sections, things she built and products she owns, each a live demo drawn in code (wall/Live.tsx), a title,
// and one plain sentence. Facts are from the CV, her repos, or her own words. tbc = waiting on Adelina.

export type Section = "built" | "owned";

export type Tile = {
  id: string;
  title: string;
  blurb: string; // one plain sentence: what it is
  outcome?: string; // one plain sentence: what happened because of it. Only sourced facts.
  section: Section;
  more?: string[]; // the viewer's details
  links?: { label: string; href: string }[]; // public places to see it: the live thing, its code. Only real, public URLs.
  tbc?: string;
  // The tile takes the shape of the thing: a browser window, a terminal, an extension popup, a phone.
  // No form = a plain card. `chrome` is the text in the window's title bar.
  form?: "window" | "terminal" | "popup" | "phone";
  chrome?: string;
};

export const sections: { id: Section; title: string; lede: string }[] = [
  { id: "built", title: "Things that didn’t exist", lede: "Until I built them, at work and after it." },
  { id: "owned", title: "Products I own", lede: "Payments and delivery: what ships, in what order, and how it performs." },
];

export const tiles: Tile[] = [
  {
    id: "bite", form: "popup", title: "BITE", section: "built",
    blurb: "A Chrome extension that checks BuyGoods tracking on any page and skips sales videos to the checkout links.",
    outcome: "The whole affiliate managers team uses it every day.",
    more: [
      "BITE is BuyGoods Internal Tools: one Chrome extension, two tools. The Tracking Checker says whether BuyGoods tracking is on the page you’re viewing: present, missing or uncertain.",
      "It catches what DevTools makes you hunt for: scripts injected after load, trackers that remove themselves, pixels and beacons that never touch the DOM, even obfuscated inline code. Read-only, and nothing leaves the browser.",
      "Its sibling, VSL Skipper, skips sales videos and grabs the checkout links, with a review mode for QA-ing a video without watching it whole.",
      "The whole affiliate managers team uses it every day.",
    ],
  },
  {
    id: "hookwarden", form: "terminal", chrome: "zsh · hookwarden", title: "Hookwarden", section: "built",
    blurb: "Open-source CLI that finds webhook signature bugs across 21 providers.",
    more: [
      "A local CLI that finds webhook signature-verification bugs: 21 providers, 11 rule classes, 15 frameworks, in JS/TS, Python, PHP and Go.",
      "Every handler gets a verdict: verified, not-verified or manual-review, with the file, the line and a fix. It can apply the fix, and outputs SARIF for CI.",
      "Built as a TypeScript monorepo (pnpm): Babel and tree-sitter parsing, an autofix engine, a GitHub Action that comments on pull requests, an MCP server for AI assistants, and a pre-commit hook.",
      "Tested with Vitest and property-based fast-check, linted with Biome, architecture checked by dependency-cruiser. CI scans 45 open-source projects every week.",
      "Ships on npm, PyPI, Homebrew, Scoop and winget, plus standalone binaries. Docs and site in Astro. Apache 2.0, nothing leaves your machine."
    ],
    links: [{ label: "See the code", href: "https://github.com/Hookwarden/hookwarden" }], // hookwarden.dev was down (Cloudflare 522) on 2026-10-03
  },
  {
    id: "decoder", form: "window", chrome: "param-decoder", title: "Param Decoder", section: "built",
    blurb: "Reads, checks and fixes BuyGoods links, postbacks and decline codes, all in the browser.",
    more: [
      "Five modes. Inspect explains every parameter of a link, reads the funnel from its path, decodes Base64 redirects, catches typo'd params and hands back a clean link and a ticket-ready diagnosis.",
      "Compare shows why one link tracks and another doesn't. Batch audits a column of links, pass or fail, with CSV export. Postback generates a paste-ready postback for 8 trackers, Voluum to ClickMagick, with BuyGoods tokens mapped.",
      "Decline explains about 190 Stripe, Braintree and NMI decline codes, each sourced from the processor's own docs: soft or hard, and whether to retry.",
      "Nothing you paste leaves the browser, so live links are safe to paste.",
    ],
    links: [{ label: "Open it", href: "https://adelinalipsa.github.io/param-decoder/" }, { label: "See the code", href: "https://github.com/AdelinaLipsa/param-decoder" }],
  },
  {
    id: "change-log", form: "window", chrome: "change log", title: "Change log", section: "built",
    blurb: "What changed and when, in one place. I built it in ClickUp.",
    outcome: "Leadership gets one view of dependencies, risks and timelines.",
    more: ["Part of running PRDs, standups and weekly reporting end-to-end in ClickUp.", "Gives leadership one view of dependencies, risks and timelines."],
  },
  {
    id: "support-flows", form: "terminal", chrome: "support-flows", title: "Customer support automations", section: "built",
    blurb: "I code the automations behind customer support’s flows, from the AI voice agent’s call to Zendesk.",
    more: [
      "With the head of customer support, I code the automations behind their flows. When an AI voice agent call ends, my automation maps it and sends it to Zendesk, routed to a person when it needs one.",
      "I test the AI voice agents’ calls with call scenarios, end to end, until each one lands in Zendesk the way it should.",
      "I also run customer support’s statistics.",
      "Demo run, demo data.",
    ],
  },
  {
    id: "declines", form: "window", chrome: "declines · Datadog", title: "Where declines come from", section: "built",
    blurb: "I run the analysis in Datadog, log data and SQL to find the source of a decline rate.",
    more: [
      "I analyse payment performance across the gateways in Datadog, log data and SQL: approval rates, declines, and checkout conversion.",
      "The question each time: where does this decline rate come from? I break it down by gateway, by decline code, and by 3DS until one source stands out.",
      "Demo dashboard, demo numbers.",
    ],
  },
  {
    id: "mobile", form: "phone", title: "AgroCity on phones", section: "built",
    blurb: "The app on iOS and Android with Capacitor, published to both stores.",
    more: ["Took the AgroCity app mobile with Capacitor: iOS builds in Xcode, Android builds, and publishing to the App Store and Google Play."],
  },
  {
    id: "this-site", form: "window", chrome: "this site", title: "This CV", section: "built",
    blurb: "Built from scratch in Next.js, with a Web Audio lofi and a git-graph career.",
    more: ["Next.js 16, React 19 and TypeScript, animated with motion, GSAP and three.js, plus React Bits components restyled to fit.", "The lofi is made live with Web Audio, no audio files. The career is a git graph. The whole CV is JSON at /api/cv."],
    links: [{ label: "See the code", href: "https://github.com/AdelinaLipsa/cv-landing" }],
  },
  {
    id: "ruined-saints", form: "window", chrome: "ruined saints", title: "Ruined Saints", section: "built",
    blurb: "My streetwear label, and the store I built for it.",
    more: ["The store runs on Next.js, with Medusa for commerce and Meilisearch for search. This is its gate and hero."],
  },
  {
    id: "gateways", title: "Gateway routing", section: "owned",
    blurb: "Chase Paymentech, NMI, Braintree, PayPal and Stripe, plus 3DS/SCA.",
    outcome: "The 3DS/SCA rollout spans thousands of accounts, with tracking I built in ClickUp.",
    more: ["Product owner for the gateway and acquirer integrations: Chase Paymentech, NMI, Braintree, PayPal and Stripe. I decide what ships, spec it, deliver it, and track approval rates and declines across them.", "I own the 3DS/SCA rollout across thousands of accounts, and analysed a 25-account sample to separate its effect."],
  },
  {
    id: "apms", form: "phone", title: "Ways to pay", section: "owned",
    blurb: "Paze, PayPal Pay Later and Amazon Pay at checkout.",
    more: ["I own the alternative payment methods: Paze, PayPal Pay Later and Amazon Pay.", "Demo checkout, demo amount."],
  },
  {
    id: "pipeline", title: "Eligibility pipeline", section: "owned",
    blurb: "Member files from S3 to SFTP to Caspio, with retries and Slack alerts. I wrote the requirements and built the Caspio side.",
    more: ["Wrote the requirements for automated member eligibility processing in Laravel: per-vendor S3 drops, scheduled SFTP transfers, results written back to Caspio, with retries, logging and Slack alerts.", "Built the Caspio side myself, and set up the per-vendor S3 folders and IAM policies."],
  },
];
