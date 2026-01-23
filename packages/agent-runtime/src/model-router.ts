import Anthropic from '@anthropic-ai/sdk';

export type ModelProvider = 'anthropic';
export type ModelTier = 'fast' | 'default' | 'complex';

export const ANTHROPIC_MODELS = {
  HAIKU: 'claude-3-5-haiku-20241022',
  SONNET: 'claude-sonnet-4-20250514',
} as const;

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description: string;
        enum?: string[];
      }>;
      required?: string[];
    };
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface CompletionRequest {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tier?: ModelTier;
  tools?: ToolDefinition[];
}

export interface CompletionResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  toolCalls?: ToolCall[];
  finishReason?: 'stop' | 'tool_calls' | 'length';
}

const MODEL_CONFIGS: Record<ModelTier, ModelConfig> = {
  fast: {
    provider: 'anthropic',
    model: ANTHROPIC_MODELS.HAIKU,
    maxTokens: 500,
    temperature: 0.7,
  },
  default: {
    provider: 'anthropic',
    model: ANTHROPIC_MODELS.HAIKU,
    maxTokens: 1000,
    temperature: 0.7,
  },
  complex: {
    provider: 'anthropic',
    model: ANTHROPIC_MODELS.SONNET,
    maxTokens: 2000,
    temperature: 0.7,
  },
};

export class ModelRouter {
  private anthropic: Anthropic;

  constructor(config?: { anthropicApiKey?: string }) {
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
    const tools = request.tools;

    return this.completeAnthropic(request.messages, model, maxTokens, temperature, tools);
  }

  private async completeAnthropic(
    messages: ChatMessage[],
    model: string,
    maxTokens: number,
    temperature: number,
    tools?: ToolDefinition[]
  ): Promise<CompletionResponse> {
    // Extract system message if present
    const systemMessage = messages.find((m) => m.role === 'system');

    // Convert messages to Anthropic format (handle tool results)
    const conversationMessages: Anthropic.MessageParam[] = [];
    for (const m of messages.filter((m) => m.role !== 'system')) {
      if (m.role === 'tool' && m.tool_call_id) {
        // Tool results in Anthropic format
        conversationMessages.push({
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: m.tool_call_id,
            content: m.content,
          }],
        });
      } else {
        conversationMessages.push({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        });
      }
    }

    // Convert OpenAI tool format to Anthropic format
    const anthropicTools = tools?.map(t => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: {
        type: 'object' as const,
        properties: t.function.parameters.properties,
        required: t.function.parameters.required,
      },
    }));

    const requestParams: Anthropic.MessageCreateParams = {
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemMessage?.content,
      messages: conversationMessages,
    };

    if (anthropicTools && anthropicTools.length > 0) {
      requestParams.tools = anthropicTools;
    }

    const response = await this.anthropic.messages.create(requestParams);

    // Check for tool use in response
    const toolUseBlocks = response.content.filter((block) => block.type === 'tool_use');
    if (toolUseBlocks.length > 0) {
      const textBlock = response.content.find((block) => block.type === 'text');
      return {
        content: textBlock && textBlock.type === 'text' ? textBlock.text : '',
        model: response.model,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        toolCalls: toolUseBlocks.map((block) => {
          if (block.type !== 'tool_use') throw new Error('Expected tool_use block');
          return {
            id: block.id,
            type: 'function' as const,
            function: {
              name: block.name,
              arguments: JSON.stringify(block.input),
            },
          };
        }),
        finishReason: 'tool_calls',
      };
    }

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
      finishReason: response.stop_reason === 'end_turn' ? 'stop' : 'stop',
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
