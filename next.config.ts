import type { NextConfig } from "next";

const config: NextConfig = {
  // Inline the CSS into the HTML: no render-blocking stylesheet requests on first load.
  experimental: { inlineCss: true },
  // Browsers still ask for /favicon.ico; hand them the SVG icon.
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.svg" }];
  },
};

export default config;
