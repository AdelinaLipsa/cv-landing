import type { NextConfig } from "next";

const config: NextConfig = {
  // Inline the CSS into the HTML: no render-blocking stylesheet requests on first load.
  experimental: { inlineCss: true },
  // Dev only: let the public ngrok tunnel load dev assets (Next blocks other origins by default).
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.app", "*.ngrok.io"],
  // Browsers still ask for /favicon.ico; hand them the round photo icon (app/icon.tsx).
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon" }];
  },
};

export default config;
