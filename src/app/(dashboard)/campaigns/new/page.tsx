// src/app/(dashboard)/campaigns/new/page.tsx - Wizard Nuova Campagna (3 step)
// Timestamp: 2024-12-21

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
  Loader2,
  Bell
} from 'lucide-react';
import { platformConfig } from '@/lib/utils';
import { PlatformFilters, SubKeywordRows, type SubKeyword } from '@/components/filters';

type Step = 1 | 2 | 3;

interface FormData {
  name: string;
  keyword: string;
  platform: string;
  // Sub-keyword con pricing granulare
  subKeywords: SubKeyword[];
  globalExclude: string;
  // Filtri Subito
  region: string;
  exactMatch: boolean;
  // Filtri eBay
  ebayLocation: string;
  // Filtri Facebook
  facebookCity: string;
  facebookExactMatch: boolean;
  facebookFreeOnly: boolean;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
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
  });

  const updateForm = (field: keyof FormData, value: string | boolean | SubKeyword[]) => {
    setFormData({ ...formData, [field]: value });
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.keyword.trim().length > 0;
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
      // Costruisci platformFilters in base alla piattaforma
      // Include subKeywords per pricing granulare
      let platformFilters: Record<string, unknown> = {};
      if (formData.platform === 'SUBITO') {
        platformFilters = {
          region: formData.region || null,
        };
      } else if (formData.platform === 'EBAY') {
        platformFilters = {
          location: formData.ebayLocation || null,
        };
      } else if (formData.platform === 'FACEBOOK') {
        platformFilters = {
          city: formData.facebookCity || 'Milano',
          exactMatch: formData.facebookExactMatch || false,
          freeOnly: formData.facebookFreeOnly || false,
        };
      }

      // Aggiungi subKeywords se presenti
      if (formData.subKeywords.length > 0) {
        platformFilters.subKeywords = formData.subKeywords.map(sk => ({
          model: sk.model,
          exclude: sk.exclude || null,
          minPrice: sk.minPrice ? parseFloat(sk.minPrice) : null,
          maxPrice: sk.maxPrice ? parseFloat(sk.maxPrice) : null,
          notify: sk.notify,
        }));
      }
      
      // Aggiungi globalExclude se presente
      if (formData.globalExclude) {
        platformFilters.globalExclude = formData.globalExclude;
      }

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || formData.keyword,
          keyword: formData.keyword,
          platform: formData.platform,
          minPrice: null,
          maxPrice: null,
          region: formData.platform === 'SUBITO' ? formData.region || null : null,
          exactMatch: formData.exactMatch,
          includeKeywords: null,
          excludeKeywords: formData.globalExclude || null,
          platformFilters: Object.keys(platformFilters).length > 0 ? platformFilters : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore nella creazione');
        setIsSubmitting(false);
        return;
      }

      // Success! Redirect to campaign
      router.push(`/campaigns/${data.id}`);
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

                {/* Platform Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Piattaforma
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(platformConfig).map(([key, config]) => {
                      const isActive = key === 'SUBITO' || key === 'EBAY' || key === 'VINTED' || key === 'FACEBOOK';
                      const isSelected = formData.platform === key;
                      
                      return (
                        <button
                          key={key}
                          onClick={() => isActive && updateForm('platform', key)}
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
                {/* Filtri specifici per piattaforma */}
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
                
                {/* Separatore */}
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Sub-keyword e Pricing
                  </h3>
                </div>
                
                {/* Sub-keyword rows con pricing granulare */}
                <SubKeywordRows
                  subKeywords={formData.subKeywords}
                  onChange={(subKeywords) => updateForm('subKeywords', subKeywords)}
                  globalExclude={formData.globalExclude}
                  onGlobalExcludeChange={(value) => updateForm('globalExclude', value)}
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
                {/* Campaign Name - pre-compilato con keyword - marketplace */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome campagna
                  </label>
                  <input
                    type="text"
                    value={formData.name || `${formData.keyword} - ${platformConfig[formData.platform as keyof typeof platformConfig]?.name || formData.platform}`}
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
                      <span className="text-gray-500">Piattaforma</span>
                      <span className="font-medium">
                        {platformConfig[formData.platform as keyof typeof platformConfig]?.name}
                      </span>
                    </div>
                    {formData.platform === 'SUBITO' && formData.region && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Regione</span>
                        <span className="font-medium">{formData.region}</span>
                      </div>
                    )}
                    {formData.platform === 'EBAY' && formData.ebayLocation && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Provenienza</span>
                        <span className="font-medium">
                          {formData.ebayLocation === 'IT' ? 'Italia' : formData.ebayLocation === 'EU' ? 'Unione Europea' : 'Tutto il mondo'}
                        </span>
                      </div>
                    )}
                    {formData.platform === 'FACEBOOK' && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Città</span>
                        <span className="font-medium">{formData.facebookCity}</span>
                      </div>
                    )}
                    {formData.platform === 'FACEBOOK' && formData.facebookExactMatch && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Corrispondenza esatta</span>
                        <span className="font-medium text-primary">Attiva</span>
                      </div>
                    )}
                    {formData.platform === 'FACEBOOK' && formData.facebookFreeOnly && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Solo regalo</span>
                        <span className="font-medium text-green-600">Attivo</span>
                      </div>
                    )}
                    {formData.exactMatch && formData.platform !== 'FACEBOOK' && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ricerca esatta</span>
                        <span className="font-medium text-primary">Attiva</span>
                      </div>
                    )}
                    {formData.subKeywords.length > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <span className="text-gray-500 text-xs">Sub-keyword ({formData.subKeywords.length})</span>
                        <div className="mt-1 space-y-1">
                          {formData.subKeywords.map((sk, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="font-medium">{sk.model}</span>
                              <span className="text-gray-500">
                                €{sk.minPrice || '0'} - €{sk.maxPrice || '∞'}
                                {sk.notify ? ' 🔔' : ' 🔕'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {formData.globalExclude && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Escludi globale</span>
                        <span className="font-medium text-red-600">{formData.globalExclude}</span>
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


