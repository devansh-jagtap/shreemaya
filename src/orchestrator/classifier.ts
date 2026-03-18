import type { ModelTier, OrchestrationOptions, Subtask } from '../types';

const tierOrder: ModelTier[] = ['cheap', 'mid', 'premium'];

/** Bumps a model tier upward by a number of levels without exceeding premium. */
const bumpTier = (tier: ModelTier, levels = 1): ModelTier => {
  const nextIndex = Math.min(tierOrder.indexOf(tier) + levels, tierOrder.length - 1);
  return tierOrder[nextIndex] ?? 'premium';
};

/** Caps a tier at mid to satisfy strict-budget mode. */
const capAtMid = (tier: ModelTier): ModelTier => (tier === 'premium' ? 'mid' : tier);

/** Classifies a subtask into a model tier using rules and request overrides. */
export const classifySubtask = (
  subtask: Subtask,
  totalSubtasks: number,
  options: OrchestrationOptions = {},
): ModelTier => {
  if (options.quality === 'max') {
    return 'premium';
  }

  let tier: ModelTier = 'mid';

  if (
    subtask.estimatedComplexity === 1 &&
    ['summarization', 'qa', 'formatting'].includes(subtask.type)
  ) {
    tier = 'cheap';
  } else if (
    subtask.estimatedComplexity === 3 ||
    ['analysis', 'code_review'].includes(subtask.type)
  ) {
    tier = 'premium';
  } else if (
    subtask.estimatedComplexity === 2 ||
    ['content_generation', 'code_generation'].includes(subtask.type)
  ) {
    tier = 'mid';
  }

  if (subtask.dependsOn.length > 0 && !(totalSubtasks > 5 && tier === 'cheap')) {
    tier = bumpTier(tier);
  }

  if (options.budget === 'strict') {
    tier = capAtMid(tier);
  }

  return tier;
};
