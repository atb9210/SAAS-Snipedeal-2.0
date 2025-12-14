// src/app/(dashboard)/campaigns/new/page.tsx - Wizard Nuova Campagna (3 step)
// Timestamp: 2024-12-09

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
import { platformConfig, italianRegions } from '@/lib/utils';

type Step = 1 | 2 | 3;

interface FormData {
  name: string;
  keyword: string;
  platform: string;
  minPrice: string;
  maxPrice: string;
  region: string;
  exactMatch: boolean;
  includeKeywords: string;
  excludeKeywords: string;
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
    minPrice: '',
    maxPrice: '',
    region: '',
    exactMatch: false,
    includeKeywords: '',
    excludeKeywords: '',
  });

  const updateForm = (field: keyof FormData, value: string | boolean) => {
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
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || formData.keyword,
          keyword: formData.keyword,
          platform: formData.platform,
          minPrice: formData.minPrice ? parseFloat(formData.minPrice) : null,
          maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : null,
          region: formData.region || null,
          exactMatch: formData.exactMatch,
          includeKeywords: formData.includeKeywords || null,
          excludeKeywords: formData.excludeKeywords || null,
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
                      const isActive = key === 'SUBITO';
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
                            <span className="text-2xl">{config.icon}</span>
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
              className="p-6"
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
                {/* Exact Match Toggle */}
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Ricerca esatta nel titolo
                      </label>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Cerca solo annunci con la keyword esatta nel titolo
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateForm('exactMatch', !formData.exactMatch)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.exactMatch ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.exactMatch ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Range di prezzo
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={formData.minPrice}
                        onChange={(e) => updateForm('minPrice', e.target.value)}
                        placeholder="Min €"
                        className="input"
                      />
                    </div>
                    <div className="flex items-center text-gray-400">—</div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={formData.maxPrice}
                        onChange={(e) => updateForm('maxPrice', e.target.value)}
                        placeholder="Max €"
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                {/* Region */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Regione
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => updateForm('region', e.target.value)}
                    className="input"
                  >
                    <option value="">Tutta Italia</option>
                    {italianRegions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Include Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Includi parole chiave
                  </label>
                  <input
                    type="text"
                    value={formData.includeKeywords}
                    onChange={(e) => updateForm('includeKeywords', e.target.value)}
                    placeholder="es. originale, nuovo (separate da virgola)"
                    className="input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mostra solo annunci che contengono almeno una di queste parole
                  </p>
                </div>

                {/* Exclude Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Escludi parole chiave
                  </label>
                  <input
                    type="text"
                    value={formData.excludeKeywords}
                    onChange={(e) => updateForm('excludeKeywords', e.target.value)}
                    placeholder="es. rotto, difettoso (separate da virgola)"
                    className="input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nascondi annunci che contengono queste parole
                  </p>
                </div>
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
                {/* Campaign Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome campagna
                  </label>
                  <input
                    type="text"
                    value={formData.name}
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
                    {formData.region && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Regione</span>
                        <span className="font-medium">{formData.region}</span>
                      </div>
                    )}
                    {formData.exactMatch && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ricerca esatta</span>
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


