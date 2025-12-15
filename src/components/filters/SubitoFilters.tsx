// src/components/filters/SubitoFilters.tsx - Filtri specifici per Subito.it
// Timestamp: 2024-12-15

'use client';

import { italianRegions } from '@/lib/utils';

interface SubitoFiltersProps {
  region: string;
  exactMatch: boolean;
  onChange: (field: string, value: string | boolean) => void;
}

export function SubitoFilters({
  region,
  exactMatch,
  onChange,
}: SubitoFiltersProps) {
  return (
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
            onClick={() => onChange('exactMatch', !exactMatch)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              exactMatch ? 'bg-primary' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                exactMatch ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Region */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Regione
        </label>
        <select
          value={region}
          onChange={(e) => onChange('region', e.target.value)}
          className="input"
        >
          <option value="">Tutta Italia</option>
          {italianRegions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
