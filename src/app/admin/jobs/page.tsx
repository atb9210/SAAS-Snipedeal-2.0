// src/app/admin/jobs/page.tsx - Monitoraggio Jobs Admin
// Timestamp: 2024-12-12

'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, Copy, Check, Activity, HardDrive, Zap, TrendingUp, Server, Pause, Play, Trash2, RotateCcw } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';

interface JobStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

interface JobDetail {
  id: string;
  name: string;
  state: string;
  data: {
    campaignId?: string;
    userId?: string;
  };
  campaignName?: string;
  campaignLastRunAt?: number;
  campaignNextRunAt?: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  returnvalue?: any;
  attemptsMade: number;
  delay?: number;
}

// Worker Status types
interface WorkerMetrics {
  timestamp: number;
  uptime: number;
  uptimeFormatted: string;
  jobsProcessed: number;
  jobsSucceeded: number;
  jobsFailed: number;
  errorRate: string;
  avgJobDuration: number;
  lastJobDuration: number;
  currentJob: string | null;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  pid: number;
}

interface WorkerStatus {
  online: boolean;
  status: 'running' | 'idle' | 'processing' | 'offline' | 'unknown';
  lastHeartbeat: number | null;
  lastHeartbeatAgo: string | null;
  metrics: WorkerMetrics | null;
}

// Job Metrics types
interface JobMetrics {
  last24h: {
    total: number;
    succeeded: number;
    failed: number;
    cancelled: number;
    avgDuration: number;
    errorRate: string;
  };
  lastHour: {
    total: number;
    succeeded: number;
    failed: number;
  };
  hourlyStats: Array<{
    hour: string;
    total: number;
    succeeded: number;
    failed: number;
  }>;
  topCampaigns: Array<{
    id: string;
    name: string;
    jobCount: number;
    successRate: string;
  }>;
  recentErrors: Array<{
    id: string;
    campaignId: string;
    campaignName: string;
    error: string;
    timestamp: string;
  }>;
}

export default function AdminJobsPage() {
  const [stats, setStats] = useState<JobStats>({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
    paused: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobDetail[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [filterState, setFilterState] = useState<string>('all');
  const [copiedJobId, setCopiedJobId] = useState<string | null>(null);
  
  // Worker status e metrics
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null);
  const [jobMetrics, setJobMetrics] = useState<JobMetrics | null>(null);
  
  // Queue control
  const [isPaused, setIsPaused] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchQueueStatus = async () => {
    try {
      const res = await fetch('/api/admin/jobs/actions', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setIsPaused(data.isPaused);
      }
    } catch (err) {
      console.error('Error fetching queue status:', err);
    }
  };

  const executeAction = async (action: string, jobId?: string, state?: string) => {
    setActionLoading(jobId || action);
    try {
      const res = await fetch('/api/admin/jobs/actions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, jobId, state }),
      });
      
      if (res.ok) {
        // Refresh data dopo azione
        refreshAll();
        fetchQueueStatus();
      } else {
        const data = await res.json();
        setError(data.error || 'Azione fallita');
      }
    } catch (err) {
      setError('Errore durante azione');
    } finally {
      setActionLoading(null);
    }
  };

  const fetchWorkerStatus = async () => {
    try {
      const res = await fetch('/api/admin/worker/status', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setWorkerStatus(data);
      }
    } catch (err) {
      console.error('Error fetching worker status:', err);
    }
  };

  const fetchJobMetrics = async () => {
    try {
      const res = await fetch('/api/admin/jobs/metrics', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setJobMetrics(data);
      }
    } catch (err) {
      console.error('Error fetching job metrics:', err);
    }
  };

  const fetchJobStats = async () => {
    setLoading(true);
    setError(null); // Reset errore prima di ogni chiamata
    try {
      const res = await fetch('/api/admin/jobs/stats', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || 'Impossibile caricare le statistiche dei job');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs/list?state=${filterState}&limit=100`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setJobsLoading(false);
    }
  };

  const copyJobId = async (jobId: string) => {
    try {
      await navigator.clipboard.writeText(jobId);
      setCopiedJobId(jobId);
      setTimeout(() => setCopiedJobId(null), 2000);
    } catch (err) {
      console.error('Failed to copy job ID:', err);
    }
  };

  const truncateId = (id: string, maxLength: number = 12) => {
    if (id.length <= maxLength) return id;
    return `${id.substring(0, maxLength)}...`;
  };

  const formatDateRelative = (timestamp?: number) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const absDiffMs = Math.abs(diffMs);
    
    // Calcola differenze
    const diffSecs = Math.floor(absDiffMs / 1000);
    const diffMins = Math.floor(absDiffMs / 60000);
    const diffHours = Math.floor(absDiffMs / 3600000);
    
    // Se è nel futuro
    if (diffMs > 0) {
      if (diffSecs < 60) return 'tra pochi sec';
      if (diffMins < 60) return `tra ${diffMins} min`;
      if (diffHours < 24) return `tra ${diffHours}h ${diffMins % 60}m`;
      return date.toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
    
    // Se è nel passato
    if (diffSecs < 60) return 'ora';
    if (diffMins < 60) return `${diffMins} min fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    
    return formatRelativeDate(date);
  };

  const getStateLabel = (state: string) => {
    const labels: Record<string, string> = {
      completed: 'Completato',
      failed: 'Fallito',
      delayed: 'Schedulato',
      active: 'In Esecuzione',
      waiting: 'In Attesa',
      paused: 'In Pausa',
    };
    return labels[state] || state;
  };
  
  const getStateIcon = (state: string) => {
    switch (state) {
      case 'active':
        return <RefreshCw className="w-3 h-3 animate-spin inline-block mr-1" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 inline-block mr-1" />;
      case 'failed':
        return <XCircle className="w-3 h-3 inline-block mr-1" />;
      case 'delayed':
        return <Clock className="w-3 h-3 inline-block mr-1" />;
      default:
        return null;
    }
  };

  const getStateColor = (state: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      delayed: 'bg-purple-100 text-purple-800',
      active: 'bg-blue-100 text-blue-800',
      waiting: 'bg-yellow-100 text-yellow-800',
      paused: 'bg-gray-100 text-gray-800',
    };
    return colors[state] || 'bg-gray-100 text-gray-800';
  };

  const refreshAll = () => {
    setLastRefresh(new Date());
    fetchJobStats();
    fetchJobs();
    fetchWorkerStatus();
    fetchJobMetrics();
    fetchQueueStatus();
  };

  useEffect(() => {
    // Refresh immediato al mount e quando cambia filter
    refreshAll();
    
    // Refresh automatico ogni 3 secondi (più reattivo)
    const interval = setInterval(refreshAll, 3000);
    
    // Refresh quando la pagina torna in focus (utente torna alla tab)
    const handleFocus = () => refreshAll();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [filterState]);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 max-w-full">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 truncate">Monitoraggio Jobs</h1>
              <p className="text-gray-500 truncate">Stato dei job di scraping</p>
            </div>
            {/* Indicatore auto-refresh */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Auto-refresh attivo"></div>
              <span className="hidden sm:inline">
                Aggiornato {lastRefresh.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Pause/Resume Queue */}
          <button
            onClick={() => executeAction(isPaused ? 'resume' : 'pause')}
            disabled={actionLoading !== null}
            className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-lg disabled:opacity-50 flex-shrink-0 ${
              isPaused 
                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
                : 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
            }`}
            title={isPaused ? 'Riprendi coda' : 'Pausa coda'}
          >
            {actionLoading === 'pause' || actionLoading === 'resume' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isPaused ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{isPaused ? 'Riprendi' : 'Pausa'}</span>
          </button>

          {/* Clean completed jobs */}
          <button
            onClick={() => executeAction('clean', undefined, 'completed')}
            disabled={actionLoading !== null || stats.completed === 0}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 flex-shrink-0"
            title="Pulisci job completati"
          >
            {actionLoading === 'clean' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Pulisci</span>
          </button>

          {/* Refresh */}
          <button
            onClick={refreshAll}
            disabled={loading || jobsLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex-shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading || jobsLoading ? 'animate-spin' : ''}`} />
            Aggiorna
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Worker Status Widget */}
      <div className={`rounded-xl shadow-sm p-4 sm:p-6 ${workerStatus?.online ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' : 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Status principale */}
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${workerStatus?.online ? 'bg-green-100' : 'bg-red-100'}`}>
              <Server className={`w-8 h-8 ${workerStatus?.online ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Worker Status</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  workerStatus?.online 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {workerStatus?.online ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {workerStatus?.online 
                  ? `Stato: ${workerStatus.status === 'processing' ? 'In elaborazione' : workerStatus.status === 'idle' ? 'In attesa' : workerStatus.status}` 
                  : 'Worker non raggiungibile'}
                {workerStatus?.lastHeartbeatAgo && ` • Ultimo battito: ${workerStatus.lastHeartbeatAgo}`}
              </p>
            </div>
          </div>

          {/* Metriche Worker */}
          {workerStatus?.online && workerStatus.metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-1">
                  <Activity className="w-3 h-3" />
                  Uptime
                </div>
                <p className="text-sm font-semibold text-gray-900">{workerStatus.metrics.uptimeFormatted}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-1">
                  <Zap className="w-3 h-3" />
                  Jobs
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {workerStatus.metrics.jobsSucceeded}/{workerStatus.metrics.jobsProcessed}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-1">
                  <TrendingUp className="w-3 h-3" />
                  Durata Media
                </div>
                <p className="text-sm font-semibold text-gray-900">{workerStatus.metrics.avgJobDuration}ms</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-1">
                  <HardDrive className="w-3 h-3" />
                  Memoria
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {workerStatus.metrics.memory.heapUsed}MB / {workerStatus.metrics.memory.rss}MB
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metriche 24h Widget */}
      {jobMetrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Ultime 24h</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{jobMetrics.last24h.total}</p>
            <p className="text-xs text-gray-500">
              {jobMetrics.last24h.succeeded} successi, {jobMetrics.last24h.failed} falliti
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Ultima Ora</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{jobMetrics.lastHour.total}</p>
            <p className="text-xs text-gray-500">
              {jobMetrics.lastHour.succeeded} successi, {jobMetrics.lastHour.failed} falliti
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Durata Media</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{jobMetrics.last24h.avgDuration}ms</p>
            <p className="text-xs text-gray-500">Tempo medio esecuzione</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg ${parseFloat(jobMetrics.last24h.errorRate) > 5 ? 'bg-red-100' : 'bg-green-100'}`}>
                <AlertCircle className={`w-4 h-4 ${parseFloat(jobMetrics.last24h.errorRate) > 5 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">Error Rate</span>
            </div>
            <p className={`text-2xl font-bold ${parseFloat(jobMetrics.last24h.errorRate) > 5 ? 'text-red-600' : 'text-gray-900'}`}>
              {jobMetrics.last24h.errorRate}%
            </p>
            <p className="text-xs text-gray-500">Percentuale fallimenti</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-full">
        <div className="bg-white rounded-xl shadow-sm p-6 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold text-gray-900 truncate">{stats.delayed}</p>
              <p className="text-sm text-gray-500 truncate">Schedulati</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold text-gray-900 truncate">{stats.waiting}</p>
              <p className="text-sm text-gray-500 truncate">In Attesa</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
              <RefreshCw className="w-6 h-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold text-gray-900 truncate">{stats.active}</p>
              <p className="text-sm text-gray-500 truncate">In Esecuzione</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 bg-green-100 rounded-lg flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold text-gray-900 truncate">{stats.completed}</p>
              <p className="text-sm text-gray-500 truncate">Completati</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 bg-red-100 rounded-lg flex-shrink-0">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold text-gray-900 truncate">{stats.failed}</p>
              <p className="text-sm text-gray-500 truncate">Falliti</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 bg-gray-100 rounded-lg flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-gray-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold text-gray-900 truncate">{stats.paused}</p>
              <p className="text-sm text-gray-500 truncate">In Pausa</p>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">Dettagli Job</h2>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm flex-shrink-0"
          >
            <option value="all">Tutti</option>
            <option value="completed">Completati</option>
            <option value="failed">Falliti</option>
            <option value="delayed">Schedulati</option>
            <option value="active">In Esecuzione</option>
            <option value="waiting">In Attesa</option>
            <option value="paused">In Pausa</option>
          </select>
        </div>

        {jobsLoading ? (
          <div className="text-center py-8 text-gray-500">Caricamento...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nessun job trovato</div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Stato</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Campagna</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Tempo</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Durata</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700 text-center">Retry</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  // Calcola durata job
                  const duration = job.finishedOn && job.processedOn 
                    ? job.finishedOn - job.processedOn 
                    : job.processedOn 
                      ? Date.now() - job.processedOn 
                      : null;
                  
                  return (
                    <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                      {/* Stato */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStateColor(job.state)}`}>
                          {getStateIcon(job.state)}
                          {getStateLabel(job.state)}
                        </span>
                      </td>
                      
                      {/* Campagna */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 truncate max-w-[180px]" title={job.campaignName}>
                            {job.campaignName || 'N/A'}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            {truncateId(job.id, 16)}
                          </span>
                        </div>
                      </td>
                      
                      {/* Tempo (creato/completato relativo) */}
                      <td className="py-3 px-3 text-gray-600 text-xs">
                        {job.state === 'completed' || job.state === 'failed' ? (
                          <span>{formatDateRelative(job.finishedOn || job.processedOn)}</span>
                        ) : job.state === 'active' ? (
                          <span className="text-blue-600 font-medium">in corso...</span>
                        ) : (
                          <span>{formatDateRelative(job.timestamp)}</span>
                        )}
                      </td>
                      
                      {/* Durata */}
                      <td className="py-3 px-3 text-gray-600 text-xs">
                        {duration !== null ? (
                          <span className={job.state === 'active' ? 'text-blue-600' : ''}>
                            {duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      
                      {/* Tentativi */}
                      <td className="py-3 px-3 text-center">
                        {job.attemptsMade > 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                            {job.attemptsMade}
                          </span>
                        ) : (
                          <span className="text-gray-300">0</span>
                        )}
                      </td>
                      
                      {/* Azioni */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          {/* Mostra errore se presente */}
                          {job.failedReason && (
                            <span className="text-xs text-red-600 truncate max-w-[120px]" title={job.failedReason}>
                              {job.failedReason.substring(0, 20)}...
                            </span>
                          )}
                          
                          {/* Copy ID */}
                          <button
                            onClick={() => copyJobId(job.id)}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                            title="Copia ID"
                          >
                            {copiedJobId === job.id ? (
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          
                          {/* Retry per job falliti */}
                          {job.state === 'failed' && (
                            <button
                              onClick={() => executeAction('retry', job.id)}
                              disabled={actionLoading === job.id}
                              className="p-1.5 hover:bg-blue-50 rounded text-blue-500 hover:text-blue-700"
                              title="Riprova"
                            >
                              {actionLoading === job.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Errori Recenti e Campagne Attive */}
      {jobMetrics && (jobMetrics.recentErrors.length > 0 || jobMetrics.topCampaigns.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Errori Recenti */}
          {jobMetrics.recentErrors.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Errori Recenti
              </h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {jobMetrics.recentErrors.slice(0, 5).map((error) => (
                  <div key={error.id} className="bg-red-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{error.campaignName}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(error.timestamp).toLocaleString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-red-700 font-mono truncate" title={error.error}>
                      {error.error}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Campagne */}
          {jobMetrics.topCampaigns.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Campagne Più Attive (24h)
              </h2>
              <div className="space-y-3">
                {jobMetrics.topCampaigns.map((campaign, idx) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                        idx === 1 ? 'bg-gray-200 text-gray-700' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{campaign.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">{campaign.jobCount} jobs</span>
                      <span className={`text-sm font-medium ${
                        parseFloat(campaign.successRate) >= 90 ? 'text-green-600' :
                        parseFloat(campaign.successRate) >= 70 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {campaign.successRate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
          <p>
            <AlertCircle className="w-4 h-4 inline mr-2 text-yellow-500" />
            <strong>Schedulati:</strong> Job programmati per esecuzione futura. <strong>In Attesa:</strong> Job pronti per essere eseguiti immediatamente.
          </p>
          <p>
            <AlertCircle className="w-4 h-4 inline mr-2 text-yellow-500" />
            <strong>Completati/Falliti:</strong> Mostra gli ultimi 100/50 job (configurazione BullMQ).
          </p>
        </div>
      </div>
    </div>
  );
}


