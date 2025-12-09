// src/app/admin/settings/page.tsx - Impostazioni Admin
// Timestamp: 2024-12-09

'use client';

import { useState } from 'react';
import { Save, Key, Bell, Database, Shield } from 'lucide-react';

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>
        <p className="text-gray-500">Configurazione del sistema</p>
      </div>

      {/* VAPID Keys */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Key className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">VAPID Keys (Push Notifications)</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Public Key
            </label>
            <input
              type="text"
              readOnly
              value={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'Non configurata'}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
            />
          </div>
          <p className="text-sm text-gray-500">
            Le chiavi VAPID sono configurate tramite variabili d'ambiente nel file .env
          </p>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Notifiche</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-500">Invia notifiche push ai dispositivi degli utenti</p>
            </div>
            <div className="w-12 h-6 bg-green-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Database */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Database className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Database</h2>
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Provider</span>
            <span className="font-medium">MySQL 8.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Host</span>
            <span className="font-medium font-mono">localhost:3306</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Database</span>
            <span className="font-medium font-mono">snipedeal</span>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Sicurezza</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">NextAuth Secret</p>
              <p className="text-sm text-gray-500">Chiave segreta per la sessione</p>
            </div>
            <span className="text-green-500 text-sm font-medium">Configurato ✓</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">JWT Strategy</p>
              <p className="text-sm text-gray-500">Metodo di autenticazione</p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">JWT</span>
          </div>
        </div>
      </div>
    </div>
  );
}


