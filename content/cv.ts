// Transcribed from content/Adelina_Lipsa_CV.pdf. Nothing here that isn't on the CV,
// except `about` (the brief's default copy) and fields marked tbc.
// Third-party client names from SiteRocket Labs are left out on purpose.

export type Branch = "dev" | "product";

export const profile = {
  name: "Adelina Lipșa",
  initials: "AL",
  role: "Technical Product Owner",
  roleSecond: "Also a full-stack developer, still shipping code.",
  headline: "Technical Product Owner | Payments, 3DS, Checkout and Chargebacks",
  location: "Bucharest, Romania",
  email: "adelina.lipsa@gmail.com",
  phone: "+40 745 362 663",
  linkedin: "https://linkedin.com/in/adelina-lipsa",
  linkedinHandle: "in/adelina-lipsa",
  whatsapp: "https://wa.me/40745362663?text=" + encodeURIComponent("Hi Adelina, I came for the CV and stayed for the cat. Let’s talk."),
  pdf: "/Adelina_Lipsa_CV.pdf",
  booking: "https://calendly.com/adelina-lipsa/30min",
  lookingFor: "Product roles, full-time or contract. Payments, ops, internal tools. Based in Bucharest.",
};

export const about = [
  "I build the thing that’s missing. Tools, flows, dashboards, and sometimes the clothes I’m wearing. Allergic to letting my tech knowledge expire like milk. Quietly confident, naturally curious, and perpetually improving my chops one shipped thing at a time.",
  "When I’m not shipping, you’ll find me playing video games and eating ramen in the dark like a raccoon with WiFi.",
  "I believe a few lines of code can save the day, that putting milk in before cereal is a federal offense, and that the Oxford comma is non-negotiable.",
];

// about[2], one belief per line, for the Off duty chips.
export const beliefs = [
  "A few lines of code can save the day.",
  "Milk before cereal is a federal offense.",
  "The Oxford comma is non-negotiable.",
];

// The road to the dev branch. Adelina's own words, 2026-09-30 and 2026-10-01.
export const origin = [
  { when: "High school", text: "My first real contact with a computer was in high school, when I started rooting my Windows." },
  { when: "Then", text: "I spent a lot of time emulating the Nintendo and Game Boy games that weren’t available to me. It was my comfort zone." },
  { when: "2012 to 2015", text: "Studied psychology, with a focus on criminalistics." },
  { when: "After the degree", text: "Interned at SRI, the Romanian Intelligence Service, through the Romanian Government’s internship programme." },
  { when: "After university", text: "Photographer, cook, salesperson. I did a bit of everything." },
  { when: "2019", text: "I decided computers were my future, because I love spending time with them. Web development at The Informal School of IT." },
  { when: "2020", text: "My first dev job, at AgroCity. The rest is on the Career tab." },
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
      "Owns the payments product: gateway and acquirer integrations, 3DS/SCA, alternative payment methods, and the product side of Kount fraud monitoring, chargebacks and disputes.",
      "Product manager for the core engineering team and manager of the technical support team. Runs PRDs, standups, weekly reporting and the change log in ClickUp.",
      // Adelina's own words, 2026-10-01.
      "Wrote SOPs for BuyGoods, the platform Yomali owns, and moved HR operations from spreadsheets to Factorial.",
      "Product owner for the refund and return journey (Find Order) and the AI voice agent’s human escalation protocol. Proposed a self-service refund flow, now in testing.",
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
      "Led delivery for a digital health client at a Boston and Toronto agency, reporting to the CEO and coordinating third-party API integrations and escalations.",
      "Wrote the requirements for automated member eligibility processing in Laravel: per-vendor S3 drops, scheduled SFTP transfers, retries, logging and Slack alerts.",
      "Set up per-vendor AWS S3 folders with IAM policies by hand, wrote AWS Lambda functions, and scoped a self-hosted Apple and Google Wallet membership card service.",
      "Built the member app's Caspio DataPages, wallet card pages included, and turned the service catalogue PDF into a JSON source that drives the branded member app.",
    ],
    stack: ["Caspio", "Laravel", "AWS S3", "IAM", "AWS Lambda", "SFTP", "Asana"],
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
      "Deployed to Kubernetes in production, monitored workloads in Rancher, debugged with Kibana. Gathered requirements directly with QA teams.",
    ],
    stack: ["Laravel", "Vue 2", "Kubernetes", "Rancher", "Kibana", "Grafana", "Jira"], // Grafana, Jira: Adelina’s own words, 2026-10-01
  },
  {
    id: "fabelx",
    company: "Fabel X",
    role: "Full-Stack Web Developer and Technical Lead",
    short: "Full-Stack Developer, Tech Lead",
    dates: "Jul 2022 to Feb 2024",
    place: "Cluj, Romania",
    branch: "dev",
    lines: [
      "Full-stack web developer.",
      "Technical Lead from Jul 2023 to Dec 2023.",
      // Adelina's own words, 2026-10-01.
      "Worked across whatever each project needed: React with TypeScript, Ruby on Rails, Vue.js, Node.js, Next.js, .NET and more, plus Docker.",
    ],
    stack: ["React", "TypeScript", "Ruby on Rails", "Vue.js", "Node.js", "Next.js", ".NET", "Docker"],
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
    lines: [
      "Joined as Development Intern (Jul to Sep 2020), stayed as a full-stack developer.",
      // Adelina's own words, 2026-10-01.
      "Took the app mobile with Capacitor: iOS builds in Xcode, Android builds, and publishing to the App Store and Google Play.",
    ],
    stack: ["PHP", "Laravel", "Vue.js", "Capacitor", "Xcode", "Android", "SQL", "TailwindCSS", "Tailwind UI", "Webpack"],
  },
];

// The commit that lands on both branches: tools she still builds herself.
export const stillShipping = {
  id: "still-shipping",
  title: "Still shipping",
  dates: "2025 to now",
  lines: [
    "Builds internal tools hands-on when the team hits a recurring pain point: a link and postback decoder, the change log.",
    // Adelina's own words, 2026-09-30.
    "Built BITE (BuyGoods Internal Tools), a Chrome extension that checks whether BuyGoods tracking is on a page, including injected and network-fired tracking.",
    "Built the reporting pipeline and dashboard that replaced a 1.5 to 2 hour manual daily report.",
    "Built 3DS rollout tracking in ClickUp and analysed a 25-account sample to measure the rollout’s effect.",
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
