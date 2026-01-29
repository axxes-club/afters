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
  // External packages for serverless compatibility
  serverExternalPackages: [
    "pg",
    "@prisma/client",
    ".prisma/client",
    "@prisma/adapter-pg",
    "@prisma/adapter-neon",
    "@prisma/client-runtime-utils",
    "@prisma/driver-adapter-utils",
  ],
};

export default nextConfig;
