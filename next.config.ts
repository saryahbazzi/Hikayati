import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Parallel dev/build runs can use separate output dirs (NEXT_DIST_DIR=.next-xyz).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  reactStrictMode: true,
  // PGlite ships WASM + data files that must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  // `NEXT_OUTPUT=standalone` is only used to verify, locally, that serverless tracing ships PGlite's WASM files.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // `/` has no content of its own: English is the default language.
  async redirects() {
    return [{ source: "/", destination: "/en", permanent: false }];
  },
  async headers() {
    // Content-Security-Policy (production only: Next's dev server needs eval for HMR). Inline scripts/styles are
    // required by Next's runtime; everything else is same-origin. https: images allow registered template assets.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; ");
    return [{
      source: "/:path*",
      headers: [
        ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: csp }] : []),
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
      ],
    }];
  },
};

export default nextConfig;
