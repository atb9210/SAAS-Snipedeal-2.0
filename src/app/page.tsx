// src/app/page.tsx - Homepage redirect
// Timestamp: 2024-12-09

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}


