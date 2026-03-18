import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { mistral } from '@ai-sdk/mistral';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import type { LanguageModel } from 'ai';
import type { ModelConfig, ModelCallResult } from '../types';
import { logEvent } from '../utils/logger';
import { withRetry } from '../utils/retry';

/** Maps provider identifiers to AI SDK model factories. */
const providerMap: Record<ModelConfig['provider'], (modelString: string) => LanguageModel> = {
  anthropic,
  google,
  mistral,
  openai,
};

/** Estimates tokens for logging before a provider returns concrete usage data. */
const estimateTokens = (value: string): number => Math.ceil(value.length / 4);

/** Calls a provider model through the Vercel AI SDK and returns normalized metadata. */
export const callModel = async (
  config: ModelConfig,
  prompt: string,
  systemPrompt?: string,
): Promise<ModelCallResult> => {
  const estimatedInputTokens = estimateTokens(`${systemPrompt ?? ''}\n${prompt}`);
  logEvent('info', 'model.called', {
    modelId: config.id,
    inputTokenEstimate: estimatedInputTokens,
  });

  return withRetry(async () => {
    const start = performance.now();
    const result = await generateText({
      model: providerMap[config.provider](config.modelString),
      prompt,
      system: systemPrompt,
      temperature: 0.2,
    });
    const durationMs = Math.round(performance.now() - start);
    const inputTokens = result.usage?.inputTokens ?? estimatedInputTokens;
    const outputTokens = result.usage?.outputTokens ?? estimateTokens(result.text);

    logEvent('info', 'model.response', {
      modelId: config.id,
      inputTokens,
      outputTokens,
      durationMs,
      estimatedCostUSD:
        (inputTokens / 1000) * config.costPer1kInputTokens +
        (outputTokens / 1000) * config.costPer1kOutputTokens,
    });

    return {
      text: result.text,
      inputTokens,
      outputTokens,
      modelUsed: config.id,
      durationMs,
    };
  });
};
