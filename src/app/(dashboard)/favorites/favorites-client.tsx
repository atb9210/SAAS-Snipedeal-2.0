'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  ExternalLink, 
  Trash2, 
  MapPin, 
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { platformConfig, formatPrice } from '@/lib/utils';
import FavoriteButton from '@/components/favorite-button';
import RelativeTime from '@/components/relative-time';
import { useFavorites } from '@/hooks/useFavorites';

interface Result {
  id: string;
  title: string;
  price: string | null;
  location: string | null;
  link: string;
  image: string | null;
  isNew: boolean;
  createdAt: string;
  isFavorited: boolean;
  campaign: { 
    id: string;
    name: string; 
    keyword: string; 
    platform: string; 
  };
}

interface Favorite {
  id: string;
  createdAt: string;
  result: Result;
}

interface FavoritesClientProps {
  favorites: Favorite[];
  stats: {
    total: number;
    byPlatform: Record<string, number>;
  };
}

export default function FavoritesClient({ favorites: initialFavorites, stats: initialStats }: FavoritesClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [removingId, setRemovingId] = useState<string | null>(null);
  
  // Use global favorites state with auto-fetch
  const { favorites, stats, isLoading, removeFromFavorites, toggleFavorite } = useFavorites({ autoFetch: true });

  // Filter favorites
  const filteredFavorites = favorites.filter(fav => {
    const matchesSearch = fav.result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fav.result.campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = selectedPlatform === 'all' || fav.result.campaign.platform === selectedPlatform;
    return matchesSearch && matchesPlatform;
  });

  // Show loading state on initial fetch
  if (isLoading && favorites.length === 0) {
    return (
      <div className="px-4 pt-safe">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Remove favorite
  const handleRemoveFavorite = async (favoriteId: string) => {
    const favoriteToRemove = favorites.find(fav => fav.id === favoriteId);
    if (!favoriteToRemove) return;
    
    // Start exit animation
    setRemovingId(favoriteId);
    
    // Wait for animation then remove
    setTimeout(() => {
      removeFromFavorites(favoriteId, favoriteToRemove.result.id);
      setRemovingId(null);
    }, 300);
  };

  // Update favorite state when toggled from button
  const handleFavoriteToggle = (resultId: string, newState: boolean) => {
    if (!newState) {
      // Find the favorite to remove
      const favoriteToRemove = favorites.find(fav => fav.result.id === resultId);
      
      if (favoriteToRemove) {
        // Start exit animation
        setRemovingId(resultId);
        
        // Wait for animation then remove
        setTimeout(() => {
          removeFromFavorites(favoriteToRemove.id, resultId);
          setRemovingId(null);
        }, 300);
      }
    }
  };

  return (
    <div className="px-4 pt-safe">
      {/* Header */}
      <header className="pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500 fill-current" />
              Preferiti
            </h1>
            <p className="text-sm text-gray-500">
              {stats.total} annunci salvati
            </p>
          </div>
        </div>

        {/* Stats by Platform */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(stats.byPlatform).map(([platform, count]) => {
            const config = platformConfig[platform as keyof typeof platformConfig];
            return (
              <span key={platform} className="badge bg-gray-100 text-gray-700">
                {config?.icon} {config?.name}: {count}
              </span>
            );
          })}
        </div>
      </header>

      {/* Filters */}
      <div className="mb-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca tra i preferiti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Platform Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedPlatform('all')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              selectedPlatform === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Tutti
          </button>
          {Object.keys(stats.byPlatform).map(platform => {
            const config = platformConfig[platform as keyof typeof platformConfig];
            return (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap flex items-center gap-1 ${
                  selectedPlatform === platform ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {config?.icon} {config?.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      {filteredFavorites.length === 0 ? (
        <div className="empty-state py-12">
          <Heart className="empty-state-icon" />
          <p className="empty-state-title">
            {searchQuery || selectedPlatform !== 'all' ? 'Nessun preferito trovato' : 'Nessun preferito'}
          </p>
          <p className="empty-state-description">
            {searchQuery || selectedPlatform !== 'all' 
              ? 'Prova a cambiare i filtri di ricerca'
              : 'Gli annunci che aggiungi ai preferiti appariranno qui'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3 pb-8">
          {filteredFavorites.map((favorite, index) => (
            <motion.div
              key={favorite.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: removingId === favorite.id ? 0 : 1, 
                y: removingId === favorite.id ? -20 : 0,
                scale: removingId === favorite.id ? 0.95 : 1
              }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ 
                delay: removingId === favorite.id ? 0 : index * 0.05,
                duration: 0.3
              }}
              className="card flex gap-3 hover:shadow-card-hover relative"
            >
              {/* Image */}
              <div className="w-24 h-24 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {favorite.result.image ? (
                  <img
                    src={favorite.result.image}
                    alt={favorite.result.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    📦
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 pr-2">
                      {favorite.result.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {platformConfig[favorite.result.campaign.platform as keyof typeof platformConfig]?.icon}{' '}
                      {favorite.result.campaign.name}
                    </p>
                  </div>
                </div>
                
                <p className="text-primary font-bold text-lg mt-1">
                  {formatPrice(favorite.result.price)}
                </p>
                
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  {favorite.result.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {favorite.result.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <RelativeTime date={favorite.createdAt} />
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 absolute top-4 right-4">
                <FavoriteButton
                  resultId={favorite.result.id}
                  isFavorited={true}
                  size="sm"
                  className="bg-white shadow-sm"
                  onToggle={(newState) => handleFavoriteToggle(favorite.result.id, newState)}
                />
                <button
                  onClick={() => handleRemoveFavorite(favorite.id)}
                  className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                  title="Rimuovi dai preferiti"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <a
                  href={favorite.result.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                  title="Vedi annuncio"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
