// src/app/(dashboard)/dashboard/dashboard-client.tsx - Dashboard UI Client Component
// Timestamp: 2024-12-09

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Search, 
  Bell, 
  TrendingUp, 
  ChevronRight,
  Zap,
  Target,
  ExternalLink
} from 'lucide-react';
import { formatPrice, formatRelativeDate, platformConfig } from '@/lib/utils';

interface DashboardClientProps {
  user: {
    id: string;
    name?: string | null;
    email: string;
    planName: string;
  };
  campaigns: any[];
  recentResults: any[];
  stats: {
    totalCampaigns: number;
    activeCampaigns: number;
    newResults: number;
    planName: string;
    maxCampaigns: number;
  };
}

export function DashboardClient({ 
  user, 
  campaigns, 
  recentResults, 
  stats 
}: DashboardClientProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="px-4 pt-safe"
    >
      {/* Header */}
      <motion.header variants={itemVariants} className="pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Bentornato,</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {user.name || 'Utente'} 👋
            </h1>
          </div>
          <Link 
            href="/notifications"
            className="relative p-2 rounded-full bg-white shadow-sm"
          >
            <Bell className="w-6 h-6 text-gray-600" />
            {stats.newResults > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                {stats.newResults > 9 ? '9+' : stats.newResults}
              </span>
            )}
          </Link>
        </div>
      </motion.header>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-6">
        <div className="card bg-gradient-to-br from-primary to-primary-700 text-white">
          <Target className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-3xl font-bold">{stats.activeCampaigns}</p>
          <p className="text-sm opacity-80">Campagne Attive</p>
        </div>
        <div className="card bg-gradient-to-br from-secondary to-secondary-600 text-white">
          <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-3xl font-bold">{stats.newResults}</p>
          <p className="text-sm opacity-80">Nuovi Risultati</p>
        </div>
      </motion.div>

      {/* Plan Info */}
      <motion.div variants={itemVariants} className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Piano {stats.planName}</p>
              <p className="text-sm text-gray-500">
                {stats.totalCampaigns}/{stats.maxCampaigns} campagne
              </p>
            </div>
          </div>
          {stats.planName === 'Free' && (
            <Link 
              href="/pricing"
              className="btn-primary btn-sm"
            >
              Upgrade
            </Link>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Azioni Rapide
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          <Link href="/campaigns/new" className="flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-primary-50 flex flex-col items-center justify-center gap-2 hover:bg-primary-100 transition-colors">
              <Search className="w-6 h-6 text-primary" />
              <span className="text-xs font-medium text-primary">Nuova</span>
            </div>
          </Link>
          <Link href="/campaigns" className="flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-secondary-50 flex flex-col items-center justify-center gap-2 hover:bg-secondary-100 transition-colors">
              <Target className="w-6 h-6 text-secondary" />
              <span className="text-xs font-medium text-secondary">Campagne</span>
            </div>
          </Link>
          <Link href="/notifications" className="flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-success-50 flex flex-col items-center justify-center gap-2 hover:bg-success-100 transition-colors">
              <Bell className="w-6 h-6 text-success" />
              <span className="text-xs font-medium text-success">Notifiche</span>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Recent Results */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Ultimi Affari
          </h2>
          <Link href="/notifications" className="text-primary text-sm font-medium flex items-center">
            Vedi tutti
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentResults.length === 0 ? (
          <div className="empty-state py-8">
            <Search className="empty-state-icon" />
            <p className="empty-state-title">Nessun risultato ancora</p>
            <p className="empty-state-description">
              Crea una campagna per iniziare a trovare affari
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentResults.slice(0, 5).map((result: any, index: number) => (
              <motion.a
                key={result.id}
                href={result.link}
                target="_blank"
                rel="noopener noreferrer"
                variants={itemVariants}
                className="card flex gap-3 hover:shadow-card-hover"
              >
                {/* Image */}
                <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                  {(() => {
                    const platform = result.campaign?.platform || 'SUBITO';
                    const IconComponent = platformConfig[platform as keyof typeof platformConfig].icon;
                    return <IconComponent size={48} className="w-full h-full object-contain p-2" />;
                  })()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                      {result.title}
                    </h3>
                    <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                  
                  <p className="text-primary font-bold mt-1">
                    {formatPrice(result.price)}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {platformConfig[result.campaign?.platform as keyof typeof platformConfig]?.icon}{' '}
                      {result.campaign?.name}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400">
                      {formatRelativeDate(result.createdAt)}
                    </span>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </motion.div>

      {/* Active Campaigns */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Le Tue Campagne
          </h2>
          <Link href="/campaigns" className="text-primary text-sm font-medium flex items-center">
            Gestisci
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="card text-center py-8">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">
              Non hai ancora campagne attive
            </p>
            <Link href="/campaigns/new" className="btn-primary btn-md">
              Crea la Prima Campagna
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.slice(0, 3).map((campaign: any) => (
              <Link 
                key={campaign.id} 
                href={`/campaigns/${campaign.id}`}
                className="card flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${campaign.isActive ? 'bg-success' : 'bg-gray-300'}`} />
                  <div>
                    <p className="font-medium text-gray-900">{campaign.name}</p>
                    <p className="text-sm text-gray-500">
                      {platformConfig[campaign.platform as keyof typeof platformConfig]?.icon}{' '}
                      {campaign.keyword}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {campaign._count?.results || 0}
                  </p>
                  <p className="text-xs text-gray-500">risultati</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
