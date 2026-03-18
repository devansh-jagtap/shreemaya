import type { ModelConfig } from '../types';

/** Static registry of available models and pricing metadata. */
export const modelRegistry: Record<string, ModelConfig> = {
  'gemini-flash': {
    id: 'gemini-flash',
    provider: 'google',
    modelString: 'gemini-2.0-flash',
    tier: 'cheap',
    costPer1kInputTokens: 0.0001,
    costPer1kOutputTokens: 0.0004,
    maxContextTokens: 1048576,
    strengths: ['summarization', 'qa', 'formatting', 'decomposition'],
    rateLimit: 60,
  },
  'mistral-7b': {
    id: 'mistral-7b',
    provider: 'mistral',
    modelString: 'mistral-small-latest',
    tier: 'cheap',
    costPer1kInputTokens: 0.0002,
    costPer1kOutputTokens: 0.0006,
    maxContextTokens: 32768,
    strengths: ['qa', 'formatting', 'content_generation'],
    rateLimit: 60,
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    provider: 'openai',
    modelString: 'gpt-4o-mini',
    tier: 'mid',
    costPer1kInputTokens: 0.00015,
    costPer1kOutputTokens: 0.0006,
    maxContextTokens: 128000,
    strengths: ['content_generation', 'code_generation', 'qa'],
    rateLimit: 60,
  },
  'claude-sonnet': {
    id: 'claude-sonnet',
    provider: 'anthropic',
    modelString: 'claude-sonnet-4-5',
    tier: 'mid',
    costPer1kInputTokens: 0.003,
    costPer1kOutputTokens: 0.015,
    maxContextTokens: 200000,
    strengths: ['analysis', 'aggregation', 'code_generation', 'synthesis'],
    rateLimit: 50,
  },
  'claude-opus': {
    id: 'claude-opus',
    provider: 'anthropic',
    modelString: 'claude-opus-4-5',
    tier: 'premium',
    costPer1kInputTokens: 0.015,
    costPer1kOutputTokens: 0.075,
    maxContextTokens: 200000,
    strengths: ['analysis', 'code_review', 'reasoning'],
    rateLimit: 40,
  },
};

/** Returns all registered models as an array. */
export const listModels = (): ModelConfig[] => Object.values(modelRegistry);
