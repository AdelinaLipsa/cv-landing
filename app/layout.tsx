import type { Metadata, Viewport } from "next";
import { Anybody, Figtree, JetBrains_Mono, Tinos } from "next/font/google";
import "./globals.css";

const anybody = Anybody({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display" });
const figtree = Figtree({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", preload: false });
const tinos = Tinos({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], variable: "--font-2003", preload: false });

const GATE = `try{if(localStorage.getItem("cv-built")==="1"||/^#(home|work|career|skills|contact)$/.test(location.hash))document.documentElement.dataset.built="1"}catch(e){}`;

export const metadata: Metadata = {
  title: "Adelina Lipșa, Technical Product Owner",
  description: "It didn’t exist, so I built it.",
  other: { robots: "noindex, nofollow, noarchive" },
};

export const viewport: Viewport = { themeColor: "#F7F6FB", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anybody.variable} ${figtree.variable} ${mono.variable} ${tinos.variable}`} suppressHydrationWarning>
      <head>
        {/* Decide built or unbuilt before first paint: no flash of the 2003 page for return visits. */}
        <script dangerouslySetInnerHTML={{ __html: GATE }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
