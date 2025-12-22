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
  RefreshCw
} from 'lucide-react';
import { platformConfig, formatRelativeDate } from '@/lib/utils';
import { QuickSearchModal } from '@/components/quick-search/QuickSearchModal';

interface Campaign {
  id: string;
  name: string;
  keyword: string;
  platform: string;
  platforms?: string[]; // Per gruppi multi-platform
  groupId?: string | null;
  isActive: boolean;
  lastRunAt: string | null;
  _count: { results: number };
}

// Aggrega campagne per groupId
function aggregateCampaignsByGroup(campaigns: Campaign[]): Campaign[] {
  const grouped = new Map<string, Campaign[]>();
  const standalone: Campaign[] = [];

  // Separa campagne con groupId da quelle standalone
  campaigns.forEach(c => {
    if (c.groupId) {
      const existing = grouped.get(c.groupId) || [];
      existing.push(c);
      grouped.set(c.groupId, existing);
    } else {
      standalone.push(c);
    }
  });

  // Crea campagne aggregate per ogni gruppo
  const aggregated: Campaign[] = [];
  grouped.forEach((groupCampaigns, groupId) => {
    if (groupCampaigns.length === 0) return;
    
    // Usa la prima campagna come base, aggrega le altre
    const first = groupCampaigns[0];
    const aggregatedCampaign: Campaign = {
      id: groupId, // Usa groupId come id per il link
      name: first.name.replace(/ - (SUBITO|EBAY|VINTED|WALLAPOP)$/, ''), // Rimuovi suffisso piattaforma
      keyword: first.keyword,
      platform: groupCampaigns.map(c => c.platform).join(','), // Per compatibilità
      platforms: groupCampaigns.map(c => c.platform), // Array piattaforme
      groupId: groupId,
      isActive: groupCampaigns.some(c => c.isActive), // Attivo se almeno una è attiva
      lastRunAt: groupCampaigns.reduce((latest, c) => {
        if (!c.lastRunAt) return latest;
        if (!latest) return c.lastRunAt;
        return new Date(c.lastRunAt) > new Date(latest) ? c.lastRunAt : latest;
      }, null as string | null),
      _count: {
        results: groupCampaigns.reduce((sum, c) => sum + c._count.results, 0)
      }
    };
    aggregated.push(aggregatedCampaign);
  });

  return [...aggregated, ...standalone];
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
  const [rawCampaigns, setRawCampaigns] = useState(initialCampaigns);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);

  // Aggrega campagne per gruppo
  const campaigns = aggregateCampaignsByGroup(rawCampaigns);

  const filteredCampaigns = campaigns.filter(c => {
    if (filter === 'active') return c.isActive;
    if (filter === 'paused') return !c.isActive;
    return true;
  });

  const handleToggle = async (id: string, groupId?: string | null) => {
    setIsToggling(id);
    setMenuOpen(null);
    
    try {
      // Optimistic update
      const currentCampaign = campaigns.find(c => c.id === id);
      if (currentCampaign) {
        const newIsActive = !currentCampaign.isActive;
        if (groupId) {
          setRawCampaigns(prev => prev.map(c =>
            c.groupId === groupId ? { ...c, isActive: newIsActive } : c
          ));
        } else {
          setRawCampaigns(prev => prev.map(c =>
            c.id === id ? { ...c, isActive: newIsActive } : c
          ));
        }
      }
      
      const res = await fetch(`/api/campaigns/${id}/toggle`, { method: 'POST' });
      if (!res.ok) {
        // Rollback on error
        router.refresh();
      }
    } catch (error) {
      console.error('Error toggling campaign:', error);
      router.refresh();
    }
    setIsToggling(null);
  };

  const handleDelete = async (id: string, groupId?: string | null) => {
    if (!confirm('Sei sicuro di voler eliminare questa campagna?')) return;
    
    setIsDeleting(id);
    try {
      const deleteId = groupId || id;
      const res = await fetch(`/api/campaigns/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
    setIsDeleting(null);
    setMenuOpen(null);
  };

  const canCreateMore = campaigns.length < planLimits.maxCampaigns;

  // Ascolta cambiamenti da altri componenti
  useEffect(() => {
    const handleCampaignToggle = (event: CustomEvent) => {
      const { id, isActive } = event.detail;
      setRawCampaigns(prev => prev.map(c =>
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
          setRawCampaigns(updatedCampaigns);
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
              // Per campagne multi-platform, usa l'array platforms
              const platforms = campaign.platforms || [campaign.platform];
              const isMultiPlatform = platforms.length > 1;
              
              return (
                <motion.div
                  key={campaign.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="card relative"
                >
                  <Link href={`/campaigns/${campaign.groupId || campaign.id}`} className="block">
                    <div className="flex items-start gap-3">
                      {/* Status Indicator */}
                      <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
                        campaign.isActive ? 'bg-success animate-pulse-soft' : 'bg-gray-300'
                      }`} />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {campaign.name}
                            </h3>
                            <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                              {/* Platform badges */}
                              <div className="flex items-center gap-1">
                                {platforms.map((p) => {
                                  const pConfig = platformConfig[p as keyof typeof platformConfig];
                                  return pConfig ? (
                                    <span key={p} className="flex items-center" title={pConfig.name}>
                                      <pConfig.icon size={16} className="text-gray-400" />
                                    </span>
                                  ) : null;
                                })}
                              </div>
                              <span>{campaign.keyword}</span>
                              {isMultiPlatform && (
                                <span className="px-1.5 py-0.5 bg-primary-100 text-primary text-xs rounded font-medium">
                                  Multi
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Menu Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setMenuOpen(menuOpen === campaign.id ? null : campaign.id);
                            }}
                            className="p-2 -m-2 text-gray-400 hover:text-gray-600"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Search className="w-4 h-4" />
                            {campaign._count.results} risultati
                          </div>
                          {campaign.lastRunAt && (
                            <div className="text-sm text-gray-400" suppressHydrationWarning>
                              {formatRelativeDate(campaign.lastRunAt)}
                            </div>
                          )}
                        </div>
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
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-12 right-4 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20 min-w-[160px]"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggle(campaign.id, campaign.groupId);
                          }}
                          disabled={isToggling === campaign.id}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                        >
                          {isToggling === campaign.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Aggiornamento...
                            </>
                          ) : campaign.isActive ? (
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(campaign.id, campaign.groupId);
                          }}
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

      {/* Quick Search Modal */}
      <QuickSearchModal 
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
      />
    </div>
  );
}


