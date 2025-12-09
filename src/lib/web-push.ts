// src/lib/web-push.ts - Web Push Notifications Setup
// Timestamp: 2024-12-09

import webpush from 'web-push';

// Initialize VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@snipedeal.it';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// Send push notification
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushNotificationPayload
): Promise<boolean> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('[WebPush] VAPID keys not configured');
    return false;
  }

  try {
    const notificationPayload = JSON.stringify({
      ...payload,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/badge-72x72.png',
    });

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      notificationPayload
    );

    console.log('[WebPush] Notification sent successfully');
    return true;
  } catch (error: any) {
    console.error('[WebPush] Error sending notification:', error.message);
    
    // Handle expired/invalid subscriptions
    if (error.statusCode === 404 || error.statusCode === 410) {
      console.log('[WebPush] Subscription expired or invalid');
      return false;
    }
    
    throw error;
  }
}

// Send notification for new results
export async function sendNewResultsNotification(
  subscription: PushSubscription,
  campaignName: string,
  resultsCount: number
): Promise<boolean> {
  return sendPushNotification(subscription, {
    title: '🔔 Nuovi Annunci Trovati!',
    body: `${resultsCount} nuovi annunci per "${campaignName}"`,
    tag: `campaign-${campaignName}`,
    data: {
      type: 'new_results',
      campaignName,
      count: resultsCount,
      url: '/notifications',
    },
    actions: [
      { action: 'view', title: 'Vedi Annunci' },
      { action: 'dismiss', title: 'Ignora' },
    ],
  });
}


