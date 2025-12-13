import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ottieni dati dal body
    const { resultId } = await request.json();
    
    if (!resultId) {
      return NextResponse.json({ error: 'resultId is required' }, { status: 400 });
    }

    // Trova utente
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verifica che il result esista
    const result = await prisma.result.findUnique({
      where: { id: resultId },
    });

    if (!result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    // Controlla se esiste già il preferito
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_resultId: {
          userId: user.id,
          resultId: resultId,
        },
      },
    });

    let isFavorited;

    if (existingFavorite) {
      // Rimuovi preferito
      await prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });
      isFavorited = false;
    } else {
      // Aggiungi preferito
      await prisma.favorite.create({
        data: {
          userId: user.id,
          resultId: resultId,
        },
      });
      isFavorited = true;
    }

    // Revalidate cache for affected pages
    revalidatePath('/campaigns');
    revalidatePath('/notifications');
    revalidatePath('/favorites');

    return NextResponse.json({ 
      success: true, 
      isFavorited,
      message: isFavorited ? 'Added to favorites' : 'Removed from favorites'
    });

  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
