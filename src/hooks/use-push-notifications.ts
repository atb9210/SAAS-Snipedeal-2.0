// src/hooks/use-push-notifications.ts - Hook for Push Notifications
// Timestamp: 2024-12-10
// Fixed: Get VAPID key from API instead of process.env (build-time issue)

'use client';

import { useState, useEffect, useCallback } from 'react';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission | null;
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  // Check support and current state
  useEffect(() => {
    const checkSupport = async () => {
      // Check if Push API is supported
      const supported = 
        'serviceWorker' in navigator && 
        'PushManager' in window &&
        'Notification' in window;

      setIsSupported(supported);

      if (!supported) {
        setError('Il tuo browser non supporta le notifiche push');
        setIsLoading(false);
        return;
      }

      // Check current permission
      setPermission(Notification.permission);

      // Fetch VAPID key from API (since NEXT_PUBLIC_ vars are baked at build time)
      try {
        const response = await fetch('/api/push/test');
        if (response.ok) {
          const data = await response.json();
          if (data.publicKey) {
            setVapidKey(data.publicKey);
          } else {
            console.warn('VAPID key not configured on server');
          }
        }
      } catch (err) {
        console.error('Error fetching VAPID config:', err);
      }

      // Check if already subscribed with timeout to prevent infinite loading
      try {
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Service Worker timeout')), 5000)
        );
        
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          timeoutPromise
        ]) as ServiceWorkerRegistration;
        
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (err) {
        console.error('Error checking subscription:', err);
        // Service worker not ready, but we can still show the UI
      }

      setIsLoading(false);
    };

    checkSupport();
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications non supportate');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission if needed
      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission();
        setPermission(result);
        
        if (result !== 'granted') {
          setError('Permesso notifiche negato');
          setIsLoading(false);
          return false;
        }
      } else if (Notification.permission === 'denied') {
        setError('Notifiche bloccate. Abilita dalle impostazioni del browser.');
        setIsLoading(false);
        return false;
      }

      // Get service worker registration with timeout
      let registration: ServiceWorkerRegistration;
      try {
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Service Worker non disponibile')), 10000)
        );
        
        registration = await Promise.race([
          navigator.serviceWorker.ready,
          timeoutPromise
        ]) as ServiceWorkerRegistration;
      } catch {
        setError('Service Worker non disponibile. Prova a ricaricare la pagina.');
        setIsLoading(false);
        return false;
      }

      // Get VAPID public key - try from state first, then API, then env
      let publicKey = vapidKey;
      
      if (!publicKey) {
        // Try to fetch from API
        try {
          const response = await fetch('/api/push/test');
          if (response.ok) {
            const data = await response.json();
            publicKey = data.publicKey;
          }
        } catch {
          console.error('Failed to fetch VAPID key from API');
        }
      }
      
      // Fallback to env (for local development)
      if (!publicKey) {
        publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
      }
      
      if (!publicKey) {
        setError('Configurazione VAPID non disponibile sul server');
        setIsLoading(false);
        return false;
      }

      // Subscribe to push
      const keyArray = urlBase64ToUint8Array(publicKey);
      
      let subscription: PushSubscription;
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyArray.buffer as ArrayBuffer,
        });
      } catch (pushError) {
        console.error('PushManager subscribe error:', pushError);
        setError('Errore durante la registrazione. Riprova.');
        setIsLoading(false);
        return false;
      }

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Errore nel salvare la subscription');
      }

      setIsSubscribed(true);
      setIsLoading(false);
      return true;

    } catch (err) {
      console.error('Error subscribing to push:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      setIsLoading(false);
      return false;
    }
  }, [isSupported, vapidKey]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);
    setError(null);

    try {
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        timeoutPromise
      ]) as ServiceWorkerRegistration;
      
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from server
      await fetch('/api/push/subscribe', { method: 'DELETE' });

      setIsSubscribed(false);
      setIsLoading(false);
      return true;

    } catch (err) {
      console.error('Error unsubscribing from push:', err);
      setError('Errore durante la disattivazione');
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    error,
    subscribe,
    unsubscribe,
  };
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
