// src/app/(dashboard)/profile/page.tsx - Pagina Profilo
// Timestamp: 2024-12-09

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ProfileClient } from './profile-client';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { 
      plan: true,
      _count: { select: { campaigns: true } },
    },
  });

  if (!user) return null;

  return (
    <ProfileClient 
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        campaignsCount: user._count.campaigns,
        createdAt: user.createdAt.toISOString(),
      }}
    />
  );
}


