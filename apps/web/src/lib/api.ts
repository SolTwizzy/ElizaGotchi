const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  get<T>(endpoint: string, params?: Record<string, string>) {
    return this.fetch<T>(endpoint, { method: 'GET', params });
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.fetch<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown) {
    return this.fetch<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.fetch<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);

// Auth
export const authApi = {
  me: () => api.get<{ user: User }>('/api/auth/me'),
  logout: () => api.post('/api/auth/logout'),
};

// Agents
export const agentsApi = {
  list: () => api.get<{ agents: Agent[] }>('/api/agents'),
  get: (id: string) => api.get<{ agent: Agent }>(`/api/agents/${id}`),
  create: (data: CreateAgentData) => api.post<{ agent: Agent }>('/api/agents', data),
  update: (id: string, data: UpdateAgentData) => api.patch<{ agent: Agent }>(`/api/agents/${id}`, data),
  delete: (id: string) => api.delete(`/api/agents/${id}`),
  start: (id: string) => api.post(`/api/agents/${id}/start`),
  stop: (id: string) => api.post(`/api/agents/${id}/stop`),
  pause: (id: string) => api.post(`/api/agents/${id}/pause`),
  resume: (id: string) => api.post(`/api/agents/${id}/resume`),
  restart: (id: string) => api.post(`/api/agents/${id}/restart`),
  logs: (id: string, limit?: number) =>
    api.get<{ logs: AgentLog[] }>(`/api/agents/${id}/logs`, limit ? { limit: String(limit) } : undefined),
  types: () => api.get<{ types: Record<string, AgentType> }>('/api/agents/types'),
  // Chat
  chat: (id: string, content: string, roomId?: string) =>
    api.post<ChatMessage>(`/api/agents/${id}/chat`, { content, roomId }),
  chatHistory: (id: string, roomId?: string, limit?: number) =>
    api.get<{ messages: ChatMessage[]; hasMore: boolean }>(
      `/api/agents/${id}/chat/history`,
      { ...(roomId && { roomId }), ...(limit && { limit: String(limit) }) }
    ),
};

// Connections
export const connectionsApi = {
  list: () => api.get<{ connections: Connection[] }>('/api/connections'),
  delete: (id: string) => api.delete(`/api/connections/${id}`),
  validate: (id: string) => api.get<{ valid: boolean }>(`/api/connections/${id}/validate`),
  refresh: (id: string) => api.post(`/api/connections/${id}/refresh`),
  link: (id: string, agentId: string, config?: Record<string, unknown>) =>
    api.post(`/api/connections/${id}/link`, { agentId, config }),
  unlink: (id: string, agentId: string) => api.post(`/api/connections/${id}/unlink`, { agentId }),
  addWallet: (data: { address: string; chain: string; label?: string }) =>
    api.post('/api/connections/wallet', data),
  // Telegram linking
  linkTelegram: (code: string) =>
    api.post<{ success: boolean; telegramUserId: string; chatId: string }>('/api/connections/telegram/link', { code }),
  // Discord webhook
  addDiscordWebhook: (data: { webhookUrl: string; label?: string }) =>
    api.post<{ success: boolean }>('/api/connections/discord/webhook', data),
  // Test notifications
  testNotification: (id: string) =>
    api.post<{ success: boolean; error?: string }>(`/api/connections/${id}/test-notification`),
  testAgentNotifications: (agentId: string) =>
    api.post<{ results: { channel: string; success: boolean; error?: string }[] }>(`/api/connections/test-agent/${agentId}`),
  getNotificationStatus: () =>
    api.get<{ discord: boolean; telegram: boolean }>('/api/connections/notification-status'),
};

// Users
export const usersApi = {
  me: () => api.get<{ user: User; subscription: Subscription | null; usage: Usage }>('/api/users/me'),
  update: (data: { name?: string; avatarUrl?: string }) => api.patch<{ user: User }>('/api/users/me', data),
  delete: () => api.delete('/api/users/me'),
  subscription: () => api.get<{ subscription: Subscription | null; plan: Plan }>('/api/users/subscription'),
  plans: () => api.get<{ plans: Record<string, Plan> }>('/api/users/plans'),
  usage: () => api.get<{ agents: { total: number; running: number; limit: number }; plan: string }>('/api/users/usage'),
  getNotifications: () => api.get<NotificationSettings>('/api/users/notifications'),
  updateNotifications: (data: NotificationSettingsUpdate) => api.patch<NotificationSettings>('/api/users/notifications', data),
  generateTelegramLinkCode: () => api.post<TelegramLinkCode>('/api/users/notifications/telegram/link-code'),
};

export interface TelegramLinkCode {
  code: string;
  expiresIn: number;
  instructions: string;
}

// Notification Settings Types
export interface NotificationSettings {
  telegram: {
    enabled: boolean;
    chatId: string | null;
  };
  discord: {
    enabled: boolean;
    webhookUrl: string | null;
  };
}

export interface NotificationSettingsUpdate {
  telegramEnabled?: boolean;
  telegramChatId?: string;
  discordEnabled?: boolean;
  discordWebhook?: string;
}

// Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: string;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  type: string;
  status: 'pending' | 'configuring' | 'starting' | 'running' | 'paused' | 'error' | 'stopped';
  config: Record<string, unknown>;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentLog {
  id: string;
  agentId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AgentType {
  name: string;
  description: string;
  category: string;
  icon: string;
  requiredConnections: string[];
  optionalConnections: string[];
  plugins: string[];
  configSchema: Record<string, unknown>;
  estimatedCost: string;
}

export interface Connection {
  id: string;
  provider: string;
  providerId: string;
  expiresAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: string;
  currentPeriodEnd: string;
}

export interface Plan {
  name: string;
  price: number | null;
  maxAgents: number;
  maxMessagesPerMonth: number;
  features: string[];
  stripePriceId: string | null;
}

export interface Usage {
  agents: number;
  agentsLimit: number;
}

export interface CreateAgentData {
  name: string;
  type: string;
  config?: Record<string, unknown>;
}

export interface UpdateAgentData {
  name?: string;
  config?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
