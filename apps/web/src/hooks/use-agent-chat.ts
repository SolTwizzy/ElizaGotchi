'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentsApi, type ChatMessage } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useAgentChat(agentId: string | null) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load chat history when agent is selected
  const { isLoading: isLoadingHistory } = useQuery({
    queryKey: ['agent-chat-history', agentId],
    queryFn: async () => {
      if (!agentId) return { messages: [] };
      const result = await agentsApi.chatHistory(agentId);
      // Convert API messages to local format
      const loadedMessages = result.messages.map((m: ChatMessage) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
      }));
      setMessages(loadedMessages);
      return result;
    },
    enabled: !!agentId,
    refetchOnWindowFocus: false,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      if (!agentId) throw new Error('No agent selected');
      return agentsApi.chat(agentId, content);
    },
    onMutate: async ({ content }) => {
      // Optimistically add user message
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setError(null);
    },
    onSuccess: (response) => {
      // Add assistant response
      const assistantMessage: Message = {
        id: response.id,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(response.timestamp),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: (err: Error) => {
      setError(err.message);
      // Remove the optimistic user message on error
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));
    },
  });

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || !agentId) return;
      sendMutation.mutate({ content });
    },
    [agentId, sendMutation]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading: sendMutation.isPending,
    isLoadingHistory,
    error,
  };
}
