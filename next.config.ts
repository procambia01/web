import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cloudflare Workers doesn't run Next's built-in image-optimization
    // server (which needs Sharp/Node). All images here are already
    // served pre-optimized by their own hosts (Cloudinary, Google,
    // GitHub), so this has no real quality cost.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
