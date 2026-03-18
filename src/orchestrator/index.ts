import { aggregateResults } from './aggregator';
import { classifySubtask } from './classifier';
import { decomposePrompt } from './decomposer';
import { routeSubtask } from './router';
import { callModel } from '../models/adapters';
import { calculateCostBreakdown } from '../utils/cost';
import { logEvent } from '../utils/logger';
import type {
  ModelTier,
  OrchestrationOptions,
  OrchestrationResult,
  Subtask,
  SubtaskExecutionResult,
} from '../types';

interface PlannedSubtask {
  subtask: Subtask;
  tier: ModelTier;
}

/** Computes dependency levels for subtasks and validates their graph. */
const buildExecutionLevels = (subtasks: Subtask[]): Subtask[][] => {
  const subtaskMap = new Map(subtasks.map((subtask) => [subtask.id, subtask]));
  const indegree = new Map(subtasks.map((subtask) => [subtask.id, subtask.dependsOn.length]));
  const outgoing = new Map<string, string[]>();

  for (const subtask of subtasks) {
    for (const dependency of subtask.dependsOn) {
      if (!subtaskMap.has(dependency)) {
        throw new Error(`Unknown dependency: ${dependency}`);
      }

      const siblings = outgoing.get(dependency) ?? [];
      siblings.push(subtask.id);
      outgoing.set(dependency, siblings);
    }
  }

  const levels: Subtask[][] = [];
  let current = subtasks.filter((subtask) => (indegree.get(subtask.id) ?? 0) === 0);
  let processed = 0;

  while (current.length > 0) {
    levels.push(current);
    processed += current.length;

    const next: Subtask[] = [];
    for (const subtask of current) {
      for (const childId of outgoing.get(subtask.id) ?? []) {
        const remaining = (indegree.get(childId) ?? 0) - 1;
        indegree.set(childId, remaining);
        if (remaining === 0) {
          const child = subtaskMap.get(childId);
          if (child) {
            next.push(child);
          }
        }
      }
    }

    current = next;
  }

  if (processed !== subtasks.length) {
    throw new Error('Circular dependency detected in subtasks');
  }

  return levels;
};

/** Builds the prompt sent to a model, injecting dependency outputs as context. */
const buildSubtaskPrompt = (
  subtask: Subtask,
  completedResults: Map<string, SubtaskExecutionResult>,
): string => {
  if (subtask.dependsOn.length === 0) {
    return subtask.description;
  }

  const dependencyContext = subtask.dependsOn
    .map((dependencyId) => completedResults.get(dependencyId)?.text)
    .filter((value): value is string => Boolean(value))
    .join('\n\n');

  return `Previous step output: ${dependencyContext}\n\nYour task: ${subtask.description}`;
};

/** Orchestrates decomposition, routing, execution, aggregation, and cost tracking. */
export const orchestratePrompt = async (
  prompt: string,
  options: OrchestrationOptions = {},
): Promise<OrchestrationResult> => {
  const start = performance.now();
  logEvent('info', 'orchestration.started', {
    promptPreview: prompt.slice(0, 100),
    options,
  });

  const subtasks = await decomposePrompt(prompt);
  logEvent('info', 'decomposition.completed', { subtaskCount: subtasks.length });

  const plannedSubtasks: PlannedSubtask[] = subtasks.map((subtask) => {
    const tier = classifySubtask(subtask, subtasks.length, options);
    logEvent('info', 'subtask.classified', {
      subtaskId: subtask.id,
      type: subtask.type,
      tier,
    });
    return { subtask, tier };
  });

  const plannedMap = new Map(plannedSubtasks.map((item) => [item.subtask.id, item]));
  const levels = buildExecutionLevels(subtasks);
  const completedResults = new Map<string, SubtaskExecutionResult>();

  for (const level of levels) {
    const levelResults = await Promise.all(
      level.map(async (subtask) => {
        const plan = plannedMap.get(subtask.id);
        if (!plan) {
          throw new Error(`Missing execution plan for subtask ${subtask.id}`);
        }

        const { primary, fallback } = routeSubtask(subtask.id, plan.tier);
        const taskPrompt = buildSubtaskPrompt(subtask, completedResults);

        try {
          const result = await callModel(primary, taskPrompt);
          return {
            ...result,
            id: subtask.id,
            description: subtask.description,
            type: subtask.type,
            tier: plan.tier,
          } satisfies SubtaskExecutionResult;
        } catch (primaryError) {
          logEvent('warn', 'model.fallback', {
            primaryModelId: primary.id,
            fallbackModelId: fallback.id,
            errorReason: primaryError instanceof Error ? primaryError.message : 'Unknown error',
          });
          const fallbackResult = await callModel(fallback, taskPrompt);
          return {
            ...fallbackResult,
            id: subtask.id,
            description: subtask.description,
            type: subtask.type,
            tier: plan.tier,
          } satisfies SubtaskExecutionResult;
        }
      }),
    );

    for (const result of levelResults) {
      completedResults.set(result.id, result);
    }
  }

  const results = subtasks
    .map((subtask) => completedResults.get(subtask.id))
    .filter((result): result is SubtaskExecutionResult => Boolean(result));

  const response =
    results.length === 1 ? results[0].text : await aggregateResults(prompt, results);
  const cost = calculateCostBreakdown(results);
  const totalDurationMs = Math.round(performance.now() - start);

  logEvent('info', 'orchestration.completed', {
    totalDurationMs,
    totalCostUSD: cost.totalCostUSD,
    savingsUSD: cost.savedUSD,
  });

  return {
    response,
    subtasks: results,
    cost,
    totalDurationMs,
    decomposedInto: subtasks.length,
  };
};
