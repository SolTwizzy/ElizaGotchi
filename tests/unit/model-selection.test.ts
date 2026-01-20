/**
 * Unit tests for Model Selection feature
 */

import { describe, it, expect } from 'vitest';
import {
  AI_MODELS,
  FREE_MODELS,
  PREMIUM_MODELS,
  DEFAULT_MODEL,
  type AIModel,
} from '../../packages/shared/src/constants/agent-types';

describe('Model Selection', () => {
  describe('AI_MODELS constant', () => {
    it('should have all expected models defined', () => {
      const expectedModels = [
        'gpt-4o-mini',
        'claude-3-haiku',
        'gpt-4o',
        'gpt-4-turbo',
        'claude-3.5-sonnet',
        'claude-3-opus',
      ];

      expectedModels.forEach((model) => {
        expect(model in AI_MODELS).toBe(true);
      });
    });

    it('should have correct structure for each model', () => {
      Object.entries(AI_MODELS).forEach(([modelId, config]) => {
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('provider');
        expect(config).toHaveProperty('tier');
        expect(config).toHaveProperty('description');
        expect(config).toHaveProperty('costPer1kTokens');

        expect(typeof config.name).toBe('string');
        expect(['openai', 'anthropic']).toContain(config.provider);
        expect(['free', 'premium']).toContain(config.tier);
        expect(typeof config.description).toBe('string');
        expect(typeof config.costPer1kTokens).toBe('number');
      });
    });
  });

  describe('FREE_MODELS', () => {
    it('should include GPT-4o-mini', () => {
      expect(FREE_MODELS).toContain('gpt-4o-mini');
    });

    it('should include Claude 3 Haiku', () => {
      expect(FREE_MODELS).toContain('claude-3-haiku');
    });

    it('should only have 2 free models', () => {
      expect(FREE_MODELS).toHaveLength(2);
    });

    it('should all have tier "free" in AI_MODELS', () => {
      FREE_MODELS.forEach((model) => {
        expect(AI_MODELS[model].tier).toBe('free');
      });
    });
  });

  describe('PREMIUM_MODELS', () => {
    it('should include GPT-4o', () => {
      expect(PREMIUM_MODELS).toContain('gpt-4o');
    });

    it('should include GPT-4 Turbo', () => {
      expect(PREMIUM_MODELS).toContain('gpt-4-turbo');
    });

    it('should include Claude 3.5 Sonnet', () => {
      expect(PREMIUM_MODELS).toContain('claude-3.5-sonnet');
    });

    it('should include Claude 3 Opus', () => {
      expect(PREMIUM_MODELS).toContain('claude-3-opus');
    });

    it('should have 4 premium models', () => {
      expect(PREMIUM_MODELS).toHaveLength(4);
    });

    it('should all have tier "premium" in AI_MODELS', () => {
      PREMIUM_MODELS.forEach((model) => {
        expect(AI_MODELS[model].tier).toBe('premium');
      });
    });
  });

  describe('DEFAULT_MODEL', () => {
    it('should be gpt-4o-mini', () => {
      expect(DEFAULT_MODEL).toBe('gpt-4o-mini');
    });

    it('should be a free model', () => {
      expect(FREE_MODELS).toContain(DEFAULT_MODEL);
    });
  });

  describe('Model providers', () => {
    it('should have correct providers for OpenAI models', () => {
      const openaiModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'];
      openaiModels.forEach((model) => {
        expect(AI_MODELS[model as AIModel].provider).toBe('openai');
      });
    });

    it('should have correct providers for Anthropic models', () => {
      const anthropicModels = ['claude-3-haiku', 'claude-3.5-sonnet', 'claude-3-opus'];
      anthropicModels.forEach((model) => {
        expect(AI_MODELS[model as AIModel].provider).toBe('anthropic');
      });
    });
  });

  describe('Model costs', () => {
    it('should have free models cost less than premium models', () => {
      const maxFreeCost = Math.max(...FREE_MODELS.map((m) => AI_MODELS[m].costPer1kTokens));
      const minPremiumCost = Math.min(...PREMIUM_MODELS.map((m) => AI_MODELS[m].costPer1kTokens));

      expect(maxFreeCost).toBeLessThan(minPremiumCost);
    });

    it('should have gpt-4o-mini as cheapest model', () => {
      const allCosts = Object.values(AI_MODELS).map((m) => m.costPer1kTokens);
      const minCost = Math.min(...allCosts);
      expect(AI_MODELS['gpt-4o-mini'].costPer1kTokens).toBe(minCost);
    });
  });

  describe('Agent config with model selection', () => {
    it('should correctly identify premium model requirement', () => {
      const isPremiumModel = (model: AIModel) => !FREE_MODELS.includes(model);

      expect(isPremiumModel('gpt-4o-mini')).toBe(false);
      expect(isPremiumModel('claude-3-haiku')).toBe(false);
      expect(isPremiumModel('gpt-4o')).toBe(true);
      expect(isPremiumModel('claude-3.5-sonnet')).toBe(true);
    });

    it('should build correct config with model selection', () => {
      const buildConfig = (model: AIModel, customApiKey?: string) => {
        const modelConfig = AI_MODELS[model];
        const config: Record<string, unknown> = {
          model,
          modelProvider: modelConfig.provider,
        };

        if (!FREE_MODELS.includes(model) && customApiKey) {
          config.customApiKey = customApiKey;
        }

        return config;
      };

      // Free model - no API key needed
      const freeConfig = buildConfig('gpt-4o-mini');
      expect(freeConfig.model).toBe('gpt-4o-mini');
      expect(freeConfig.modelProvider).toBe('openai');
      expect(freeConfig.customApiKey).toBeUndefined();

      // Premium model - API key required
      const premiumConfig = buildConfig('gpt-4o', 'sk-test-key');
      expect(premiumConfig.model).toBe('gpt-4o');
      expect(premiumConfig.modelProvider).toBe('openai');
      expect(premiumConfig.customApiKey).toBe('sk-test-key');
    });
  });
});
