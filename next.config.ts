// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // allow production builds to succeed even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
  // (keep this false if you want TS to fail builds on type errors)
  // typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
