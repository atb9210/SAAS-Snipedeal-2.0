// src/app/api/auth/[...nextauth]/route.ts - NextAuth API Route
// Timestamp: 2024-12-09

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };


