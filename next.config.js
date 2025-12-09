// next.config.js - Configurazione Next.js 14 con PWA
// Timestamp: 2024-12-09

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Output standalone per Docker production
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.subito.it',
      },
      {
        protocol: 'https',
        hostname: '**.ebayimg.com',
      },
      {
        protocol: 'https',
        hostname: '**.vinted.net',
      },
      {
        protocol: 'https',
        hostname: '**.wallapop.com',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['playwright', 'bullmq'],
  },
};

module.exports = withPWA(nextConfig);


