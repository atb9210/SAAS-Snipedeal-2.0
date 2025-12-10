// next.config.js - Configurazione Next.js 14 con PWA
// Timestamp: 2024-12-10
// NOTA: Service Worker gestito manualmente in /public/sw.js

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
  // Durante il build Docker, evita errori se il database non è disponibile
  // Le pagine che usano Prisma devono avere export const dynamic = 'force-dynamic'
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig;


