// src/app/(dashboard)/profile/notifications/page.tsx - Notification Settings
// Timestamp: 2024-12-10

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, BellOff, Smartphone, Loader2, Send, CheckCircle, XCircle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  
  const { 
    isSupported, 
    isSubscribed, 
    isLoading, 
    permission,
    subscribe, 
    unsubscribe 
  } = usePushNotifications();

  const sendTestNotification = async () => {
    setTestStatus('loading');
    try {
      const response = await fetch('/api/push/test', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        setTestStatus('success');
        setTestMessage(data.message || 'Notifica inviata!');
      } else {
        setTestStatus('error');
        setTestMessage(data.error || 'Errore nell\'invio');
      }
    } catch {
      setTestStatus('error');
      setTestMessage('Errore di connessione');
    }
    
    // Reset after 3 seconds
    setTimeout(() => {
      setTestStatus('idle');
      setTestMessage('');
    }, 3000);
  };

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="font-semibold text-gray-900">Notifiche Push</h1>
        </div>
      </header>

      <div className="px-4 py-6">
        {/* Status Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isSubscribed ? 'bg-success-100' : 'bg-gray-100'
            }`}>
              {isSubscribed ? (
                <Bell className="w-8 h-8 text-success" />
              ) : (
                <BellOff className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {isSubscribed ? 'Notifiche Attive' : 'Notifiche Disattivate'}
              </h2>
              <p className="text-sm text-gray-500">
                {isSubscribed 
                  ? 'Riceverai notifiche per i nuovi annunci' 
                  : 'Attiva per ricevere aggiornamenti istantanei'
                }
              </p>
            </div>
          </div>

          {!isSupported ? (
            <div className="bg-warning-50 text-warning-800 px-4 py-3 rounded-lg text-sm">
              Il tuo browser non supporta le notifiche push
            </div>
          ) : permission === 'denied' ? (
            <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg text-sm">
              Le notifiche sono bloccate. Abilita le notifiche nelle impostazioni del browser.
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleToggle}
                disabled={isLoading}
                className={`w-full btn-lg ${
                  isSubscribed ? 'btn-outline' : 'btn-primary'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isSubscribed ? (
                  'Disattiva Notifiche'
                ) : (
                  'Attiva Notifiche'
                )}
              </button>
              
              {/* Test Notification Button */}
              {isSubscribed && (
                <button
                  onClick={sendTestNotification}
                  disabled={testStatus === 'loading'}
                  className="w-full btn-lg bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                  {testStatus === 'loading' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : testStatus === 'success' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>{testMessage}</span>
                    </>
                  ) : testStatus === 'error' ? (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span>{testMessage}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Invia Notifica di Test</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-start gap-3">
            <Smartphone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                Come funzionano
              </h3>
              <p className="text-sm text-gray-500">
                Le notifiche push ti avvisano istantaneamente quando vengono trovati 
                nuovi annunci nelle tue campagne. Funzionano anche quando l'app è chiusa, 
                così non perderai mai un affare!
              </p>
            </div>
          </div>
        </motion.div>

        {/* PWA Install Hint */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-gray-400">
            💡 Tip: Installa l'app per un'esperienza migliore
          </p>
        </motion.div>
      </div>
    </div>
  );
}


