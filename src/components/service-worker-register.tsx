// src/components/service-worker-register.tsx - Manual SW registration
// Timestamp: 2024-12-10

'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('[App] Service workers not supported');
      return;
    }
    
    // Register service worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        
        console.log('[App] Service Worker registered:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[App] Service Worker update found');
          
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[App] New Service Worker installed, refresh for update');
            }
          });
        });
      } catch (error) {
        console.error('[App] Service Worker registration failed:', error);
      }
    };
    
    // Register when page loads
    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
      return () => window.removeEventListener('load', registerSW);
    }
  }, []);
  
  return null;
}

