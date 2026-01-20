'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';

export function useUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: usersApi.me,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string; avatarUrl?: string }) => usersApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: ['user', 'subscription'],
    queryFn: usersApi.subscription,
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: usersApi.plans,
    staleTime: Infinity,
  });
}

export function useUsage() {
  return useQuery({
    queryKey: ['user', 'usage'],
    queryFn: usersApi.usage,
    refetchInterval: 30000,
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['user', 'notifications'],
    queryFn: usersApi.getNotifications,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.updateNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'notifications'] });
    },
  });
}

export function useGenerateTelegramLinkCode() {
  return useMutation({
    mutationFn: usersApi.generateTelegramLinkCode,
  });
}
