// src/app/(dashboard)/campaigns/[id]/edit/page.tsx - Modifica Campagna
// Timestamp: 2024-12-21

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Bell,
  Settings
} from 'lucide-react';
import { platformConfig } from '@/lib/utils';
import { PlatformFilters, SubKeywordRows, type SubKeyword } from '@/components/filters';

interface FormData {
  name: string;
  keyword: string;
  platform: string;
  subKeywords: SubKeyword[];
  globalExclude: string;
  region: string;
  exactMatch: boolean;
  ebayLocation: string;
  facebookCity: string;
  facebookExactMatch: boolean;
  facebookFreeOnly: boolean;
  isActive: boolean;
}

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    keyword: '',
    platform: 'SUBITO',
    subKeywords: [],
    globalExclude: '',
    region: '',
    exactMatch: false,
    ebayLocation: '',
    facebookCity: 'Milano',
    facebookExactMatch: false,
    facebookFreeOnly: false,
    isActive: true,
  });

  // Carica dati campagna
  useEffect(() => {
    const loadCampaign = async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}`);
        if (!res.ok) {
          setError('Campagna non trovata');
          return;
        }
        
        const campaign = await res.json();
        const pf = campaign.platformFilters || {};
        
        setFormData({
          name: campaign.name || '',
          keyword: campaign.keyword || '',
          platform: campaign.platform || 'SUBITO',
          subKeywords: (pf.subKeywords || []).map((sk: SubKeyword, i: number) => ({
            ...sk,
            id: sk.id || `sk-${i}`,
            minPrice: sk.minPrice?.toString() || '',
            maxPrice: sk.maxPrice?.toString() || '',
          })),
          globalExclude: pf.globalExclude || '',
          region: pf.region || campaign.region || '',
          exactMatch: campaign.exactMatch || false,
          ebayLocation: pf.location || '',
          facebookCity: pf.city || 'Milano',
          facebookExactMatch: pf.exactMatch || false,
          facebookFreeOnly: pf.freeOnly || false,
          isActive: campaign.isActive ?? true,
        });
      } catch (err) {
        setError('Errore nel caricamento');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCampaign();
  }, [campaignId]);

  const updateForm = (field: keyof FormData, value: string | boolean | SubKeyword[]) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.keyword.trim()) {
      setError('Nome e keyword sono obbligatori');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      // Costruisci platformFilters
      let platformFilters: Record<string, unknown> = {};
      
      if (formData.platform === 'SUBITO') {
        platformFilters = { region: formData.region || null };
      } else if (formData.platform === 'EBAY') {
        platformFilters = { location: formData.ebayLocation || null };
      } else if (formData.platform === 'FACEBOOK') {
        platformFilters = {
          city: formData.facebookCity || 'Milano',
          exactMatch: formData.facebookExactMatch || false,
          freeOnly: formData.facebookFreeOnly || false,
        };
      }

      // Aggiungi subKeywords
      if (formData.subKeywords.length > 0) {
        platformFilters.subKeywords = formData.subKeywords.map(sk => ({
          model: sk.model,
          exclude: sk.exclude || null,
          minPrice: sk.minPrice ? parseFloat(sk.minPrice) : null,
          maxPrice: sk.maxPrice ? parseFloat(sk.maxPrice) : null,
          notify: sk.notify,
        }));
      }
      
      if (formData.globalExclude) {
        platformFilters.globalExclude = formData.globalExclude;
      }

      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          keyword: formData.keyword,
          region: formData.platform === 'SUBITO' ? formData.region || null : null,
          isActive: formData.isActive,
          platformFilters: Object.keys(platformFilters).length > 0 ? platformFilters : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Errore nel salvataggio');
        setIsSubmitting(false);
        return;
      }

      // Salva in sessionStorage per refresh lista
      sessionStorage.setItem('campaignUpdated', JSON.stringify({
        id: campaignId,
        timestamp: Date.now(),
      }));

      router.push(`/campaigns/${campaignId}`);
      router.refresh();
    } catch (err) {
      setError('Errore di connessione');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-gray-900">Modifica Campagna</h1>
          <p className="text-sm text-gray-500">{formData.name}</p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome campagna
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateForm('name', e.target.value)}
              className="input"
            />
          </div>

          {/* Keyword */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keyword di ricerca
            </label>
            <input
              type="text"
              value={formData.keyword}
              onChange={(e) => updateForm('keyword', e.target.value)}
              className="input"
            />
          </div>

          {/* Platform (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Piattaforma
            </label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
              {platformConfig[formData.platform as keyof typeof platformConfig] && (
                <>
                  {(() => {
                    const Icon = platformConfig[formData.platform as keyof typeof platformConfig].icon;
                    return <Icon size={20} className="text-gray-600" />;
                  })()}
                  <span className="font-medium">
                    {platformConfig[formData.platform as keyof typeof platformConfig].name}
                  </span>
                </>
              )}
              <span className="text-xs text-gray-400 ml-auto">(non modificabile)</span>
            </div>
          </div>

          {/* Stato */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Campagna attiva</p>
              <p className="text-sm text-gray-500">Ricerca automatica ogni 5 minuti</p>
            </div>
            <button
              onClick={() => updateForm('isActive', !formData.isActive)}
              className={`w-12 h-6 rounded-full transition-colors ${
                formData.isActive ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <motion.div
                className="w-5 h-5 bg-white rounded-full shadow-sm"
                animate={{ x: formData.isActive ? 26 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Filtri piattaforma */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Filtri Piattaforma
            </h3>
            <PlatformFilters
              platform={formData.platform}
              values={{
                ...formData,
                minPrice: '',
                maxPrice: '',
                includeKeywords: '',
                excludeKeywords: '',
              }}
              onChange={(field: string, value: string | boolean) => updateForm(field as keyof FormData, value)}
            />
          </div>

          {/* Sub-keywords */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Sub-keyword e Pricing
            </h3>
            <SubKeywordRows
              subKeywords={formData.subKeywords}
              onChange={(subKeywords) => updateForm('subKeywords', subKeywords)}
              globalExclude={formData.globalExclude}
              onGlobalExcludeChange={(value) => updateForm('globalExclude', value)}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 p-4 border-t border-gray-100 bg-white pb-20">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-primary btn-lg w-full disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Salva Modifiche
            </>
          )}
        </button>
      </div>
    </div>
  );
}
