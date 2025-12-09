// src/middleware.ts - Middleware protezione route
// Timestamp: 2024-12-09

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Proteggi route admin - solo utenti con ruolo ADMIN
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Route pubbliche
        if (
          path === '/login' ||
          path === '/register' ||
          path.startsWith('/api/auth')
        ) {
          return true;
        }

        // Tutte le altre route richiedono autenticazione
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // Proteggi tutte le route tranne quelle statiche e API pubbliche
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox).*)',
  ],
};


