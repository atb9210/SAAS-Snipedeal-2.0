// src/app/(dashboard)/layout.tsx - Layout Dashboard con bottom nav
// Timestamp: 2024-12-09

import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { FABButton } from '@/components/layout/fab-button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* FAB - New Campaign */}
      <FABButton />

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}


