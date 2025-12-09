// src/app/admin/page.tsx - Admin Dashboard
// Timestamp: 2024-12-09

import prisma from '@/lib/prisma';
import { AdminDashboardClient } from './admin-dashboard-client';

export default async function AdminDashboardPage() {
  // Get stats
  const [
    totalUsers,
    totalCampaigns,
    totalResults,
    recentUsers,
    planDistribution,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.campaign.count(),
    prisma.result.count(),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { plan: true, _count: { select: { campaigns: true } } },
    }),
    prisma.user.groupBy({
      by: ['planId'],
      _count: true,
    }),
  ]);

  // Get plans for distribution
  const plans = await prisma.plan.findMany();
  const planStats = planDistribution.map(item => {
    const plan = plans.find(p => p.id === item.planId);
    return {
      name: plan?.name || 'Nessun piano',
      count: item._count,
    };
  });

  const stats = {
    totalUsers,
    totalCampaigns,
    totalResults,
    recentUsers: recentUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      planName: u.plan?.name || 'Free',
      campaignsCount: u._count.campaigns,
      createdAt: u.createdAt.toISOString(),
    })),
    planStats,
  };

  return <AdminDashboardClient stats={stats} />;
}


