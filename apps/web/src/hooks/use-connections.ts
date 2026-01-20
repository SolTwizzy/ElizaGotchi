'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionsApi, type Connection } from '@/lib/api';

export function useConnections() {
  return useQuery({
    queryKey: ['connections'],
    queryFn: connectionsApi.list,
  });
}

export function useDeleteConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => connectionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

export function useValidateConnection() {
  return useMutation({
    mutationFn: (id: string) => connectionsApi.validate(id),
  });
}

export function useRefreshConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => connectionsApi.refresh(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

export function useLinkConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, agentId, config }: { id: string; agentId: string; config?: Record<string, unknown> }) =>
      connectionsApi.link(id, agentId, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useUnlinkConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, agentId }: { id: string; agentId: string }) =>
      connectionsApi.unlink(id, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export function useAddWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { address: string; chain: string; label?: string }) =>
      connectionsApi.addWallet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

export function useLinkTelegram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => connectionsApi.linkTelegram(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

export function useAddDiscordWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { webhookUrl: string; label?: string }) =>
      connectionsApi.addDiscordWebhook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}

export function useTestNotification() {
  return useMutation({
    mutationFn: (id: string) => connectionsApi.testNotification(id),
  });
}

export function useTestAgentNotifications() {
  return useMutation({
    mutationFn: (agentId: string) => connectionsApi.testAgentNotifications(agentId),
  });
}

export function useNotificationStatus() {
  return useQuery({
    queryKey: ['notification-status'],
    queryFn: connectionsApi.getNotificationStatus,
  });
}
