import type { NextConfig } from "next";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
const cloudinaryConfigured = Boolean(cloudName && !/^(your[-_]|replace[-_]?me|change[-_]?me|\$\{)/i.test(cloudName));

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: cloudinaryConfigured
      ? [{ protocol: "https", hostname: "res.cloudinary.com", pathname: `/${cloudName}/**` }]
      : [],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
