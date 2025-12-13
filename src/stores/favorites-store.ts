import { create } from 'zustand';

interface Favorite {
  id: string;
  resultId: string;
  userId: string;
  createdAt: string;
  result: {
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
  };
}

interface FavoritesStats {
  total: number;
  byPlatform: Record<string, number>;
}

interface FavoritesStore {
  favorites: Favorite[];
  stats: FavoritesStats;
  isLoading: boolean;
  
  // Actions
  setFavorites: (favorites: Favorite[]) => void;
  addFavorite: (favorite: Favorite) => void;
  removeFavorite: (favoriteId: string, resultId: string) => void;
  setIsLoading: (loading: boolean) => void;
  clearFavorites: () => void;
  
  // Getters
  isFavorited: (resultId: string) => boolean;
  getFavoriteCount: () => number;
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favorites: [],
  stats: { total: 0, byPlatform: {} },
  isLoading: false,
  
  setFavorites: (favorites) => {
    const stats = {
      total: favorites.length,
      byPlatform: favorites.reduce((acc, fav) => {
        const platform = fav.result.campaign.platform;
        acc[platform] = (acc[platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
    set({ favorites, stats });
  },
  
  addFavorite: (favorite) => {
    const { favorites } = get();
    const newFavorites = [...favorites, favorite];
    
    const stats = {
      total: newFavorites.length,
      byPlatform: newFavorites.reduce((acc, fav) => {
        const platform = fav.result.campaign.platform;
        acc[platform] = (acc[platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
    
    set({ favorites: newFavorites, stats });
  },
  
  removeFavorite: (favoriteId, resultId) => {
    const { favorites } = get();
    const favoriteToRemove = favorites.find(f => f.result.id === resultId);
    
    const newFavorites = favorites.filter(f => f.result.id !== resultId);
    
    const stats = {
      total: newFavorites.length,
      byPlatform: newFavorites.reduce((acc, fav) => {
        const platform = fav.result.campaign.platform;
        acc[platform] = (acc[platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
    
    set({ favorites: newFavorites, stats });
  },
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  clearFavorites: () => set({ favorites: [], stats: { total: 0, byPlatform: {} } }),
  
  isFavorited: (resultId) => {
    const { favorites } = get();
    return favorites.some(f => f.result.id === resultId);
  },
  
  getFavoriteCount: () => {
    const { favorites } = get();
    return favorites.length;
  },
}));
