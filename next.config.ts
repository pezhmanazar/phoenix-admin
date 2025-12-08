import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ⛔️ ESLint ارور نده موقع build پروداکشن
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;