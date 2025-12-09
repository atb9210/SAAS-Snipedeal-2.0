// src/types/next-auth.d.ts - Estensione tipi NextAuth
// Timestamp: 2024-12-09

import 'next-auth';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    planId?: string | null;
    planName?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      planId?: string | null;
      planName: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    planId?: string | null;
    planName?: string;
  }
}


