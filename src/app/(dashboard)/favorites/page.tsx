// Forza rendering dinamico (non SSG durante build)
export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import FavoritesClient from './favorites-client';

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect('/login');
  }

  // Get favorites with full details
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      result: {
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              keyword: true,
              platform: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Format data for client
  const formattedFavorites = favorites.map(fav => ({
    id: fav.id,
    createdAt: fav.createdAt.toISOString(),
    result: {
      ...fav.result,
      createdAt: fav.result.createdAt.toISOString(),
      updatedAt: fav.result.updatedAt.toISOString(),
      isFavorited: true, // All items in favorites are favorited
    },
  }));

  // Get statistics
  const stats = {
    total: favorites.length,
    byPlatform: favorites.reduce((acc, fav) => {
      const platform = fav.result.campaign.platform;
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <FavoritesClient 
        favorites={formattedFavorites}
        stats={stats}
      />
    </div>
  );
}
