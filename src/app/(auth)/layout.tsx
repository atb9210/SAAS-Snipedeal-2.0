// src/app/(auth)/layout.tsx - Layout per pagine autenticazione
// Timestamp: 2024-12-09

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SnipeDeal - Accedi',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout senza bottom navigation per pagine auth
  return <>{children}</>;
}


