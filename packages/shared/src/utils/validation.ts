import { z } from 'zod';
import { AGENT_TYPES } from '../constants/agent-types';

// Agent validation schemas
export const agentToneSchema = z.enum(['formal', 'casual', 'friendly', 'professional']);

export const agentCustomizationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  personality: z.string().max(500).optional(),
  rules: z.array(z.string().max(200)).max(20).optional(),
  tone: agentToneSchema.optional(),
});

export const agentTypeSchema = z.enum(
  Object.keys(AGENT_TYPES) as [string, ...string[]]
);

export const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  type: agentTypeSchema,
  customization: agentCustomizationSchema.optional(),
  config: z.record(z.unknown()).optional(),
  connectionIds: z.array(z.string().uuid()).optional(),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  customization: agentCustomizationSchema.optional(),
  config: z.record(z.unknown()).optional(),
});

// Connection validation schemas
export const connectionTypeSchema = z.enum([
  'discord',
  'telegram',
  'github',
  'twitch',
  'twitter',
  'wallet-evm',
  'wallet-solana',
]);

// User validation schemas
export const emailSchema = z.string().email().max(255);

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().url().max(500).optional(),
});

// Wallet address validation
export const evmAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM address');

export const solanaAddressSchema = z.string().regex(
  /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  'Invalid Solana address'
);

// Utility function to validate against a schema
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
