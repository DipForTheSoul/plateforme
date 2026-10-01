import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    // Browser reads loopback Storage directly in the isolated local QA runtime.
    // Never enable the server-side local-IP image fetcher on a public deployment.
    unoptimized: process.env.QA_LOCAL === '1' && !process.env.VERCEL,
    // Keep the optimizer's cache warm for stable public assets. Practitioner
    // uploads use immutable UUID filenames, so a new image always gets a new URL.
    minimumCacheTTL: 2_678_400,
    // The default Next.js list includes widths up to 3840px. ForTheSoul limits
    // uploads to 1600px, so generating larger variants wastes transformations.
    deviceSizes: [360, 640, 768, 1024, 1280, 1600],
    imageSizes: [48, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pccbiclpgrjmejpybcki.supabase.co",
        pathname: "/storage/v1/object/public/images/**",
      },
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
