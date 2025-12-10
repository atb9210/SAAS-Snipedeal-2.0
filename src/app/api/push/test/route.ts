// src/app/api/push/test/route.ts - Test Push Notifications
// Timestamp: 2024-12-10

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendPushNotification, PushSubscription } from '@/lib/web-push';

// POST - Send test notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Get user with push subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { pushSubscription: true, name: true },
    });

    if (!user?.pushSubscription) {
      return NextResponse.json(
        { error: 'Nessuna subscription push configurata. Attiva prima le notifiche.' },
        { status: 400 }
      );
    }

    // Parse subscription
    let subscription: PushSubscription;
    try {
      subscription = JSON.parse(user.pushSubscription);
    } catch {
      return NextResponse.json(
        { error: 'Subscription push non valida' },
        { status: 400 }
      );
    }

    // Send test notification
    const success = await sendPushNotification(subscription, {
      title: '🎉 Test Notifica SnipeDeal',
      body: `Ciao ${user.name || 'utente'}! Le notifiche push funzionano correttamente.`,
      tag: 'test-notification',
      data: {
        type: 'test',
        url: '/notifications',
        timestamp: Date.now(),
      },
      actions: [
        { action: 'open', title: 'Apri App' },
        { action: 'dismiss', title: 'Chiudi' },
      ],
    });

    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Notifica di test inviata! Controlla il tuo dispositivo.' 
      });
    } else {
      return NextResponse.json(
        { error: 'Impossibile inviare la notifica. Verifica la configurazione VAPID.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { error: 'Errore nell\'invio della notifica di test' },
      { status: 500 }
    );
  }
}

// GET - Check push notification status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Check VAPID configuration
    const vapidConfigured = !!(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && 
      process.env.VAPID_PRIVATE_KEY
    );

    // Get user subscription status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { pushSubscription: true },
    });

    return NextResponse.json({
      vapidConfigured,
      hasSubscription: !!user?.pushSubscription,
      publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null,
    });
  } catch (error) {
    console.error('Error checking push status:', error);
    return NextResponse.json(
      { error: 'Errore nel controllo dello stato push' },
      { status: 500 }
    );
  }
}

