import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    // Browser reads loopback Storage directly in the isolated local QA runtime.
    // Never enable the server-side local-IP image fetcher on a public deployment.
    unoptimized: process.env.QA_LOCAL === '1' && !process.env.VERCEL,
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/auth/callback",
        destination: "/api/auth/callback",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
