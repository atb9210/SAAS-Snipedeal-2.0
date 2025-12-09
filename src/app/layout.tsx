// src/app/layout.tsx - Layout principale SnipeDeal 2.0 PWA
// Timestamp: 2024-12-09

import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

// Font configurations
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

// Metadata PWA
export const metadata: Metadata = {
  title: 'SnipeDeal - Trova Affari sui Marketplace',
  description: 'Monitora automaticamente Subito, eBay, Vinted e altri marketplace. Ricevi notifiche istantanee sui migliori affari.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SnipeDeal',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'SnipeDeal',
    title: 'SnipeDeal - Trova Affari sui Marketplace',
    description: 'Monitora automaticamente i marketplace e trova i migliori affari prima degli altri.',
  },
  twitter: {
    card: 'summary',
    title: 'SnipeDeal',
    description: 'Monitora i marketplace e trova i migliori affari',
  },
};

// Viewport configuration per PWA
export const viewport: Viewport = {
  themeColor: '#E53935',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        {/* PWA Meta Tags */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.svg" />
        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/icons/favicon-32x32.svg" />
        <link rel="icon" type="image/svg+xml" sizes="16x16" href="/icons/favicon-16x16.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#E53935" />
      </head>
      <body className="min-h-screen bg-background">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

