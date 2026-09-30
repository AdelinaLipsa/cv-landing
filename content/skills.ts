// The whole stack, top to bottom. Chips come from the CV's skills section.
export const layers = [
  { name: "Product", chips: ["PRDs", "Backlog", "Requirements", "Stakeholders", "Vendors", "Team lead", "Payments"] },
  { name: "Frontend", chips: ["JavaScript", "Vue", "React", "Next.js", "TailwindCSS", "Micro-frontends"] },
  { name: "Backend", chips: ["PHP", "Laravel", "Python", "REST APIs", "Webhooks"] },
  { name: "Data", chips: ["SQL", "Datadog", "Kibana", "Dashboards"] },
  { name: "Infra", chips: ["Docker", "Kubernetes", "Rancher", "AWS", "GitLab", "SFTP"] },
] as const;

export type Thing = { id: string; label: string; built: string[]; specced: string[]; note: string; tbc?: string };

export const things: Thing[] = [
  {
    id: "all",
    label: "Everything",
    built: [],
    specced: [],
    note: "Five layers, one person. The product layer sits on top because that’s the job now. The rest is why the specs are good.",
  },
  {
    id: "ubisoft",
    label: "Ubisoft QA platform",
    built: ["JavaScript", "Vue", "PHP", "Laravel", "Micro-frontends", "Kubernetes", "Rancher", "Kibana"],
    specced: ["Requirements"],
    note: "The internal platform Ubisoft testers used daily. Built full-stack, shipped to Kubernetes, requirements gathered with the QA teams.",
  },
  {
    id: "eligibility",
    label: "Eligibility pipeline",
    built: ["AWS"],
    specced: ["Requirements", "Stakeholders", "Vendors", "Laravel", "SFTP"],
    note: "SiteRocket Labs: set up the per-vendor S3 folders and IAM policies by hand, wrote the Laravel pipeline requirements, ran the vendor escalations.",
  },
  {
    id: "decoder",
    label: "Param Decoder",
    built: ["JavaScript"],
    specced: [],
    note: "A link and postback decoder, built hands-on because the team kept hitting the same pain point.",
    tbc: "which stack it uses",
  },
  {
    id: "payments",
    label: "Payment analysis",
    built: ["SQL", "Datadog", "Dashboards"],
    specced: ["Payments"],
    note: "Yomali: showed payment success held at 43–45% from June to August, so the conversion decline sat before the payment step.",
  },
];
