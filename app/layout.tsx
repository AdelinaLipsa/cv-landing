import type { Metadata, Viewport } from "next";
import { Anybody, Figtree, JetBrains_Mono, Tinos } from "next/font/google";
import "./globals.css";

const anybody = Anybody({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display" });
const figtree = Figtree({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", preload: false });
const tinos = Tinos({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], variable: "--font-2003", preload: false });

// Skip the intro if it was seen in the last day (cv-built holds when), or on a deep link to a page.
const GATE = `try{var m=localStorage.getItem("cv-theme");document.documentElement.dataset.theme=m||"light"}catch(e){}try{var t=+localStorage.getItem("cv-built");if(Date.now()-t<864e5||/^#(home|work|career|skills|contact)$/.test(location.hash))document.documentElement.dataset.built="1"}catch(e){}`;

export const metadata: Metadata = {
  title: "Adelina Lipșa, Technical Product Owner",
  description: "Technical Product Owner on payments, and a full-stack developer still shipping code. It didn’t exist, so I built it.",
  other: { robots: "noindex, nofollow, noarchive" },
};

export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F7F6FB" }, { media: "(prefers-color-scheme: dark)", color: "#0E0D1C" }], width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anybody.variable} ${figtree.variable} ${mono.variable} ${tinos.variable}`} suppressHydrationWarning>
      <head>
        {/* Decide built or unbuilt before first paint: no flash of the 2003 page for return visits. */}
        <script dangerouslySetInnerHTML={{ __html: GATE }} />
      </head>
      {/* Extensions (e.g. ColorZilla's cz-shortcut-listen) add attributes to <body> before React loads. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
