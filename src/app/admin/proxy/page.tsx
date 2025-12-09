// src/app/admin/proxy/page.tsx - Gestione Proxy Admin
// Timestamp: 2024-12-09

'use client';

import { useState, useEffect } from 'react';
import { 
  Globe, 
  Shield, 
  RefreshCw, 
  Check, 
  X, 
  Plus,
  Settings,
  Zap,
  Activity,
  AlertCircle
} from 'lucide-react';

interface ProxyProvider {
  id: string;
  name: string;
  displayName: string;
  isEnabled: boolean;
  isDefault: boolean;
  config: {
    username?: string;
    authKey?: string;
    defaultCountry?: string;
  };
  _count: {
    usageLogs: number;
  };
}

interface TestResult {
  success: boolean;
  ip?: string;
  country?: string;
  city?: string;
  latencyMs?: number;
  error?: string;
}

export default function AdminProxyPage() {
  const [providers, setProviders] = useState<ProxyProvider[]>([]);
  const [supportedProviders, setSupportedProviders] = useState<{name: string; displayName: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [serverIp, setServerIp] = useState<TestResult | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state per Packetstream
  const [formData, setFormData] = useState({
    id: '',
    name: 'packetstream',
    displayName: 'Packetstream',
    isEnabled: true,
    isDefault: true,
    username: '',
    authKey: '',
    defaultCountry: 'Italy',
  });

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/proxy/providers', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers);
        setSupportedProviders(data.supportedProviders);
      } else {
        setError('Errore nel caricamento dei provider');
      }
    } catch (err) {
      setError('Errore nel caricamento dei provider');
    } finally {
      setLoading(false);
    }
  };

  const fetchServerIp = async () => {
    try {
      const res = await fetch('/api/admin/proxy/test', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setServerIp(data);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchProviders();
    fetchServerIp();
  }, []);

  const testProvider = async (providerId: string) => {
    setTesting(providerId);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/proxy/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, country: 'Italy' }),
        credentials: 'include',
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, error: 'Errore di connessione' });
    } finally {
      setTesting(null);
    }
  };

  const toggleProvider = async (provider: ProxyProvider) => {
    try {
      await fetch(`/api/admin/proxy/providers/${provider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !provider.isEnabled }),
        credentials: 'include',
      });
      fetchProviders();
    } catch {
      setError('Errore nell\'aggiornamento');
    }
  };

  const saveProvider = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/proxy/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.id || undefined,
          name: formData.name,
          displayName: formData.displayName,
          isEnabled: formData.isEnabled,
          isDefault: formData.isDefault,
          config: {
            username: formData.username,
            authKey: formData.authKey,
            defaultCountry: formData.defaultCountry,
          },
        }),
        credentials: 'include',
      });

      if (res.ok) {
        setShowForm(false);
        fetchProviders();
        // Reset form
        setFormData({
          id: '',
          name: 'packetstream',
          displayName: 'Packetstream',
          isEnabled: true,
          isDefault: true,
          username: '',
          authKey: '',
          defaultCountry: 'Italy',
        });
      } else {
        const data = await res.json();
        setError(data.error || 'Errore nel salvataggio');
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setSaving(false);
    }
  };

  const editProvider = (provider: ProxyProvider) => {
    setFormData({
      id: provider.id,
      name: provider.name,
      displayName: provider.displayName,
      isEnabled: provider.isEnabled,
      isDefault: provider.isDefault,
      username: provider.config.username || '',
      authKey: provider.config.authKey || '',
      defaultCountry: provider.config.defaultCountry || 'Italy',
    });
    setShowForm(true);
  };

  const deleteProvider = async (providerId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo provider?')) return;
    
    try {
      await fetch(`/api/admin/proxy/providers/${providerId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchProviders();
    } catch {
      setError('Errore nell\'eliminazione');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Proxy</h1>
          <p className="text-gray-500">Configura i provider proxy per lo scraping</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Aggiungi Provider
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Server IP Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">IP Server</h2>
        </div>
        {serverIp ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">IP:</span>
              <span className="ml-2 font-mono font-medium">{serverIp.ip || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Paese:</span>
              <span className="ml-2 font-medium">{serverIp.country || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Città:</span>
              <span className="ml-2 font-medium">{serverIp.city || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500">Latenza:</span>
              <span className="ml-2 font-medium">{serverIp.latencyMs || 0}ms</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Caricamento...</p>
        )}
        <p className="mt-3 text-xs text-gray-400">
          Questo è l'IP del server senza proxy. Lo scraping userà il proxy per nascondere questo IP.
        </p>
      </div>

      {/* Provider List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Provider Configurati</h2>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Caricamento...</div>
        ) : providers.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">Nessun provider configurato</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-primary font-medium hover:underline"
            >
              Aggiungi il primo provider
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`border rounded-xl p-4 ${
                  provider.isEnabled ? 'border-green-200 bg-green-50/50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      provider.isEnabled ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{provider.displayName}</h3>
                        {provider.isDefault && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {provider.config.username ? `@${provider.config.username}` : 'Non configurato'} 
                        {' • '}{provider._count.usageLogs} richieste totali
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => testProvider(provider.id)}
                      disabled={testing === provider.id || !provider.isEnabled}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 disabled:opacity-50"
                    >
                      {testing === provider.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      Test
                    </button>
                    <button
                      onClick={() => editProvider(provider)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleProvider(provider)}
                      className={`p-2 rounded-lg ${
                        provider.isEnabled 
                          ? 'text-green-600 hover:bg-green-100' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {provider.isEnabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Test Result */}
                {testResult && testing === null && providers.findIndex(p => p.id === provider.id) === providers.findIndex(p => 
                  testing === p.id || (testResult && providers[0]?.id === provider.id)
                ) && (
                  <div className={`mt-4 p-3 rounded-lg ${
                    testResult.success ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                      <span className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                        {testResult.success 
                          ? `IP: ${testResult.ip} (${testResult.country}) - ${testResult.latencyMs}ms`
                          : testResult.error
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {formData.id ? 'Modifica Provider' : 'Nuovo Provider'}
            </h3>

            <div className="space-y-4">
              {/* Provider Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo Provider
                </label>
                <select
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={!!formData.id}
                >
                  {supportedProviders.map((p) => (
                    <option key={p.name} value={p.name}>{p.displayName}</option>
                  ))}
                </select>
              </div>

              {/* Packetstream Fields */}
              {formData.name === 'packetstream' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Il tuo username Packetstream"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auth Key
                    </label>
                    <input
                      type="password"
                      value={formData.authKey}
                      onChange={(e) => setFormData({ ...formData, authKey: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="La tua auth key"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paese Default
                    </label>
                    <select
                      value={formData.defaultCountry}
                      onChange={(e) => setFormData({ ...formData, defaultCountry: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="Italy">Italia</option>
                      <option value="Germany">Germania</option>
                      <option value="France">Francia</option>
                      <option value="Spain">Spagna</option>
                      <option value="United Kingdom">Regno Unito</option>
                    </select>
                  </div>
                </>
              )}

              {/* Enabled Toggle */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-700">Abilitato</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isEnabled: !formData.isEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.isEnabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    formData.isEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Default Toggle */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-700">Provider Default</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.isDefault ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    formData.isDefault ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={saveProvider}
                disabled={saving || !formData.username || !formData.authKey}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>

            {/* Delete button for existing providers */}
            {formData.id && (
              <button
                onClick={() => {
                  deleteProvider(formData.id);
                  setShowForm(false);
                }}
                className="w-full mt-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Elimina Provider
              </button>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Come funziona il proxy?</p>
            <p>
              Il proxy viene utilizzato <strong>automaticamente per tutti gli utenti</strong> durante 
              lo scraping. Protegge l'IP del server e garantisce un funzionamento affidabile.
              Gli utenti non vedono questa configurazione.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

