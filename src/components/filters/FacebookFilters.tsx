'use client';

import { FACEBOOK_CITIES } from '@/lib/facebook-cities';

// Ordina città alfabeticamente
const sortedCities = [...FACEBOOK_CITIES].sort((a, b) => a.localeCompare(b, 'it'));

interface FacebookFiltersProps {
  city: string;
  exactMatch: boolean;
  freeOnly: boolean;
  onChange: (field: string, value: string | boolean) => void;
}

export function FacebookFilters({
  city,
  exactMatch,
  freeOnly,
  onChange,
}: FacebookFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Exact Match Toggle - stesso stile di Subito */}
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
            onClick={() => onChange('facebookExactMatch', !exactMatch)}
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

      {/* Free Only Toggle - stesso stile di Subito */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Solo regalo
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Mostra solo prodotti gratuiti (regalo)
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange('facebookFreeOnly', !freeOnly)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              freeOnly ? 'bg-primary' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                freeOnly ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* City Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Città
        </label>
        <select
          value={city}
          onChange={(e) => onChange('facebookCity', e.target.value)}
          className="input"
        >
          {sortedCities.map((cityName) => (
            <option key={cityName} value={cityName}>
              {cityName}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Facebook Marketplace cerca in un raggio di ~65km dalla città selezionata
        </p>
      </div>
    </div>
  );
}
