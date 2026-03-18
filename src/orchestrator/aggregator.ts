import { callModel } from '../models/adapters';
import { modelRegistry } from '../models/registry';
import type { SubtaskExecutionResult } from '../types';
import { logEvent } from '../utils/logger';

const aggregationSystemPrompt =
  'You synthesize multiple partial outputs into one polished final response. Write as a single coherent assistant answer. Do not mention internal orchestration or multiple models unless the user explicitly asked about them.';

/** Merges subtask outputs into a single final response using Claude Sonnet. */
export const aggregateResults = async (
  prompt: string,
  results: SubtaskExecutionResult[],
): Promise<string> => {
  logEvent('info', 'aggregation.started', { subtaskCount: results.length });

  const promptPayload = [
    `Original user prompt: ${prompt}`,
    'Subtask outputs:',
    ...results.map(
      (result, index) =>
        `${index + 1}. ${result.description}\nType: ${result.type}\nOutput:\n${result.text}`,
    ),
  ].join('\n\n');

  const response = await callModel(
    modelRegistry['claude-sonnet'],
    promptPayload,
    aggregationSystemPrompt,
  );

  return response.text;
};
