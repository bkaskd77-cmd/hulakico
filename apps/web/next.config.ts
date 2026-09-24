import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
