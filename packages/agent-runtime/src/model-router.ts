import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export type ModelProvider = 'openai' | 'anthropic';
export type ModelTier = 'fast' | 'default' | 'complex';

export const ANTHROPIC_MODELS = {
  HAIKU: 'claude-3-5-haiku-20241022',
  SONNET: 'claude-sonnet-4-20250514',
} as const;

export const OPENAI_MODELS = {
  GPT4O_MINI: 'gpt-4o-mini',
  GPT4O: 'gpt-4o',
} as const;

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tier?: ModelTier;
}

export interface CompletionResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const MODEL_CONFIGS: Record<ModelTier, ModelConfig> = {
  fast: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    maxTokens: 500,
    temperature: 0.7,
  },
  default: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    maxTokens: 1000,
    temperature: 0.7,
  },
  complex: {
    provider: 'openai',
    model: 'gpt-4o',
    maxTokens: 2000,
    temperature: 0.7,
  },
};

export class ModelRouter {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor(config?: { openaiApiKey?: string; anthropicApiKey?: string }) {
    this.openai = new OpenAI({
      apiKey: config?.openaiApiKey || process.env.OPENAI_API_KEY,
    });
    this.anthropic = new Anthropic({
      apiKey: config?.anthropicApiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const tier = request.tier || 'default';
    const modelConfig = MODEL_CONFIGS[tier];

    const model = request.model || modelConfig.model;
    const maxTokens = request.maxTokens || modelConfig.maxTokens;
    const temperature = request.temperature || modelConfig.temperature;

    if (modelConfig.provider === 'anthropic' || model.startsWith('claude')) {
      return this.completeAnthropic(request.messages, model, maxTokens, temperature);
    }

    return this.completeOpenAI(request.messages, model, maxTokens, temperature);
  }

  private async completeOpenAI(
    messages: ChatMessage[],
    model: string,
    maxTokens: number,
    temperature: number
  ): Promise<CompletionResponse> {
    const response = await this.openai.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    });

    const choice = response.choices[0];
    if (!choice.message.content) {
      throw new Error('No content in response');
    }

    return {
      content: choice.message.content,
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  }

  private async completeAnthropic(
    messages: ChatMessage[],
    model: string,
    maxTokens: number,
    temperature: number
  ): Promise<CompletionResponse> {
    // Extract system message if present
    const systemMessage = messages.find((m) => m.role === 'system');
    const conversationMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await this.anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemMessage?.content,
      messages: conversationMessages,
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text content in Anthropic response');
    }

    return {
      content: textBlock.text,
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  selectTier(context: { isComplex: boolean; needsSpeed: boolean }): ModelTier {
    if (context.isComplex) return 'complex';
    if (context.needsSpeed) return 'fast';
    return 'default';
  }

  getModelConfig(tier: ModelTier): ModelConfig {
    return MODEL_CONFIGS[tier];
  }
}

export const modelRouter = new ModelRouter();
