// src/hooks/useCampaigns.ts - Hook React Query per campagne (reattivo)
// Timestamp: 2024-12-14

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// Query keys centralizzate
export const campaignKeys = {
  all: ['campaigns'] as const,
  detail: (id: string) => ['campaigns', id] as const,
  results: (id: string) => ['campaigns', id, 'results'] as const,
};

interface Campaign {
  id: string;
  name: string;
  keyword: string;
  platform: string;
  minPrice: number | null;
  maxPrice: number | null;
  region: string | null;
  exactMatch: boolean;
  includeKeywords: string | null;
  excludeKeywords: string | null;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  _count: { results: number };
}

interface CreateCampaignData {
  name: string;
  keyword: string;
  platform: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  region?: string | null;
  exactMatch?: boolean;
  includeKeywords?: string | null;
  excludeKeywords?: string | null;
}

// Hook per lista campagne
export function useCampaigns() {
  return useQuery({
    queryKey: campaignKeys.all,
    queryFn: async (): Promise<Campaign[]> => {
      const res = await fetch('/api/campaigns');
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      return res.json();
    },
    staleTime: 0, // Sempre pronto per refresh
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

// Hook per singola campagna
export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: async (): Promise<Campaign> => {
      const res = await fetch(`/api/campaigns/${id}`);
      if (!res.ok) throw new Error('Failed to fetch campaign');
      return res.json();
    },
    enabled: !!id,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

// Hook per creare campagna
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCampaignData) => {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create campaign');
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalida la lista campagne per forzare refresh
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      toast.success('Campagna creata con successo');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook per toggle attivo/pausa campagna
export function useToggleCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await fetch(`/api/campaigns/${campaignId}/toggle`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to toggle campaign');
      return res.json();
    },
    onSuccess: (data, campaignId) => {
      // Invalida sia la lista che il dettaglio
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) });
      
      toast.success(data.isActive ? 'Campagna attivata' : 'Campagna in pausa');
    },
    onError: () => {
      toast.error('Errore durante l\'aggiornamento');
    },
  });
}

// Hook per eliminare campagna
export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete campaign');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      toast.success('Campagna eliminata');
    },
    onError: () => {
      toast.error('Errore durante l\'eliminazione');
    },
  });
}
