// src/app/admin/layout.tsx - Layout Admin Panel
// Timestamp: 2024-12-09

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminSidebar } from './admin-sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  // Redirect non-admin users
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {children}
      </main>
    </div>
  );
}


