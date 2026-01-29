import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.mzstatic.com",
      },
      {
        protocol: "https", 
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "**.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "uploadthing.com",
      },
      {
        protocol: "https",
        hostname: "edmtrain.com",
      },
    ],
  },
  // Moved from experimental.serverComponentsExternalPackages (deprecated in Next.js 16)
  serverExternalPackages: ["pg"],
  turbopack: {
    root: ".",
  },
  experimental: {
  },
};

export default nextConfig;
