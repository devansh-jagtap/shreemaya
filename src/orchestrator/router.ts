import { modelRegistry } from '../models/registry';
import type { ModelConfig, ModelTier } from '../types';
import { logEvent } from '../utils/logger';

/** Returns primary and fallback models for a requested tier. */
const routeMap: Record<ModelTier, [ModelConfig, ModelConfig]> = {
  cheap: [modelRegistry['gemini-flash'], modelRegistry['mistral-7b']],
  mid: [modelRegistry['claude-sonnet'], modelRegistry['gpt-4o-mini']],
  premium: [modelRegistry['claude-opus'], modelRegistry['claude-sonnet']],
};

/** Resolves the primary and fallback model pair for a tier. */
export const getRouteForTier = (tier: ModelTier): [ModelConfig, ModelConfig] => routeMap[tier];

/** Selects the primary model for a subtask and logs routing metadata. */
export const routeSubtask = (
  subtaskId: string,
  tier: ModelTier,
): { primary: ModelConfig; fallback: ModelConfig } => {
  const [primary, fallback] = getRouteForTier(tier);
  logEvent('info', 'subtask.routed', {
    subtaskId,
    modelChosen: primary.id,
    fallbackModel: fallback.id,
    reason: `tier:${tier}`,
  });

  return { primary, fallback };
};
