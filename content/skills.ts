// The whole stack, top to bottom: the CV's SKILLS section, group for group, in its own words.
// Left out on purpose: micro-frontends (the Ubisoft architecture predates her).
// Added in her own words (2026-10-01): Grafana and Jira, used at Ubisoft; Hookwarden's stack from its repo (Astro, Vitest, AST parsing, MCP, GitHub Actions, package publishing); iOS, Android, store publishing and Tailwind UI at AgroCity;
// Ruby on Rails, TypeScript, Vue.js, Node.js, Next.js, .NET, Docker and technical leadership at Fabel X; SOPs at Yomali (it owns BuyGoods); Figma.
// Payments (her words, 2026-10-19): about 1% of her work. She writes the specs from the CRO’s documents and the devs build them, so the layer
// holds only that, plus Param Decoder’s decline codes (her repo). Nothing beyond that. Moved down the stack to match its weight.
// Zendesk (2026-10-01, 2026-10-19): she turned the AI agents’ calls into scenarios and tested them against it; Zendesk's AI
// agent builder (2026-10-19): she built workflows in it for all of Yomali’s SOPs and documents.
export const layers = [
  { name: "Product Management", chips: ["Product ownership", "Backlog management", "Requirements gathering", "PRDs", "SOPs", "Stakeholder management", "Cross-functional delivery", "Vendor evaluation", "Cost modelling", "Business plans", "Technical leadership"] },
  { name: "Agile Delivery", chips: ["Scrum", "Agile", "Standups", "Dependency & risk tracking", "Change management", "Status reporting"] },
  { name: "Analytics", chips: ["SQL", "Datadog", "Kibana", "Grafana", "Log analysis", "Approval & decline analysis", "Checkout conversion", "Dashboards & reporting"] },
  { name: "Development", chips: ["PHP", "Laravel", "JavaScript", "TypeScript", "Vue.js", "React", "Next.js", "Node.js", "Ruby on Rails", ".NET", "Python", "HTML", "CSS", "TailwindCSS", "Tailwind UI", "Webpack", "REST APIs", "Webhooks", "Capacitor", "iOS (Xcode)", "Android", "Electron", "Astro", "Vitest", "AST parsing (Babel, tree-sitter)", "MCP servers"] },
  { name: "DevOps and Cloud", chips: ["Docker", "Kubernetes", "Rancher", "AWS (S3, IAM, Lambda)", "SFTP", "Git", "GitLab", "Production deployments", "App Store & Google Play publishing", "Secrets management", "GitHub Actions", "Package publishing (npm, PyPI, Homebrew)"] },
  { name: "Payments", chips: ["Payment integration specs", "Decline codes (Stripe, Braintree, NMI)"] },
  { name: "Tools", chips: ["Figma", "Jira", "ClickUp", "Asana", "Caspio", "Factorial", "Zendesk", "Zendesk AI agent builder"] },
] as const;

type Chip = (typeof layers)[number]["chips"][number];

// Pick a role or a project: the chips it used light up. Every link is a line on the CV (or, for
// Hookwarden and BITE, in their own repos). If it isn't written down, it isn't lit.
export type Thing = { id: string; label: string; used: Chip[] };

export const things: Thing[] = [
  {
    id: "all",
    label: "Everything",
    used: [],
  },
  {
    id: "yomali",
    label: "Yomali",
    used: [
      "Product ownership", "Backlog management", "Requirements gathering", "PRDs", "SOPs", "Stakeholder management", "Cross-functional delivery", "Vendor evaluation", "Cost modelling", "Business plans",
      "Standups", "Dependency & risk tracking", "Change management", "Status reporting",
      "Payment integration specs",
      "SQL", "Datadog", "Log analysis", "Approval & decline analysis", "Checkout conversion", "Dashboards & reporting",
      "ClickUp", "Factorial", "Zendesk", "Zendesk AI agent builder",
    ],
  },
  {
    id: "siterocket",
    label: "SiteRocket Labs",
    used: ["Requirements gathering", "Stakeholder management", "Cross-functional delivery", "AWS (S3, IAM, Lambda)", "SFTP", "Asana", "Caspio"],
  },
  {
    id: "ubisoft",
    label: "Ubisoft",
    used: ["Requirements gathering", "PHP", "Laravel", "JavaScript", "Vue.js", "Kibana", "Grafana", "Kubernetes", "Rancher", "Production deployments", "Secrets management", "Jira"],
  },
  {
    id: "fabelx",
    label: "Fabel X",
    used: ["React", "TypeScript", "Ruby on Rails", "Vue.js", "Node.js", "Next.js", ".NET", "JavaScript", "Docker", "Technical leadership"],
  },
  {
    id: "agrocity",
    label: "AgroCity",
    used: ["PHP", "Laravel", "Vue.js", "SQL", "TailwindCSS", "Tailwind UI", "Webpack", "Capacitor", "iOS (Xcode)", "Android", "App Store & Google Play publishing"],
  },
  {
    id: "hookwarden",
    label: "Hookwarden",
    used: ["TypeScript", "JavaScript", "Node.js", "Python", "Webhooks", "AST parsing (Babel, tree-sitter)", "MCP servers", "Vitest", "Astro", "TailwindCSS", "Git", "GitHub Actions", "Package publishing (npm, PyPI, Homebrew)"],
  },
  {
    id: "bite",
    label: "BITE",
    used: ["JavaScript"],
  },
];
