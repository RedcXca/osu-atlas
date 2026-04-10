import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "flagcdn.com" }
    ]
  }
};

export default nextConfig;
