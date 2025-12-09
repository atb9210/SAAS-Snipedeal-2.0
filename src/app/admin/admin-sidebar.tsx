// src/app/admin/admin-sidebar.tsx - Admin Sidebar Navigation
// Timestamp: 2024-12-09

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Crown, 
  Activity, 
  Settings,
  ArrowLeft,
  Menu,
  X,
  Zap,
  Shield
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Utenti' },
  { href: '/admin/plans', icon: Crown, label: 'Piani' },
  { href: '/admin/proxy', icon: Shield, label: 'Proxy' },
  { href: '/admin/jobs', icon: Activity, label: 'Jobs' },
  { href: '/admin/settings', icon: Settings, label: 'Impostazioni' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            <span className="font-bold text-gray-900">Admin</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-gray-600"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 h-16 border-b border-gray-100">
          <Zap className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold text-gray-900">SnipeDeal</span>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive(item.href)
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Back to App */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Torna all'App</span>
          </Link>
        </div>
      </aside>

      {/* Spacer for mobile header */}
      <div className="lg:hidden h-16" />
    </>
  );
}

