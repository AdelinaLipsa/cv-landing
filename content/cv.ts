// Transcribed from content/Adelina_Lipsa_CV.pdf. Nothing here that isn't on the CV,
// except `about` (the brief's default copy) and fields marked tbc.
// Third-party client names from SiteRocket Labs are left out on purpose.

export type Branch = "dev" | "product";

export const profile = {
  name: "Adelina Lipșa",
  initials: "AL",
  role: "Technical Product Owner",
  roleSecond: "Full-stack developer before that. Still ships code.",
  headline: "Technical Product Owner | Payments, 3DS, Checkout and Chargebacks",
  location: "Bucharest, Romania",
  email: "adelina.lipsa@gmail.com",
  phone: "+40 745 362 663",
  linkedin: "https://linkedin.com/in/adelina-lipsa",
  linkedinHandle: "in/adelina-lipsa",
  whatsapp: "https://wa.me/40745362663?text=" + encodeURIComponent("Hi Adelina, I watched you build your CV. Let’s talk."),
  pdf: "/Adelina_Lipsa_CV.pdf",
  booking: "https://calendly.com/adelina-lipsa/30min",
  lookingFor: "Product roles, full-time or contract. Payments, ops, internal tools. Based in Bucharest.",
};

export const about = [
  "I build the thing that’s missing. Tools, flows, dashboards, and sometimes the clothes I’m wearing. Allergic to letting my tech knowledge expire like milk. Quietly confident, naturally curious, and perpetually improving my chops one shipped thing at a time.",
  "When I’m not shipping, you’ll find me playing video games and eating ramen in the dark like a raccoon with WiFi.",
  "I believe a few lines of code can save the day, that putting milk in before cereal is a federal offense, and that the Oxford comma is non-negotiable.",
];

// Adelina's own words, 2026-09-30.
export const origin = [
  "My first real contact with a computer was in high school, when I started rooting my Windows.",
  "I spent a lot of time emulating the Nintendo and Game Boy games that weren’t available to me. It was my comfort zone.",
];

export type Job = {
  id: string;
  company: string;
  role: string;
  short: string;
  dates: string;
  place: string;
  branch: Branch;
  lines: string[];
  stack: string[];
};

// Newest first, like git log.
export const jobs: Job[] = [
  {
    id: "yomali",
    company: "Yomali",
    role: "Technical Product Owner & Technical Support Team Manager",
    short: "Technical Product Owner",
    dates: "Sep 2025 to now",
    place: "United States",
    branch: "product",
    lines: [
      "Product owner on the payments stack: gateway and acquirer integrations, 3DS/SCA, alternative payment methods, Kount fraud monitoring, chargebacks and disputes.",
      "Showed payment success held at 43–45% from June to August, placing a platform-wide conversion decline before the payment step.",
      "Product manager for the core engineering team and manager of the technical support team. Runs PRDs, standups, weekly reporting and the change log in ClickUp.",
    ],
    stack: ["3DS/SCA", "Kount", "SQL", "Datadog", "ClickUp"],
  },
  {
    id: "siterocket",
    company: "SiteRocket Labs",
    role: "Technical Project Manager",
    short: "Technical Project Manager",
    dates: "Feb to Sep 2025",
    place: "Canada",
    branch: "product",
    lines: [
      "Led delivery for a digital health client at a Boston and Toronto agency, reporting to the CEO and running third-party API integrations and escalations.",
      "Wrote the requirements for automated member eligibility processing in Laravel: per-vendor S3 drops, scheduled SFTP transfers, retries, logging and Slack alerts.",
      "Set up per-vendor AWS S3 folders with IAM policies by hand, and scoped a self-hosted Apple and Google Wallet membership card service.",
    ],
    stack: ["Laravel", "AWS S3", "IAM", "SFTP", "Caspio", "Asana"],
  },
  {
    id: "ubisoft",
    company: "Ubisoft",
    role: "Web Developer",
    short: "Web Developer",
    dates: "Mar to Dec 2024",
    place: "Bucharest, Romania",
    branch: "dev",
    lines: [
      "QA department web developer on the internal platform testers used daily, from game build deployment to testing. Full-stack in Laravel and Vue 2.",
      "Built a micro-frontend architecture: three Vue apps on one page, coordinated by an orchestrator for shared data and events.",
      "Deployed to Kubernetes in production, monitored workloads in Rancher, debugged with Kibana. Gathered requirements directly with QA teams.",
    ],
    stack: ["Laravel", "Vue 2", "Kubernetes", "Rancher", "Kibana"],
  },
  {
    id: "fabelx",
    company: "Fabel X",
    role: "Full-Stack Web Developer and Technical Lead",
    short: "Full-Stack Developer, Tech Lead",
    dates: "Jul 2022 to Feb 2024",
    place: "Cluj, Romania",
    branch: "dev",
    lines: ["Full-stack web developer.", "Technical Lead from Jul 2023 to Dec 2023."],
    stack: [],
  },
  {
    id: "innovational",
    company: "Innovational",
    role: "Full-Stack Web Developer",
    short: "Full-Stack Developer",
    dates: "Dec 2020 to Oct 2021",
    place: "Bucharest, Romania",
    branch: "dev",
    lines: ["Full-stack web developer, alongside AgroCity."],
    stack: [],
  },
  {
    id: "agrocity",
    company: "AgroCity.eu",
    role: "Full-Stack Web Developer",
    short: "Full-Stack Developer",
    dates: "Jul 2020 to Sep 2022",
    place: "Bucharest, Romania",
    branch: "dev",
    lines: ["Joined as Development Intern (Jul to Sep 2020), stayed as a full-stack developer."],
    stack: ["PHP", "Laravel", "Vue.js", "SQL", "TailwindCSS", "Webpack"],
  },
];

// The commit that lands on both branches: tools she still builds herself.
export const stillShipping = {
  id: "still-shipping",
  title: "Still shipping",
  dates: "2025 to now",
  lines: [
    "Builds internal tools hands-on when the team hits a recurring pain point: the CS dashboard, a link and postback decoder, the change log.",
    "Built the reporting pipeline and dashboard that replaced a 1.5 to 2 hour manual daily report.",
    "Built 3DS rollout tracking in ClickUp and analysed 25 accounts to separate the 3DS effect from the wider conversion decline.",
  ],
  stack: ["Dashboards", "SQL", "ClickUp", "JavaScript"],
};

export const ventures = [
  { name: "Ruined Saints", role: "Founder & Creative Director", dates: "Jun 2025 to now", note: "Independent streetwear label." },
  { name: "Bitly Digital", role: "Founder", dates: "Mar 2025 to now", note: "Consulting and custom web development." },
];

export const certifications = [
  "Professional Scrum Product Owner II (PSPO II)",
  "Professional Scrum Product Owner I (PSPO I)",
  "JavaScript Algorithms and Data Structures",
  "Web Development",
];

export const education = [
  { what: "Web Development", where: "The Informal School of IT", when: "2019" },
  { what: "Psychology", where: "Universitatea Titu Maiorescu", when: "2012 to 2015" },
];

export const languages = ["Romanian, native", "English, full professional", "Italian, limited working", "German, elementary"];
