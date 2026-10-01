import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    // Les téléversements sont déjà compressés en WebP (1600 px maximum) côté
    // navigateur. Les servir directement évite de bloquer des images lorsque
    // le quota Vercel de transformations est atteint.
    unoptimized: true,
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
