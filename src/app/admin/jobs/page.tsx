// src/app/admin/jobs/page.tsx - Monitoraggio Jobs Admin
// Timestamp: 2024-12-09

'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface JobStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export default function AdminJobsPage() {
  const [stats, setStats] = useState<JobStats>({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/jobs/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setError('Impossibile caricare le statistiche dei job');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobStats();
    const interval = setInterval(fetchJobStats, 10000); // Refresh ogni 10 secondi
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoraggio Jobs</h1>
          <p className="text-gray-500">Stato dei job di scraping</p>
        </div>
        <button
          onClick={fetchJobStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Aggiorna
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.waiting}</p>
              <p className="text-sm text-gray-500">In Attesa</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <RefreshCw className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-500">In Esecuzione</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-sm text-gray-500">Completati</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
              <p className="text-sm text-gray-500">Falliti</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informazioni</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            <AlertCircle className="w-4 h-4 inline mr-2 text-blue-500" />
            I job di scraping vengono eseguiti automaticamente in base alla frequenza configurata per ogni campagna.
          </p>
          <p>
            <AlertCircle className="w-4 h-4 inline mr-2 text-blue-500" />
            Il worker deve essere attivo per processare i job. Avvialo con <code className="bg-gray-100 px-2 py-1 rounded">npm run worker</code>
          </p>
        </div>
      </div>
    </div>
  );
}


