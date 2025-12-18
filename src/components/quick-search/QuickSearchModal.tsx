// src/components/quick-search/QuickSearchModal.tsx - Modal Quick Search
// Timestamp: 2024-12-18

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Zap, Loader2 } from 'lucide-react';
import { platformConfig } from '@/lib/utils';
import { Platform } from '@/services/scrapers';
import { useQuickSearch } from '@/hooks/useQuickSearch';
import { QuickSearchResults } from './QuickSearchResults';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const availablePlatforms: Platform[] = ['SUBITO', 'EBAY', 'VINTED', 'FACEBOOK'];

export function QuickSearchModal({ isOpen, onClose }: QuickSearchModalProps) {
  const [product, setProduct] = useState('');
  const [model, setModel] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['SUBITO', 'VINTED']);
  const [showResults, setShowResults] = useState(false);

  const quickSearch = useQuickSearch();

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSearch = async () => {
    if (!product.trim() || selectedPlatforms.length === 0) return;

    setShowResults(false);
    
    await quickSearch.mutateAsync({
      product: product.trim(),
      model: model.trim() || undefined,
      platforms: selectedPlatforms,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    });

    setShowResults(true);
  };

  const handleReset = () => {
    setProduct('');
    setModel('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedPlatforms(['SUBITO', 'VINTED']);
    setShowResults(false);
    quickSearch.reset();
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={handleClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Ricerca Rapida</h2>
                <p className="text-sm text-gray-500">Analizza il mercato in tempo reale</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {!showResults ? (
              <div className="p-6 space-y-6">
                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prodotto / Oggetto *
                    </label>
                    <input
                      type="text"
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      placeholder="es. iPhone, Casa, Bicicletta"
                      className="input"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modello (opzionale)
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="es. 14 Pro, Singola, Mountain Bike"
                      className="input"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Se specificato, verranno mostrati solo annunci che contengono tutte le parole del modello
                    </p>
                  </div>

                  {/* Price Filters */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prezzo Min (€)
                      </label>
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="0"
                        min="0"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prezzo Max (€)
                      </label>
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="∞"
                        min="0"
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                {/* Platform Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Piattaforme da analizzare *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {availablePlatforms.map((platform) => {
                      const config = platformConfig[platform as keyof typeof platformConfig];
                      const isSelected = selectedPlatforms.includes(platform);
                      
                      return (
                        <button
                          key={platform}
                          onClick={() => togglePlatform(platform)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <config.icon size={20} className="text-gray-600" />
                            <span className="font-medium text-gray-900 text-sm">
                              {config.name}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Seleziona una o più piattaforme da analizzare
                  </p>
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Come funziona:</strong> Analizzeremo la prima pagina di risultati 
                    su ogni piattaforma selezionata. Se specifichi un modello, verranno mostrati 
                    <strong> solo annunci che contengono tutte le parole del modello</strong>. 
                    Il prezzo medio di mercato viene calcolato rimuovendo i valori estremi (top e bottom 10%).
                  </p>
                </div>

                {/* Error */}
                {quickSearch.isError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {quickSearch.error?.message || 'Errore durante la ricerca'}
                  </div>
                )}
              </div>
            ) : (
              <QuickSearchResults 
                data={quickSearch.data}
                onNewSearch={handleReset}
              />
            )}
          </div>

          {/* Footer */}
          {!showResults && (
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="btn-ghost btn-lg flex-1"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSearch}
                  disabled={!product.trim() || selectedPlatforms.length === 0 || quickSearch.isPending}
                  className="btn-primary btn-lg flex-1 disabled:opacity-50"
                >
                  {quickSearch.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analisi in corso...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Analizza Mercato
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
