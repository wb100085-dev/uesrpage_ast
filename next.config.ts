import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const atlasOrigin = process.env.ATLAS_ORIGIN?.trim().replace(/\/+$/, "");
    if (!atlasOrigin) return [];

    return [
      { source: "/atlas", destination: `${atlasOrigin}/` },
      { source: "/atlas/:path*", destination: `${atlasOrigin}/:path*` },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
};

export default nextConfig;
