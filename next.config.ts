import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/metro',
  images: {
    unoptimized: true,
  },
  // Ensure trailing slashes for static export routing
  trailingSlash: true,
};

export default nextConfig;
