import { Queue, Worker, Job, type ConnectionOptions } from 'bullmq';
import { redis } from './redis';

// Only create queues if Redis is available
const queueConnection = redis as ConnectionOptions | undefined;

// Agent lifecycle queue
export const agentQueue = queueConnection ? new Queue('agent-lifecycle', {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
}) : null;

// Webhook queue
export const webhookQueue = queueConnection ? new Queue('webhooks', {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 1000,
    removeOnFail: 100,
  },
}) : null;

// Alert queue
export const alertQueue = queueConnection ? new Queue('alerts', {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
}) : null;

export interface AgentJobData {
  agentId: string;
  userId: string;
  action: 'start' | 'stop' | 'pause' | 'resume' | 'restart';
}

export interface WebhookJobData {
  url: string;
  payload: Record<string, unknown>;
  secret?: string;
}

export interface AlertJobData {
  agentId: string;
  userId: string;
  type: string;
  message: string;
  data?: Record<string, unknown>;
}

// Job schedulers
export async function scheduleAgentJob(data: AgentJobData, delay?: number): Promise<Job | null> {
  if (!agentQueue) return null;
  return agentQueue.add(`agent-${data.action}`, data, {
    delay,
  });
}

export async function scheduleWebhook(data: WebhookJobData): Promise<Job | null> {
  if (!webhookQueue) return null;
  return webhookQueue.add('webhook-delivery', data);
}

export async function scheduleAlert(data: AlertJobData): Promise<Job | null> {
  if (!alertQueue) return null;
  return alertQueue.add('alert-notification', data);
}
