// src/app/admin/users/page.tsx - Admin Users Page
// Timestamp: 2024-12-09

import prisma from '@/lib/prisma';
import { AdminUsersClient } from './admin-users-client';

export default async function AdminUsersPage() {
  const [users, plans] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        plan: true,
        _count: { select: { campaigns: true } },
      },
    }),
    prisma.plan.findMany({ orderBy: { priceYear: 'asc' } }),
  ]);

  return (
    <AdminUsersClient 
      users={users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        planId: u.planId,
        planName: u.plan?.name || null,
        campaignsCount: u._count.campaigns,
        createdAt: u.createdAt.toISOString(),
      }))}
      plans={plans}
    />
  );
}


