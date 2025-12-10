// src/app/(dashboard)/pricing/page.tsx - Pagina Piani e Prezzi
// Timestamp: 2024-12-09

// Forza rendering dinamico (non SSG durante build)
export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PricingClient } from './pricing-client';

export default async function PricingPage() {
  const session = await getServerSession(authOptions);
  
  const [plans, user] = await Promise.all([
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceYear: 'asc' },
    }),
    session?.user
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          include: { plan: true },
        })
      : null,
  ]);

  return (
    <PricingClient 
      plans={plans}
      currentPlanId={user?.planId}
    />
  );
}


