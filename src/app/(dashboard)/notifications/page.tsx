// src/app/(dashboard)/notifications/page.tsx - Pagina Notifiche
// Timestamp: 2024-12-09

// Forza rendering dinamico (non SSG durante build)
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NotificationsClient } from './notifications-client';

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }

  // Get recent results (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const results = await prisma.result.findMany({
    where: {
      campaign: { userId: session.user.id },
      createdAt: { gte: sevenDaysAgo },
    },
    include: {
      campaign: { select: { name: true, platform: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Serializza le date
  const serializedResults = results.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  // Group by date
  const groupedResults = serializedResults.reduce((acc, result) => {
    const date = new Date(result.createdAt).toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(result);
    return acc;
  }, {} as Record<string, typeof serializedResults>);

  return <NotificationsClient groupedResults={groupedResults} />;
}


