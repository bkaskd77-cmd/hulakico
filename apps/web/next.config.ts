import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HTTPS only for a year, subdomains included (no preload list: that is hard to undo).
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // The Content-Security-Policy (with a per-request nonce) is set in proxy.ts.
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  async redirects() {
    return [
      { source: "/ops", destination: "/admin/shipments", permanent: false },
      {
        source: "/ops/exceptions",
        destination: "/admin/exceptions",
        permanent: false,
      },
      { source: "/ops/cod", destination: "/admin/cod", permanent: false },
      {
        source: "/ops/payments",
        destination: "/admin/payments",
        permanent: false,
      },
      {
        source: "/ops/notifications",
        destination: "/admin/notifications",
        permanent: false,
      },
      {
        source: "/ops/carriers",
        destination: "/admin/carriers",
        permanent: false,
      },
      { source: "/admin/signin", destination: "/admin", permanent: false },
    ];
  },
};

export default nextConfig;
