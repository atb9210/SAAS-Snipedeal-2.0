// src/components/layout/bottom-navigation.tsx - Bottom Navigation mobile
// Timestamp: 2024-12-09

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Bell, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/campaigns', icon: Search, label: 'Campagne' },
  { href: '/notifications', icon: Bell, label: 'Notifiche' },
  { href: '/profile', icon: User, label: 'Profilo' },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn('bottom-nav-item', isActive && 'active')}
          >
            <motion.div
              initial={false}
              animate={{
                scale: isActive ? 1.1 : 1,
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <Icon className="w-6 h-6" />
            </motion.div>
            <span className="text-xs mt-1 font-medium">{item.label}</span>
            
            {/* Active indicator dot */}
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute -top-1 w-1 h-1 rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
