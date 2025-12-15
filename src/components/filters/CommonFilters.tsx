// src/components/filters/CommonFilters.tsx - Filtri comuni a tutte le piattaforme
// Timestamp: 2024-12-15

'use client';

interface CommonFiltersProps {
  minPrice: string;
  maxPrice: string;
  includeKeywords: string;
  excludeKeywords: string;
  onChange: (field: string, value: string) => void;
}

export function CommonFilters({
  minPrice,
  maxPrice,
  includeKeywords,
  excludeKeywords,
  onChange,
}: CommonFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Range di prezzo
        </label>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => onChange('minPrice', e.target.value)}
              placeholder="Min €"
              className="input"
            />
          </div>
          <div className="flex items-center text-gray-400">—</div>
          <div className="flex-1">
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => onChange('maxPrice', e.target.value)}
              placeholder="Max €"
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Include Keywords */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Includi parole chiave
        </label>
        <input
          type="text"
          value={includeKeywords}
          onChange={(e) => onChange('includeKeywords', e.target.value)}
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
          value={excludeKeywords}
          onChange={(e) => onChange('excludeKeywords', e.target.value)}
          placeholder="es. rotto, difettoso (separate da virgola)"
          className="input"
        />
        <p className="text-xs text-gray-500 mt-1">
          Nascondi annunci che contengono queste parole
        </p>
      </div>
    </div>
  );
}
