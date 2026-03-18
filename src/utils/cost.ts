import { modelRegistry } from '../models/registry';
import type { CostBreakdown, ModelTier, SubtaskExecutionResult } from '../types';

/** Calculates orchestration cost totals and relative savings versus Claude Opus only. */
export const calculateCostBreakdown = (
  results: SubtaskExecutionResult[],
): CostBreakdown => {
  const subtasks = results.map((result) => {
    const model = modelRegistry[result.modelUsed];
    const costUSD =
      (result.inputTokens / 1000) * model.costPer1kInputTokens +
      (result.outputTokens / 1000) * model.costPer1kOutputTokens;

    return {
      id: result.id,
      modelUsed: result.modelUsed,
      tier: result.tier as ModelTier,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUSD,
    };
  });

  const totalInputTokens = subtasks.reduce((sum, item) => sum + item.inputTokens, 0);
  const totalOutputTokens = subtasks.reduce((sum, item) => sum + item.outputTokens, 0);
  const totalCostUSD = subtasks.reduce((sum, item) => sum + item.costUSD, 0);
  const opus = modelRegistry['claude-opus'];
  const estimatedSingleModelCostUSD =
    (totalInputTokens / 1000) * opus.costPer1kInputTokens +
    (totalOutputTokens / 1000) * opus.costPer1kOutputTokens;
  const savedUSD = estimatedSingleModelCostUSD - totalCostUSD;
  const savingsPercent =
    estimatedSingleModelCostUSD > 0 ? (savedUSD / estimatedSingleModelCostUSD) * 100 : 0;

  return {
    subtasks,
    totalInputTokens,
    totalOutputTokens,
    totalCostUSD,
    estimatedSingleModelCostUSD,
    savedUSD,
    savingsPercent,
  };
};
