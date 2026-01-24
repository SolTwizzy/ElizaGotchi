'use client';

import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { orbitApi, type CreateOrbitItemData, type UpdateOrbitItemData, type OrbitItem } from '@/lib/api';

export function useOrbitItems(agentId: string | null, includeArchived = false) {
  return useQuery({
    queryKey: ['orbit-items', agentId, includeArchived],
    queryFn: () => orbitApi.list(agentId!, includeArchived),
    enabled: !!agentId,
    select: (data) => data.items,
  });
}

export function useOrbitItem(agentId: string | null, itemId: string | null) {
  return useQuery({
    queryKey: ['orbit-items', agentId, itemId],
    queryFn: () => orbitApi.get(agentId!, itemId!),
    enabled: !!agentId && !!itemId,
    select: (data) => data.item,
  });
}

export function useCreateOrbitItem(agentId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrbitItemData) => {
      if (!agentId) throw new Error('No agent selected');
      return orbitApi.create(agentId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orbit-items', agentId] });
    },
  });
}

export function useUpdateOrbitItem(agentId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdateOrbitItemData }) => {
      if (!agentId) throw new Error('No agent selected');
      return orbitApi.update(agentId, itemId, data);
    },
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['orbit-items', agentId] });
      queryClient.invalidateQueries({ queryKey: ['orbit-items', agentId, itemId] });
    },
  });
}

export function useDeleteOrbitItem(agentId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => {
      if (!agentId) throw new Error('No agent selected');
      return orbitApi.delete(agentId, itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orbit-items', agentId] });
    },
  });
}

export function useSuggestOrbitName(agentId: string | null) {
  return useMutation({
    mutationFn: (messages: Array<{ role: 'user' | 'assistant'; content: string }>) => {
      if (!agentId) throw new Error('No agent selected');
      return orbitApi.suggestName(agentId, messages);
    },
  });
}

export function useOrbitItemLive(agentId: string | null, itemId: string | null) {
  return useQuery({
    queryKey: ['orbit-items', agentId, itemId, 'live'],
    queryFn: () => orbitApi.getLive(agentId!, itemId!),
    enabled: !!agentId && !!itemId,
  });
}

// Fetch orbit items for multiple agents (for galaxy view)
export function useAllAgentsOrbitItems(agentIds: string[]) {
  const queries = useQueries({
    queries: agentIds.map((agentId) => ({
      queryKey: ['orbit-items', agentId, false],
      queryFn: () => orbitApi.list(agentId, false),
      select: (data: { items: OrbitItem[] }) => data.items,
    })),
  });

  // Create a map of agentId -> OrbitItem[]
  const orbitItemsByAgent: Record<string, OrbitItem[]> = {};
  agentIds.forEach((agentId, index) => {
    orbitItemsByAgent[agentId] = queries[index]?.data ?? [];
  });

  return {
    data: orbitItemsByAgent,
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
  };
}

// Combined hook for common orbit operations
export function useOrbitActions(agentId: string | null) {
  const createMutation = useCreateOrbitItem(agentId);
  const updateMutation = useUpdateOrbitItem(agentId);
  const deleteMutation = useDeleteOrbitItem(agentId);
  const suggestNameMutation = useSuggestOrbitName(agentId);

  return {
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation,
    suggestName: suggestNameMutation,
  };
}
