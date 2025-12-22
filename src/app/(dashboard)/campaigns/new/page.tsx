// src/app/(dashboard)/campaigns/new/page.tsx - Wizard Nuova Campagna (3 step)
// Timestamp: 2024-12-15

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Search,
  MapPin,
  Zap,
  Loader2
} from 'lucide-react';
import { platformConfig } from '@/lib/utils';
import { CommonFilters, PlatformFilters } from '@/components/filters';
import { PLATFORM_FILTERS, getEnabledPlatforms, MultiPlatformFilters } from '@/lib/platform-config';

type Step = 1 | 2 | 3;

interface FormData {
  name: string;
  keyword: string;
  platforms: string[]; // Multi-select piattaforme
  // Filtri comuni
  minPrice: string;
  maxPrice: string;
  includeKeywords: string;
  excludeKeywords: string;
  // Filtri per piattaforma (nested)
  platformFilters: MultiPlatformFilters;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    keyword: '',
    platforms: ['SUBITO'], // Default: solo Subito selezionato
    minPrice: '',
    maxPrice: '',
    includeKeywords: '',
    excludeKeywords: '',
    platformFilters: {
      SUBITO: { region: '', exactMatch: false },
      EBAY: { location: '' },
      VINTED: {},
    },
  });

  const updateForm = (field: keyof FormData, value: string | boolean | string[] | MultiPlatformFilters) => {
    setFormData({ ...formData, [field]: value });
  };

  // Toggle piattaforma nel multi-select
  const togglePlatform = (platform: string) => {
    const current = formData.platforms;
    const updated = current.includes(platform)
      ? current.filter(p => p !== platform)
      : [...current, platform];
    // Almeno una piattaforma deve essere selezionata
    if (updated.length > 0) {
      setFormData({ ...formData, platforms: updated });
    }
  };

  // Aggiorna filtro specifico per piattaforma
  const updatePlatformFilter = (platform: string, field: string, value: string | boolean) => {
    setFormData({
      ...formData,
      platformFilters: {
        ...formData.platformFilters,
        [platform]: {
          ...formData.platformFilters[platform as keyof MultiPlatformFilters],
          [field]: value,
        },
      },
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.keyword.trim().length > 0 && formData.platforms.length > 0;
      case 2:
        return true; // Filtri opzionali
      case 3:
        return formData.name.trim().length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      // Multi-platform: crea gruppo + N campagne
      const res = await fetch('/api/campaign-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || formData.keyword,
          keyword: formData.keyword,
          platforms: formData.platforms,
          minPrice: formData.minPrice ? parseFloat(formData.minPrice) : null,
          maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : null,
          includeKeywords: formData.includeKeywords || null,
          excludeKeywords: formData.excludeKeywords || null,
          platformFilters: formData.platformFilters,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore nella creazione');
        setIsSubmitting(false);
        return;
      }

      // Success! Redirect to campaigns list (il gruppo verrà mostrato aggregato)
      router.push(`/campaigns`);
      router.refresh();
    } catch (err) {
      setError('Errore di connessione');
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-4 border-b border-gray-100">
        <button onClick={handleBack} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-gray-900">Nuova Campagna</h1>
          <p className="text-sm text-gray-500">Step {step} di 3</p>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-100">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: '0%' }}
          animate={{ width: `${(step / 3) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={step}>
          {/* Step 1: Keyword & Platform */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Cosa cerchi?
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Inserisci la keyword da monitorare
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Keyword Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keyword di ricerca
                  </label>
                  <input
                    type="text"
                    value={formData.keyword}
                    onChange={(e) => updateForm('keyword', e.target.value)}
                    placeholder="es. iPhone 14 Pro"
                    className="input"
                    autoFocus
                  />
                </div>

                {/* Platform Selection - Multi-select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Piattaforme <span className="text-gray-400 font-normal">(seleziona una o più)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(platformConfig).map(([key, config]) => {
                      const isActive = key === 'SUBITO' || key === 'EBAY' || key === 'VINTED';
                      const isSelected = formData.platforms.includes(key);
                      
                      return (
                        <button
                          key={key}
                          onClick={() => isActive && togglePlatform(key)}
                          disabled={!isActive}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary-50' 
                              : isActive
                                ? 'border-gray-200 hover:border-gray-300'
                                : 'border-gray-100 bg-gray-50 opacity-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {/* Checkbox indicator */}
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected ? 'bg-primary border-primary' : 'border-gray-300'
                            }`}>
                              {isSelected && <Check size={14} className="text-white" />}
                            </div>
                            <config.icon size={24} className="text-gray-600" />
                            <span className="font-medium text-gray-900">
                              {config.name}
                            </span>
                          </div>
                          {!isActive && (
                            <span className="text-xs text-gray-400 mt-1 block">
                              Presto disponibile
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Filters */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Filtri (opzionale)
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Affina la tua ricerca
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Filtri specifici per ogni piattaforma selezionata */}
                {formData.platforms.map((platform) => {
                  const config = PLATFORM_FILTERS[platform];
                  if (!config || config.filters.length === 0) return null;
                  
                  return (
                    <div key={platform} className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        {platformConfig[platform as keyof typeof platformConfig]?.icon && (
                          <span className="text-gray-500">
                            {(() => {
                              const Icon = platformConfig[platform as keyof typeof platformConfig]?.icon;
                              return Icon ? <Icon size={18} /> : null;
                            })()}
                          </span>
                        )}
                        Filtri {config.displayName}
                      </h3>
                      <div className="space-y-3">
                        {config.filters.map((filter) => (
                          <div key={filter.name}>
                            {filter.type === 'select' && (
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">{filter.label}</label>
                                <select
                                  value={String(formData.platformFilters[platform as keyof MultiPlatformFilters]?.[filter.name as keyof typeof formData.platformFilters[keyof MultiPlatformFilters]] || '')}
                                  onChange={(e) => updatePlatformFilter(platform, filter.name, e.target.value)}
                                  className="input text-sm"
                                >
                                  {filter.options?.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {filter.type === 'boolean' && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(formData.platformFilters[platform as keyof MultiPlatformFilters]?.[filter.name as keyof typeof formData.platformFilters[keyof MultiPlatformFilters]])}
                                  onChange={(e) => updatePlatformFilter(platform, filter.name, e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-gray-700">{filter.label}</span>
                              </label>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                {/* Messaggio se nessuna piattaforma ha filtri */}
                {formData.platforms.every(p => !PLATFORM_FILTERS[p]?.filters.length) && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-500">
                    <p className="text-sm">Nessun filtro specifico per le piattaforme selezionate</p>
                  </div>
                )}
                
                {/* Separatore */}
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Filtri comuni</h3>
                </div>
                
                {/* Filtri comuni a tutte le piattaforme */}
                <CommonFilters
                  minPrice={formData.minPrice}
                  maxPrice={formData.maxPrice}
                  includeKeywords={formData.includeKeywords}
                  excludeKeywords={formData.excludeKeywords}
                  onChange={(field, value) => updateForm(field as keyof FormData, value)}
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Name & Confirm */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Ultimo step!
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Dai un nome alla tua campagna
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Campaign Name - pre-compilato con keyword - piattaforme */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome campagna
                  </label>
                  <input
                    type="text"
                    value={formData.name || `${formData.keyword} - ${formData.platforms.map(p => platformConfig[p as keyof typeof platformConfig]?.name || p).join(', ')}`}
                    onChange={(e) => updateForm('name', e.target.value)}
                    placeholder={formData.keyword || 'Nome campagna'}
                    className="input"
                    autoFocus
                  />
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Riepilogo</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Keyword</span>
                      <span className="font-medium">{formData.keyword}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Piattaforme</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {formData.platforms.map(p => (
                          <span key={p} className="px-2 py-0.5 bg-primary-100 text-primary rounded text-xs font-medium">
                            {platformConfig[p as keyof typeof platformConfig]?.name || p}
                          </span>
                        ))}
                      </div>
                    </div>
                    {(formData.minPrice || formData.maxPrice) && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Prezzo</span>
                        <span className="font-medium">
                          {formData.minPrice ? `€${formData.minPrice}` : '—'} 
                          {' - '}
                          {formData.maxPrice ? `€${formData.maxPrice}` : '—'}
                        </span>
                      </div>
                    )}
                    {/* Filtri specifici per piattaforma */}
                    {formData.platforms.includes('SUBITO') && formData.platformFilters.SUBITO?.region && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Regione (Subito)</span>
                        <span className="font-medium">{formData.platformFilters.SUBITO.region}</span>
                      </div>
                    )}
                    {formData.platforms.includes('SUBITO') && formData.platformFilters.SUBITO?.exactMatch && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ricerca esatta (Subito)</span>
                        <span className="font-medium text-primary">Attiva</span>
                      </div>
                    )}
                    {formData.includeKeywords && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Includi</span>
                        <span className="font-medium text-green-600">{formData.includeKeywords}</span>
                      </div>
                    )}
                    {formData.excludeKeywords && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Escludi</span>
                        <span className="font-medium text-red-600">{formData.excludeKeywords}</span>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer with Buttons - sticky sopra la bottom nav */}
      <div className="sticky bottom-0 p-4 border-t border-gray-100 bg-white pb-20">
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="btn-ghost btn-lg flex-1"
            >
              Indietro
            </button>
          )}
          
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="btn-primary btn-lg flex-1 disabled:opacity-50"
            >
              Avanti
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="btn-primary btn-lg flex-1 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creazione...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Crea Campagna
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


