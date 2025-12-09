// src/app/admin/admin-dashboard-client.tsx - Admin Dashboard UI
// Timestamp: 2024-12-09

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Users, 
  Target, 
  TrendingUp, 
  ChevronRight,
  Crown
} from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';

interface AdminDashboardClientProps {
  stats: {
    totalUsers: number;
    totalCampaigns: number;
    totalResults: number;
    recentUsers: Array<{
      id: string;
      name: string | null;
      email: string;
      role: string;
      planName: string;
      campaignsCount: number;
      createdAt: string;
    }>;
    planStats: Array<{ name: string; count: number }>;
  };
}

export function AdminDashboardClient({ stats }: AdminDashboardClientProps) {
  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-500">Panoramica del sistema</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-4 shadow-sm"
        >
          <Users className="w-8 h-8 text-primary mb-2" />
          <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          <p className="text-sm text-gray-500">Utenti totali</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-sm"
        >
          <Target className="w-8 h-8 text-secondary mb-2" />
          <p className="text-3xl font-bold text-gray-900">{stats.totalCampaigns}</p>
          <p className="text-sm text-gray-500">Campagne</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-sm"
        >
          <TrendingUp className="w-8 h-8 text-success mb-2" />
          <p className="text-3xl font-bold text-gray-900">{stats.totalResults}</p>
          <p className="text-sm text-gray-500">Risultati</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 shadow-sm"
        >
          <Crown className="w-8 h-8 text-warning mb-2" />
          <p className="text-3xl font-bold text-gray-900">
            {stats.planStats.find(p => p.name !== 'Free')?.count || 0}
          </p>
          <p className="text-sm text-gray-500">Utenti PRO</p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Utenti Recenti</h2>
            <Link 
              href="/admin/users"
              className="text-primary text-sm font-medium flex items-center"
            >
              Vedi tutti
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentUsers.map((user) => (
              <div key={user.id} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                  {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {user.name || user.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    {user.planName} • {user.campaignsCount} campagne
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {formatRelativeDate(user.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Plan Distribution */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Distribuzione Piani</h2>
            <Link 
              href="/admin/plans"
              className="text-primary text-sm font-medium flex items-center"
            >
              Gestisci
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4 space-y-4">
            {stats.planStats.map((plan, index) => {
              const percentage = stats.totalUsers > 0 
                ? Math.round((plan.count / stats.totalUsers) * 100) 
                : 0;
              const colors = ['bg-primary', 'bg-secondary', 'bg-success', 'bg-warning'];
              
              return (
                <div key={plan.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {plan.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {plan.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.1 * index }}
                      className={`h-full ${colors[index % colors.length]}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}


