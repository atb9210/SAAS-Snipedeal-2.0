'use client';

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useFavorites } from '@/hooks/useFavorites';

interface FavoriteButtonProps {
  resultId: string;
  isFavorited: boolean;
  onToggle?: (newState: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function FavoriteButton({
  resultId,
  isFavorited: initialFavorited,
  onToggle,
  size = 'md',
  className = '',
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use global favorites state
  const { toggleFavorite } = useFavorites({ autoFetch: false });

  // Size classes
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg',
  };

  const handleToggle = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;

    // Optimistic update
    const newState = !isFavorited;
    setIsFavorited(newState);
    setIsLoading(true);

    // Call onToggle callback for parent component updates
    onToggle?.(newState);

    try {
      const wasFavorited = await toggleFavorite(resultId);
      
      // Update state based on actual result
      setIsFavorited(wasFavorited);
      
      // Update parent if different
      if (wasFavorited !== newState) {
        onToggle?.(wasFavorited);
      }
      
    } catch (error) {
      // Rollback on error
      setIsFavorited(!newState);
      onToggle?.(!newState);
      
      toast.error('Errore durante l\'aggiornamento dei preferiti', {
        duration: 3000,
        position: 'top-right',
      });
      
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  }, [resultId, isFavorited, isLoading, onToggle, toggleFavorite]);

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        ${className}
        inline-flex items-center justify-center
        rounded-full transition-all duration-200
        ${isLoading 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:scale-110 active:scale-95'
        }
        ${isFavorited 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-400 hover:text-gray-500'
        }
      `}
      title={isFavorited ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
    >
      {isLoading ? (
        // Loading spinner
        <svg
          className="animate-spin"
          fill="none"
          height="20"
          viewBox="0 0 24 24"
          width="20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            fill="currentColor"
          />
        </svg>
      ) : (
        // Heart icon
        <svg
          fill={isFavorited ? 'currentColor' : 'none'}
          height="20"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
    </button>
  );
}
