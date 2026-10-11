import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Parallel dev/build runs can use separate output dirs (NEXT_DIST_DIR=.next-xyz).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  reactStrictMode: true,
  // PGlite ships WASM + data files that must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  // `/` has no content of its own: English is the default language.
  async redirects() {
    return [{ source: "/", destination: "/en", permanent: false }];
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
      ],
    }];
  },
};

export default nextConfig;
