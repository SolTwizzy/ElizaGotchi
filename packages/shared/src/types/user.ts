import type { Plan } from '../constants/plans';

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface OAuthAccount {
  id: string;
  userId: string;
  provider: 'google' | 'github' | 'discord';
  providerAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: Plan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  maxAgents: number;
  maxMessagesPerMonth: number;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  messagesUsed: number;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}
