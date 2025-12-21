// src/components/filters/SubKeywordRows.tsx - Righe sub-keyword con pricing e notifica granulare
// Timestamp: 2024-12-21

'use client';

import { Plus, Trash2, Bell, BellOff } from 'lucide-react';

export interface SubKeyword {
  id: string;
  model: string;
  exclude: string;
  minPrice: string;
  maxPrice: string;
  notify: boolean;
}

interface SubKeywordRowsProps {
  subKeywords: SubKeyword[];
  onChange: (subKeywords: SubKeyword[]) => void;
  globalExclude: string;
  onGlobalExcludeChange: (value: string) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function SubKeywordRows({
  subKeywords,
  onChange,
  globalExclude,
  onGlobalExcludeChange,
}: SubKeywordRowsProps) {
  
  const addRow = () => {
    onChange([
      ...subKeywords,
      { id: generateId(), model: '', exclude: '', minPrice: '', maxPrice: '', notify: true }
    ]);
  };

  const removeRow = (id: string) => {
    onChange(subKeywords.filter(sk => sk.id !== id));
  };

  const updateRow = (id: string, field: keyof SubKeyword, value: string | boolean) => {
    onChange(subKeywords.map(sk => 
      sk.id === id ? { ...sk, [field]: value } : sk
    ));
  };

  const toggleNotify = (id: string) => {
    onChange(subKeywords.map(sk => 
      sk.id === id ? { ...sk, notify: !sk.notify } : sk
    ));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Sub-keyword / Modelli
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Aggiungi modelli specifici con prezzi e notifiche individuali
          </p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary-600 font-medium"
        >
          <Plus className="w-4 h-4" />
          Aggiungi
        </button>
      </div>

      {/* Rows */}
      {subKeywords.length > 0 && (
        <div className="space-y-3">
          {/* Column headers (mobile hidden) */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-xs text-gray-500 font-medium px-1">
            <div className="col-span-3">Modello</div>
            <div className="col-span-3">Escludi</div>
            <div className="col-span-2">Min €</div>
            <div className="col-span-2">Max €</div>
            <div className="col-span-2 text-center">Notifica</div>
          </div>
          
          {subKeywords.map((sk) => (
            <div 
              key={sk.id} 
              className="bg-gray-50 rounded-xl p-3"
            >
              {/* Layout inline: griglia compatta sia mobile che desktop */}
              <div className="grid grid-cols-12 gap-1.5 sm:gap-2 items-center">
                {/* Modello - più largo su mobile */}
                <div className="col-span-5 sm:col-span-3">
                  <input
                    type="text"
                    value={sk.model}
                    onChange={(e) => updateRow(sk.id, 'model', e.target.value)}
                    placeholder="Modello"
                    className="input text-xs sm:text-sm py-2"
                  />
                </div>
                
                {/* Escludi - nascosto su mobile, visibile su desktop */}
                <div className="hidden sm:block sm:col-span-3">
                  <input
                    type="text"
                    value={sk.exclude}
                    onChange={(e) => updateRow(sk.id, 'exclude', e.target.value)}
                    placeholder="Escludi"
                    className="input text-sm"
                  />
                </div>
                
                {/* Min Price */}
                <div className="col-span-2 sm:col-span-2">
                  <input
                    type="number"
                    value={sk.minPrice}
                    onChange={(e) => updateRow(sk.id, 'minPrice', e.target.value)}
                    placeholder="Min"
                    className="input text-xs sm:text-sm py-2 px-2"
                  />
                </div>
                
                {/* Max Price */}
                <div className="col-span-2 sm:col-span-2">
                  <input
                    type="number"
                    value={sk.maxPrice}
                    onChange={(e) => updateRow(sk.id, 'maxPrice', e.target.value)}
                    placeholder="Max"
                    className="input text-xs sm:text-sm py-2 px-2"
                  />
                </div>
                
                {/* Actions: Notify + Delete */}
                <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => toggleNotify(sk.id)}
                    className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                      sk.notify 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                    }`}
                    title={sk.notify ? 'Notifiche attive' : 'Notifiche disattivate'}
                  >
                    {sk.notify ? <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <BellOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRow(sk.id)}
                    className="p-1.5 sm:p-2 rounded-lg bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700 transition-colors"
                    title="Rimuovi"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
              
              {/* Escludi su mobile - riga separata sotto */}
              <div className="mt-2 sm:hidden">
                <input
                  type="text"
                  value={sk.exclude}
                  onChange={(e) => updateRow(sk.id, 'exclude', e.target.value)}
                  placeholder="Escludi (es. rotto, difettoso)"
                  className="input text-xs py-2"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {subKeywords.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <p className="text-gray-500 text-sm mb-3">
            Nessun modello aggiunto. I risultati non verranno filtrati per sub-keyword.
          </p>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-600 font-medium"
          >
            <Plus className="w-4 h-4" />
            Aggiungi primo modello
          </button>
        </div>
      )}

      {/* Global exclude */}
      <div className="pt-4 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Escludi globale (opzionale)
        </label>
        <input
          type="text"
          value={globalExclude}
          onChange={(e) => onGlobalExcludeChange(e.target.value)}
          placeholder="es. ricambi, parti, cover (applica a tutti)"
          className="input"
        />
        <p className="text-xs text-gray-500 mt-1">
          Queste parole verranno escluse da tutti i risultati, indipendentemente dal modello
        </p>
      </div>
    </div>
  );
}
