// src/app/(dashboard)/campaigns/[id]/campaign-detail-client.tsx - UI Dettaglio Campagna
// Timestamp: 2024-12-09

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Play,
  Pause,
  Settings,
  ExternalLink,
  Clock,
  MapPin,
  Tag,
  TrendingUp,
  RefreshCw,
  Filter,
  ChevronDown
} from 'lucide-react';
import { platformConfig, formatPrice, formatRelativeDate } from '@/lib/utils';
import FavoriteButton from '@/components/favorite-button';

interface Result {
  id: string;
  title: string;
  price: string | null;
  location: string | null;
  link: string;
  image: string | null;
  isNew: boolean;
  notified: boolean;
  createdAt: string;
  isFavorited?: boolean; // Add favorite status
}

interface Campaign {
  id: string;
  name: string;
  keyword: string;
  platform: string;
  minPrice: number | null;
  maxPrice: number | null;
  region: string | null;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  results: Result[];
  _count: { results: number };
}

interface CampaignDetailClientProps {
  campaign: Campaign;
  frequencyMins: number;
}

export function CampaignDetailClient({ campaign, frequencyMins }: CampaignDetailClientProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(campaign.isActive);
  const [isToggling, setIsToggling] = useState(false);
  const [results, setResults] = useState(campaign.results);
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState<'all' | 'new'>('all');

  const platform = platformConfig[campaign.platform as keyof typeof platformConfig];

  const handleToggle = async () => {
    setIsToggling(true);

    // Ottimistic update - aggiorna subito l'UI
    const newStatus = !isActive;
    setIsActive(newStatus);

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/toggle`, { method: 'POST' });

      if (!res.ok) {
        // Se fallisce, ripristina lo stato originale
        setIsActive(!newStatus);
        console.error('Failed to toggle campaign');
      } else {
        // Aggiorna con i dati dal server
        const updatedCampaign = await res.json();
        setIsActive(updatedCampaign.isActive);

        // Salva nel sessionStorage che c'è stato un cambiamento
        sessionStorage.setItem('campaignUpdated', JSON.stringify({
          id: campaign.id,
          isActive: updatedCampaign.isActive,
          timestamp: Date.now()
        }));

        // Notifica altri componenti del cambiamento
        window.dispatchEvent(new CustomEvent('campaignToggled', {
          detail: {
            id: campaign.id,
            isActive: updatedCampaign.isActive
          }
        }));
      }
    } catch (error) {
      // Ripristina lo stato in caso di errore
      setIsActive(!newStatus);
      console.error('Error toggling:', error);
    }
    setIsToggling(false);
  };

  // Ascolta cambiamenti da altri componenti
  useEffect(() => {
    const handleCampaignToggle = (event: CustomEvent) => {
      if (event.detail.id === campaign.id) {
        setIsActive(event.detail.isActive);
      }
    };

    window.addEventListener('campaignToggled', handleCampaignToggle as EventListener);

    return () => {
      window.removeEventListener('campaignToggled', handleCampaignToggle as EventListener);
    };
  }, [campaign.id]);

  const filteredResults = filter === 'new' 
    ? results.filter(r => r.isNew)
    : results;

  const formatFrequency = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    if (mins === 60) return '1 ora';
    return `${mins / 60} ore`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 truncate">
              {campaign.name}
            </h1>
            <p className="text-sm text-gray-500">
              {platform?.icon} {campaign.keyword}
            </p>
          </div>
          <Link 
            href={`/campaigns/${campaign.id}/edit`}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <div className="px-4 py-4">
        {/* Status Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card mb-4 ${isActive ? 'bg-success-50 border-success-200' : 'bg-gray-50'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${isActive ? 'bg-success animate-pulse' : 'bg-gray-300'}`} />
              <div>
                <p className="font-medium text-gray-900">
                  {isActive ? 'Campagna Attiva' : 'In Pausa'}
                </p>
                <p className="text-sm text-gray-500">
                  {isActive ? `Ogni ${formatFrequency(frequencyMins)}` : 'Clicca per attivare'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              disabled={isToggling}
              className={`p-3 rounded-full transition-colors ${
                isActive 
                  ? 'bg-white text-success hover:bg-success-100' 
                  : 'bg-primary text-white hover:bg-primary-700'
              }`}
            >
              {isToggling ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : isActive ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card text-center"
          >
            <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{campaign._count.results}</p>
            <p className="text-xs text-gray-500">Totale</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card text-center"
          >
            <Tag className="w-5 h-5 text-secondary mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">
              {results.filter(r => r.isNew).length}
            </p>
            <p className="text-xs text-gray-500">Nuovi</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card text-center"
          >
            <Clock className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-sm font-bold text-gray-900">
              {campaign.lastRunAt 
                ? formatRelativeDate(campaign.lastRunAt)
                : '—'
              }
            </p>
            <p className="text-xs text-gray-500">Ultimo run</p>
          </motion.div>
        </div>

        {/* Filters Info */}
        {(campaign.minPrice || campaign.maxPrice || campaign.region) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-2 mb-4"
          >
            {campaign.region && (
              <span className="badge bg-gray-100 text-gray-700">
                <MapPin className="w-3 h-3 mr-1" />
                {campaign.region}
              </span>
            )}
            {(campaign.minPrice || campaign.maxPrice) && (
              <span className="badge bg-gray-100 text-gray-700">
                💰 {campaign.minPrice ? `€${campaign.minPrice}` : '—'} - {campaign.maxPrice ? `€${campaign.maxPrice}` : '—'}
              </span>
            )}
          </motion.div>
        )}

        {/* Results Section */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Risultati
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Tutti
            </button>
            <button
              onClick={() => setFilter('new')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'new' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Nuovi
            </button>
          </div>
        </div>

        {/* Results List */}
        {filteredResults.length === 0 ? (
          <div className="empty-state py-12">
            <TrendingUp className="empty-state-icon" />
            <p className="empty-state-title">Nessun risultato</p>
            <p className="empty-state-description">
              {campaign.isActive 
                ? 'I risultati appariranno qui quando la campagna troverà annunci'
                : 'Attiva la campagna per iniziare a trovare annunci'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            <AnimatePresence>
              {filteredResults.map((result, index) => (
                <motion.a
                  key={result.id}
                  href={result.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card flex gap-3 hover:shadow-card-hover relative"
                >
                  {/* New Badge */}
                  {result.isNew && (
                    <span className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                      Nuovo
                    </span>
                  )}

                  {/* Image */}
                  <div className="w-24 h-24 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {result.image ? (
                      <img
                        src={result.image}
                        alt={result.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        📦
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 pr-6">
                      {result.title}
                    </h3>
                    
                    <p className="text-primary font-bold text-lg mt-1">
                      {formatPrice(result.price)}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      {result.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {result.location}
                        </span>
                      )}
                      <span>{formatRelativeDate(result.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 absolute top-4 right-4">
                    <FavoriteButton
                      resultId={result.id}
                      isFavorited={result.isFavorited || false}
                      size="sm"
                      className="bg-white shadow-sm"
                    />
                    <ExternalLink className="w-4 h-4 text-gray-300" />
                  </div>
                </motion.a>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}


