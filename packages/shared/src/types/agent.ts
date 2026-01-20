import type { AgentType } from '../constants/agent-types';

export type AgentStatus =
  | 'pending'
  | 'configuring'
  | 'starting'
  | 'running'
  | 'paused'
  | 'error'
  | 'stopped';

export type AgentTone = 'formal' | 'casual' | 'friendly' | 'professional';

export interface AgentCustomization {
  name?: string;
  personality?: string;
  rules?: string[];
  tone?: AgentTone;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  customization?: AgentCustomization;
  config: Record<string, unknown>;
  containerId?: string;
  lastHeartbeat?: Date;
  errorMessage?: string;
  messagesThisMonth: number;
  messagesTotal: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentLog {
  id: string;
  agentId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateAgentInput {
  name: string;
  type: AgentType;
  customization?: AgentCustomization;
  config?: Record<string, unknown>;
  connectionIds?: string[];
}

export interface UpdateAgentInput {
  name?: string;
  customization?: AgentCustomization;
  config?: Record<string, unknown>;
}
