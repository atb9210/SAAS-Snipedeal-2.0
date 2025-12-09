// src/app/(dashboard)/profile/profile-client.tsx - UI Profilo Utente
// Timestamp: 2024-12-09

'use client';

import { signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Bell, 
  Crown, 
  LogOut, 
  ChevronRight,
  Shield,
  HelpCircle,
  Star,
  Settings
} from 'lucide-react';

interface Plan {
  name: string;
  maxCampaigns: number;
  maxMarketplaces: number;
  frequencyMins: number;
  priceYear: number;
}

interface ProfileClientProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    plan: Plan | null;
    campaignsCount: number;
    createdAt: string;
  };
}

export function ProfileClient({ user }: ProfileClientProps) {
  const isAdmin = user.role === 'ADMIN';
  const plan = user.plan;

  const menuItems = [
    {
      icon: Bell,
      label: 'Notifiche Push',
      href: '/profile/notifications',
      description: 'Gestisci le notifiche',
    },
    {
      icon: Crown,
      label: 'Piano Abbonamento',
      href: '/pricing',
      description: plan?.name || 'Free',
      badge: plan?.name !== 'Free' ? 'PRO' : undefined,
    },
    {
      icon: Settings,
      label: 'Impostazioni',
      href: '/profile/settings',
      description: 'Account e preferenze',
    },
    {
      icon: HelpCircle,
      label: 'Aiuto e Supporto',
      href: '/help',
      description: 'FAQ e contatti',
    },
  ];

  if (isAdmin) {
    menuItems.unshift({
      icon: Shield,
      label: 'Pannello Admin',
      href: '/admin',
      description: 'Gestione sistema',
      badge: 'ADMIN',
    });
  }

  const formatFrequency = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    if (mins === 60) return '1 ora';
    return `${mins / 60} ore`;
  };

  return (
    <div className="px-4 pt-safe pb-8">
      {/* Header */}
      <header className="pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Profilo</h1>
      </header>

      {/* User Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6"
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1">
            <h2 className="font-semibold text-lg text-gray-900">
              {user.name || 'Utente'}
            </h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            {isAdmin && (
              <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Plan Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card bg-gradient-to-br from-primary-50 to-secondary-50 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            <span className="font-semibold text-gray-900">
              Piano {plan?.name || 'Free'}
            </span>
          </div>
          {plan?.name === 'Free' && (
            <Link href="/pricing" className="btn-primary btn-sm">
              Upgrade
            </Link>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {user.campaignsCount}/{plan?.maxCampaigns || 1}
            </p>
            <p className="text-xs text-gray-500">Campagne</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {plan?.maxMarketplaces || 1}
            </p>
            <p className="text-xs text-gray-500">Marketplace</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {formatFrequency(plan?.frequencyMins || 180)}
            </p>
            <p className="text-xs text-gray-500">Frequenza</p>
          </div>
        </div>
      </motion.div>

      {/* Menu Items */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-2 mb-6"
      >
        {menuItems.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className="card flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <item.icon className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-primary text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </Link>
        ))}
      </motion.div>

      {/* Logout Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="w-full card flex items-center gap-3 text-red-600 hover:bg-red-50"
      >
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <LogOut className="w-5 h-5" />
        </div>
        <span className="font-medium">Esci</span>
      </motion.button>

      {/* App Version */}
      <p className="text-center text-xs text-gray-400 mt-8">
        SnipeDeal v2.0.0
      </p>
    </div>
  );
}


