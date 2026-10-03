import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "frame-src https://www.openstreetmap.org",
      "object-src 'none'",
      "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
      "font-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
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
