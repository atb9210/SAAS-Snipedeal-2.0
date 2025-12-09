// src/app/(dashboard)/campaigns/campaigns-client.tsx - UI Lista Campagne
// Timestamp: 2024-12-09

'use client';

import { useState } from 'react';
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
  Filter
} from 'lucide-react';
import { platformConfig, formatRelativeDate } from '@/lib/utils';

interface Campaign {
  id: string;
  name: string;
  keyword: string;
  platform: string;
  isActive: boolean;
  lastRunAt: string | null;
  _count: { results: number };
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

  const filteredCampaigns = campaigns.filter(c => {
    if (filter === 'active') return c.isActive;
    if (filter === 'paused') return !c.isActive;
    return true;
  });

  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}/toggle`, { method: 'POST' });
      if (res.ok) {
        setCampaigns(campaigns.map(c => 
          c.id === id ? { ...c, isActive: !c.isActive } : c
        ));
      }
    } catch (error) {
      console.error('Error toggling campaign:', error);
    }
    setMenuOpen(null);
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

  const canCreateMore = campaigns.length < planLimits.maxCampaigns;

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
          {canCreateMore && (
            <Link href="/campaigns/new" className="btn-primary btn-md">
              <Plus className="w-5 h-5 mr-1" />
              Nuova
            </Link>
          )}
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
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {campaign.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {platform?.icon} {campaign.keyword}
                            </p>
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
                            <div className="text-sm text-gray-400">
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
    </div>
  );
}


