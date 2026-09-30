import type { NextConfig } from "next";

const config: NextConfig = {
  // Inline the CSS into the HTML: no render-blocking stylesheet requests on first load.
  experimental: { inlineCss: true },
};

export default config;
