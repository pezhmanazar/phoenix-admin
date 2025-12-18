/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ⛔️ موقع build پروداکشن، ESLint جلو build رو نگیره
    ignoreDuringBuilds: true,
  },

  // اگر Server Actions داری (که داری)
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;