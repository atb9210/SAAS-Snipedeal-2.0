import { useEffect } from 'react';
import { useFavoritesStore } from '@/stores/favorites-store';
import { toast } from 'react-hot-toast';

interface UseFavoritesOptions {
  autoFetch?: boolean;
}

export function useFavorites(options: UseFavoritesOptions = {}) {
  const { autoFetch = true } = options;
  
  const {
    favorites,
    stats,
    isLoading,
    setFavorites,
    addFavorite,
    removeFavorite,
    setIsLoading,
    isFavorited,
    getFavoriteCount,
  } = useFavoritesStore();

  // Fetch favorites on mount
  useEffect(() => {
    if (autoFetch) {
      fetchFavorites();
    }
  }, [autoFetch]);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/favorites');
      
      if (!response.ok) throw new Error('Failed to fetch favorites');
      
      const data = await response.json();
      setFavorites(data.favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Errore nel caricamento dei preferiti');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (resultId: string) => {
    try {
      const response = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultId }),
      });

      if (!response.ok) throw new Error('Failed to toggle favorite');

      const data = await response.json();
      
      if (data.isFavorited) {
        // Fetch updated list to get the new favorite
        fetchFavorites();
        toast.success('Aggiunto ai preferiti');
      } else {
        // Remove from local state
        removeFavorite('', resultId);
        toast.success('Rimosso dai preferiti');
      }
      
      return data.isFavorited;
    } catch (error) {
      toast.error('Errore durante l\'aggiornamento');
      console.error(error);
      return false;
    }
  };

  const removeFromFavorites = async (favoriteId: string, resultId: string) => {
    try {
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favoriteId }),
      });

      if (!response.ok) throw new Error('Failed to remove favorite');

      removeFavorite(favoriteId, resultId);
      toast.success('Rimosso dai preferiti');
    } catch (error) {
      toast.error('Errore durante la rimozione');
      console.error(error);
    }
  };

  return {
    favorites,
    stats,
    isLoading,
    isFavorited,
    favoriteCount: getFavoriteCount(),
    toggleFavorite,
    removeFromFavorites,
    refreshFavorites: fetchFavorites,
  };
}
