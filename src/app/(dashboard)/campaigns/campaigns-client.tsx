// src/app/(dashboard)/campaigns/campaigns-client.tsx - UI Lista Campagne
// Timestamp: 2024-12-09

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Play, 
  Pause, 
  Trash2, 
  Edit,
  ChevronRight,
  Target,
  Filter,
  Zap,
  Bell,
  BellOff,
  X,
  Check,
  Copy
} from 'lucide-react';
import { platformConfig, formatRelativeDate } from '@/lib/utils';
import { QuickSearchModal } from '@/components/quick-search/QuickSearchModal';

interface SubKeyword {
  id?: string;
  model: string;
  exclude?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  notify: boolean;
}

interface Campaign {
  id: string;
  name: string;
  keyword: string;
  platform: string;
  isActive: boolean;
  lastRunAt: string | null;
  _count: { results: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  platformFilters?: any;
}

interface CampaignsClientProps {
  initialCampaigns: Campaign[];
  planLimits: {
    maxCampaigns: number;
    maxMarketplaces: number;
    planName: string;
  };
}

export function CampaignsClient({ initialCampaigns, planLimits }: CampaignsClientProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [subKeywordsOpen, setSubKeywordsOpen] = useState<string | null>(null);
  const [editingSubKeywords, setEditingSubKeywords] = useState<SubKeyword[]>([]);
  const [isSavingSubKeywords, setIsSavingSubKeywords] = useState(false);

  const filteredCampaigns = campaigns.filter(c => {
    if (filter === 'active') return c.isActive;
    if (filter === 'paused') return !c.isActive;
    return true;
  });

  const handleToggle = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setIsToggling(id);
    try {
      // Trova la campagna corrente per il suo stato
      const currentCampaign = campaigns.find(c => c.id === id);
      if (!currentCampaign) return;

      // Ottimistic update - aggiorna subito l'UI
      setCampaigns(campaigns.map(c =>
        c.id === id ? { ...c, isActive: !c.isActive } : c
      ));

      const res = await fetch(`/api/campaigns/${id}/toggle`, { method: 'POST' });

      if (!res.ok) {
        // Se fallisce, ripristina lo stato originale
        setCampaigns(campaigns.map(c =>
          c.id === id ? { ...c, isActive: currentCampaign.isActive } : c
        ));
        console.error('Failed to toggle campaign');
      } else {
        // Aggiorna con i dati dal server per assicurare consistenza
        const updatedCampaign = await res.json();
        setCampaigns(campaigns.map(c =>
          c.id === id ? { ...c, ...updatedCampaign } : c
        ));
      }
    } catch (error) {
      console.error('Error toggling campaign:', error);
      // Ripristina lo stato in caso di errore
      setCampaigns(campaigns.map(c =>
        c.id === id ? { ...c, isActive: c.isActive } : c
      ));
    }
    setIsToggling(null);
    setMenuOpen(null);
  };

  // Apri pannello subKeywords
  const openSubKeywords = (campaign: Campaign, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const subKeywords: SubKeyword[] = campaign.platformFilters?.subKeywords || [];
    setEditingSubKeywords(subKeywords.map((sk: SubKeyword, i: number) => ({ ...sk, id: sk.id || `sk-${i}` })));
    setSubKeywordsOpen(campaign.id);
  };

  // Salva subKeywords
  const saveSubKeywords = async (campaignId: string) => {
    setIsSavingSubKeywords(true);
    try {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) return;

      const updatedFilters = {
        ...campaign.platformFilters,
        subKeywords: editingSubKeywords.map(sk => ({
          model: sk.model,
          exclude: sk.exclude || null,
          minPrice: sk.minPrice,
          maxPrice: sk.maxPrice,
          notify: sk.notify,
        })),
      };

      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformFilters: updatedFilters }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCampaigns(campaigns.map(c => c.id === campaignId ? { ...c, ...updated } : c));
        setSubKeywordsOpen(null);
      }
    } catch (error) {
      console.error('Error saving subKeywords:', error);
    }
    setIsSavingSubKeywords(false);
  };

  // Toggle notify per singola subKeyword
  const toggleSubKeywordNotify = (skId: string) => {
    setEditingSubKeywords(editingSubKeywords.map(sk =>
      sk.id === skId ? { ...sk, notify: !sk.notify } : sk
    ));
  };

  // Update subKeyword field
  const updateSubKeywordField = (skId: string, field: keyof SubKeyword, value: string | number | null) => {
    setEditingSubKeywords(editingSubKeywords.map(sk =>
      sk.id === skId ? { ...sk, [field]: value } : sk
    ));
  };

  // Conta subKeywords con notify attivo
  const getNotifyCount = (campaign: Campaign) => {
    const subKeywords: SubKeyword[] = campaign.platformFilters?.subKeywords || [];
    return subKeywords.filter((sk: SubKeyword) => sk.notify).length;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa campagna?')) return;
    
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCampaigns(campaigns.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
    setIsDeleting(null);
    setMenuOpen(null);
  };

  const handleDuplicate = async (id: string) => {
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return;
    
    if (campaigns.length >= planLimits.maxCampaigns) {
      alert(`Hai raggiunto il limite di ${planLimits.maxCampaigns} campagne del piano ${planLimits.planName}`);
      setMenuOpen(null);
      return;
    }
    
    setIsDuplicating(id);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${campaign.name} (copia)`,
          keyword: campaign.keyword,
          platform: campaign.platform,
          platformFilters: campaign.platformFilters,
        }),
      });
      
      if (res.ok) {
        const newCampaign = await res.json();
        setCampaigns([newCampaign, ...campaigns]);
        router.push(`/campaigns/${newCampaign.id}/edit`);
      }
    } catch (error) {
      console.error('Error duplicating campaign:', error);
    }
    setIsDuplicating(null);
    setMenuOpen(null);
  };

  const canCreateMore = campaigns.length < planLimits.maxCampaigns;

  // Ascolta cambiamenti da altri componenti
  useEffect(() => {
    const handleCampaignToggle = (event: CustomEvent) => {
      const { id, isActive } = event.detail;
      setCampaigns(prev => prev.map(c =>
        c.id === id ? { ...c, isActive } : c
      ));
    };

    window.addEventListener('campaignToggled', handleCampaignToggle as EventListener);

    return () => {
      window.removeEventListener('campaignToggled', handleCampaignToggle as EventListener);
    };
  }, []);

  // Refresh periodico e quando la pagina diventa visibile
  useEffect(() => {
    const refreshCampaigns = async () => {
      try {
        const res = await fetch('/api/campaigns');
        if (res.ok) {
          const updatedCampaigns = await res.json();
          setCampaigns(updatedCampaigns);
        }
      } catch (error) {
        console.error('Error refreshing campaigns:', error);
      }
    };

    // Refresh immediato al mount
    refreshCampaigns();

    // Controlla se c'è un aggiornamento nel sessionStorage
    const checkSessionStorage = () => {
      try {
        const campaignUpdate = sessionStorage.getItem('campaignUpdated');
        if (campaignUpdate) {
          const { id, timestamp } = JSON.parse(campaignUpdate);
          // Se l'aggiornamento è recente (ultimi 10 secondi), forza refresh
          if (Date.now() - timestamp < 10000) {
            refreshCampaigns();
            sessionStorage.removeItem('campaignUpdated'); // Pulisci dopo l'uso
          }
        }
      } catch (error) {
        console.error('Error checking sessionStorage:', error);
      }
    };

    // Refresh periodico
    const interval = setInterval(refreshCampaigns, 30000); // Ogni 30 secondi

    // Refresh quando la pagina torna visibile (es. da router.back())
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSessionStorage(); // Controlla sessionStorage prima di fare refresh
        refreshCampaigns();
      }
    };

    // Refresh quando la finestra ottiene focus
    const handleFocus = () => {
      checkSessionStorage(); // Controlla sessionStorage prima di fare refresh
      refreshCampaigns();
    };

    // Controlla subito al mount
    checkSessionStorage();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <div className="px-4 pt-safe">
      {/* Header */}
      <header className="pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campagne</h1>
            <p className="text-sm text-gray-500">
              {campaigns.length}/{planLimits.maxCampaigns} campagne
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsQuickSearchOpen(true)}
              className="btn-secondary btn-md"
            >
              <Zap className="w-5 h-5 mr-1" />
              Ricerca Rapida
            </button>
            {canCreateMore && (
              <Link href="/campaigns/new" className="btn-primary btn-md">
                <Plus className="w-5 h-5 mr-1" />
                Nuova
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(['all', 'active', 'paused'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Tutte' : f === 'active' ? 'Attive' : 'In Pausa'}
            </button>
          ))}
        </div>
      </header>

      {/* Limit Warning */}
      {!canCreateMore && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-warning-50 border border-warning-200 text-warning-800 px-4 py-3 rounded-xl mb-4"
        >
          <p className="text-sm">
            Hai raggiunto il limite del piano {planLimits.planName}.{' '}
            <Link href="/pricing" className="font-semibold underline">
              Effettua l'upgrade
            </Link>
          </p>
        </motion.div>
      )}

      {/* Campaigns List */}
      {filteredCampaigns.length === 0 ? (
        <div className="empty-state py-16">
          <Target className="empty-state-icon" />
          <p className="empty-state-title">
            {filter === 'all' 
              ? 'Nessuna campagna' 
              : `Nessuna campagna ${filter === 'active' ? 'attiva' : 'in pausa'}`
            }
          </p>
          <p className="empty-state-description mb-4">
            {filter === 'all' 
              ? 'Crea la tua prima campagna per iniziare' 
              : 'Modifica i filtri per vedere altre campagne'
            }
          </p>
          {filter === 'all' && canCreateMore && (
            <Link href="/campaigns/new" className="btn-primary btn-md">
              Crea Campagna
            </Link>
          )}
        </div>
      ) : (
        <motion.div layout className="space-y-3 pb-8">
          <AnimatePresence>
            {filteredCampaigns.map((campaign) => {
              const platform = platformConfig[campaign.platform as keyof typeof platformConfig];
              
              return (
                <motion.div
                  key={campaign.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="card relative"
                >
                  <Link href={`/campaigns/${campaign.id}`} className="block">
                    <div className="flex items-start gap-3">
                      {/* Status Indicator */}
                      <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
                        campaign.isActive ? 'bg-success animate-pulse-soft' : 'bg-gray-300'
                      }`} />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div>
                            <h3 className="font-semibold text-gray-900">
                              {campaign.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                              {platform && <platform.icon size={16} className="text-gray-400" />}
                              {campaign.keyword}
                            </p>
                          </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Search className="w-4 h-4" />
                            {campaign._count.results} risultati
                          </div>
                          {campaign.lastRunAt && (
                            <div className="text-sm text-gray-400">
                              {formatRelativeDate(campaign.lastRunAt)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex items-center gap-1 mr-2">
                        {/* Play/Pause Button */}
                        <button
                          onClick={(e) => handleToggle(campaign.id, e)}
                          disabled={isToggling === campaign.id}
                          className={`p-2 rounded-lg transition-colors ${
                            campaign.isActive
                              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                              : 'bg-green-100 text-green-600 hover:bg-green-200'
                          } ${isToggling === campaign.id ? 'opacity-50' : ''}`}
                          title={campaign.isActive ? 'Metti in pausa' : 'Attiva'}
                        >
                          {isToggling === campaign.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : campaign.isActive ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>

                        {/* Notifications Button */}
                        {(campaign.platformFilters?.subKeywords?.length || 0) > 0 && (
                          <button
                            onClick={(e) => openSubKeywords(campaign, e)}
                            className={`p-2 rounded-lg transition-colors relative ${
                              getNotifyCount(campaign) > 0
                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                            title="Gestisci notifiche sub-keywords"
                          >
                            {getNotifyCount(campaign) > 0 ? (
                              <Bell className="w-4 h-4" />
                            ) : (
                              <BellOff className="w-4 h-4" />
                            )}
                            {getNotifyCount(campaign) > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                                {getNotifyCount(campaign)}
                              </span>
                            )}
                          </button>
                        )}

                        {/* Menu Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setMenuOpen(menuOpen === campaign.id ? null : campaign.id);
                          }}
                          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      <ChevronRight className="w-5 h-5 text-gray-300 mt-2" />
                    </div>
                  </Link>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {menuOpen === campaign.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute top-12 right-4 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10 min-w-[160px]"
                      >
                        <button
                          onClick={() => handleToggle(campaign.id)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          {campaign.isActive ? (
                            <>
                              <Pause className="w-4 h-4" />
                              Metti in pausa
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              Attiva
                            </>
                          )}
                        </button>
                        <Link
                          href={`/campaigns/${campaign.id}/edit`}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          onClick={() => setMenuOpen(null)}
                        >
                          <Edit className="w-4 h-4" />
                          Modifica
                        </Link>
                        <button
                          onClick={() => handleDuplicate(campaign.id)}
                          disabled={isDuplicating === campaign.id}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          {isDuplicating === campaign.id ? 'Duplicazione...' : 'Duplica'}
                        </button>
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          disabled={isDeleting === campaign.id}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          {isDeleting === campaign.id ? 'Eliminazione...' : 'Elimina'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Click outside to close menu */}
      {menuOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setMenuOpen(null)} 
        />
      )}

      {/* SubKeywords Inline Panel */}
      <AnimatePresence>
        {subKeywordsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSubKeywordsOpen(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-2xl max-h-[80vh] overflow-hidden shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-gray-900">Notifiche Sub-Keywords</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveSubKeywords(subKeywordsOpen)}
                    disabled={isSavingSubKeywords}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
                  >
                    {isSavingSubKeywords ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Salva
                  </button>
                  <button
                    onClick={() => setSubKeywordsOpen(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* SubKeywords List */}
              <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
                {editingSubKeywords.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Nessuna sub-keyword configurata
                  </p>
                ) : (
                  editingSubKeywords.map((sk) => (
                    <div
                      key={sk.id}
                      className="bg-gray-50 rounded-xl p-3 space-y-2"
                    >
                      {/* Row 1: Model + Notify */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={sk.model}
                            onChange={(e) => updateSubKeywordField(sk.id!, 'model', e.target.value)}
                            placeholder="Modello (es. 15 pro)"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                        <button
                          onClick={() => toggleSubKeywordNotify(sk.id!)}
                          className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${
                            sk.notify
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                          }`}
                          title={sk.notify ? 'Notifiche attive' : 'Notifiche disattivate'}
                        >
                          {sk.notify ? (
                            <Bell className="w-5 h-5" />
                          ) : (
                            <BellOff className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {/* Row 2: Min, Max, Exclude */}
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-3">
                          <input
                            type="number"
                            value={sk.minPrice ?? ''}
                            onChange={(e) => updateSubKeywordField(sk.id!, 'minPrice', e.target.value ? Number(e.target.value) : null)}
                            placeholder="Min €"
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            value={sk.maxPrice ?? ''}
                            onChange={(e) => updateSubKeywordField(sk.id!, 'maxPrice', e.target.value ? Number(e.target.value) : null)}
                            placeholder="Max €"
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                        <div className="col-span-6">
                          <input
                            type="text"
                            value={sk.exclude ?? ''}
                            onChange={(e) => updateSubKeywordField(sk.id!, 'exclude', e.target.value || null)}
                            placeholder="Escludi (es. rotto, difettoso)"
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer hint */}
              <div className="p-3 bg-gray-50 border-t text-xs text-gray-500 text-center">
                Modifica i parametri e tocca Salva per applicare
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Search Modal */}
      <QuickSearchModal 
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
      />
    </div>
  );
}


