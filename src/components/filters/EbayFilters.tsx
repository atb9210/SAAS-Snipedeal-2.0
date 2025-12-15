// src/components/filters/EbayFilters.tsx - Filtri specifici per eBay
// Timestamp: 2024-12-15

'use client';

interface EbayFiltersProps {
  ebayLocation: string;
  onChange: (field: string, value: string) => void;
}

const EBAY_LOCATIONS = [
  { value: '', label: 'Tutto il mondo' },
  { value: 'IT', label: 'Solo Italia' },
  { value: 'EU', label: 'Unione Europea' },
];

export function EbayFilters({
  ebayLocation,
  onChange,
}: EbayFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Provenienza */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Provenienza venditore
        </label>
        <select
          value={ebayLocation}
          onChange={(e) => onChange('ebayLocation', e.target.value)}
          className="input"
        >
          {EBAY_LOCATIONS.map((loc) => (
            <option key={loc.value} value={loc.value}>
              {loc.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Filtra per provenienza del venditore
        </p>
      </div>

      {/* Info sui filtri fissi */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Filtri attivi</h4>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Solo "Compralo Subito" (no aste)</li>
          <li>• Solo articoli usati</li>
          <li>• Solo venditori privati</li>
          <li>• Ordinati per più recenti</li>
        </ul>
      </div>
    </div>
  );
}
