import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Trova utente
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ottieni preferiti con dettagli completi
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

    // Formatta dati per il frontend
    const formattedFavorites = favorites.map(fav => ({
      id: fav.id,
      createdAt: fav.createdAt,
      result: fav.result,
    }));

    // Calcola statistiche
    const stats = {
      total: favorites.length,
      byPlatform: favorites.reduce((acc, fav) => {
        const platform = fav.result.campaign.platform;
        acc[platform] = (acc[platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({
      favorites: formattedFavorites,
      stats,
    });

  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ottieni dati dal body
    const { favoriteId } = await request.json();
    
    if (!favoriteId) {
      return NextResponse.json({ error: 'favoriteId is required' }, { status: 400 });
    }

    // Trova utente
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verifica che il preferito appartenga all'utente
    const favorite = await prisma.favorite.findFirst({
      where: {
        id: favoriteId,
        userId: user.id,
      },
    });

    if (!favorite) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }

    // Elimina preferito
    await prisma.favorite.delete({
      where: { id: favoriteId },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Favorite removed successfully'
    });

  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
