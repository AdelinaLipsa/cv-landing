import type { Metadata, Viewport } from "next";
import { Anybody, Figtree, JetBrains_Mono, Tinos } from "next/font/google";
import "./globals.css";
import { certifications, education, jobs, languages, profile } from "@/content/cv";
import { siteUrl } from "@/lib/site";

const anybody = Anybody({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display" });
const figtree = Figtree({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", preload: false });
const tinos = Tinos({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], variable: "--font-2003", preload: false });

// Skip the intro if it was seen in the last day (cv-built holds when), on a deep link to a page, or on an arcade challenge.
const GATE = `try{var m=localStorage.getItem("cv-theme-v2");var h=new Date().getHours();document.documentElement.dataset.theme=m||(h<5?"dark":"light")}catch(e){}try{var t=+localStorage.getItem("cv-built");if(Date.now()-t<864e5||/^#(home|work|career|skills|contact)$/.test(location.hash)||/[?&]challenge=/.test(location.search))document.documentElement.dataset.built="1"}catch(e){}`;

const title = "Adelina Lipșa, Technical Product Owner";
const description = "Technical Product Owner on payments, Technical Support Team Manager, and a full-stack developer still shipping code. It didn’t exist, so I built it.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: { type: "profile", url: "/", siteName: "Adelina Lipșa", title, description, locale: "en_GB", firstName: "Adelina", lastName: "Lipșa" },
  twitter: { card: "summary_large_image", title, description },
};

// Who this page is about, for search engines and AI answers. Everything comes from content/cv.ts.
const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: profile.role,
  description,
  url: siteUrl,
  image: `${siteUrl}/adelina.jpg`,
  sameAs: [profile.linkedin],
  worksFor: { "@type": "Organization", name: jobs[0].company },
  address: { "@type": "PostalAddress", addressLocality: "Bucharest", addressCountry: "RO" },
  alumniOf: education.map((e) => ({ "@type": "EducationalOrganization", name: e.where })),
  hasCredential: certifications.map((name) => ({ "@type": "EducationalOccupationalCredential", name })),
  knowsLanguage: languages.map((l) => l.split(",")[0]),
  knowsAbout: ["Payments", "3DS/SCA", "Checkout", "Chargebacks", "Fraud monitoring", "Product ownership", "Full-stack development"],
};

export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F7F6FB" }, { media: "(prefers-color-scheme: dark)", color: "#0E0D1C" }], width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anybody.variable} ${figtree.variable} ${mono.variable} ${tinos.variable}`} suppressHydrationWarning>
      <head>
        {/* Decide built or unbuilt before first paint: no flash of the 2003 page for return visits. */}
        <script dangerouslySetInnerHTML={{ __html: GATE }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person).replace(/</g, "\\u003c") }} />
      </head>
      {/* Extensions (e.g. ColorZilla's cz-shortcut-listen) add attributes to <body> before React loads. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
