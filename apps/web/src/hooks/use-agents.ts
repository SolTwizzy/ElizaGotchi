'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentsApi, type Agent, type CreateAgentData, type UpdateAgentData } from '@/lib/api';

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: agentsApi.list,
    refetchInterval: 10000, // Poll every 10s for status updates
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: ['agents', id],
    queryFn: () => agentsApi.get(id),
    enabled: !!id,
    refetchInterval: 5000, // Poll more frequently for single agent
  });
}

export function useAgentTypes() {
  return useQuery({
    queryKey: ['agent-types'],
    queryFn: agentsApi.types,
    staleTime: Infinity, // Types don't change
  });
}

export function useAgentLogs(id: string, limit = 50) {
  return useQuery({
    queryKey: ['agents', id, 'logs', limit],
    queryFn: () => agentsApi.logs(id, limit),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAgentData) => agentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAgentData }) =>
      agentsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agents', id] });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => agentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useAgentActions(id: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['agents'] });
    queryClient.invalidateQueries({ queryKey: ['agents', id] });
  };

  const start = useMutation({
    mutationFn: () => agentsApi.start(id),
    onSuccess: invalidate,
  });

  const stop = useMutation({
    mutationFn: () => agentsApi.stop(id),
    onSuccess: invalidate,
  });

  const pause = useMutation({
    mutationFn: () => agentsApi.pause(id),
    onSuccess: invalidate,
  });

  const resume = useMutation({
    mutationFn: () => agentsApi.resume(id),
    onSuccess: invalidate,
  });

  return { start, stop, pause, resume };
}
