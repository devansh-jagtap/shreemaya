import { callModel } from '../models/adapters';
import { modelRegistry } from '../models/registry';
import type { Subtask, SubtaskType } from '../types';

const decompositionSystemPrompt = `You are a task decomposition engine. Given a user prompt, break it into the minimum number of independent or sequentially dependent subtasks needed to complete it. Return ONLY a valid JSON array of subtask objects. Each object must have: id (uuid v4), description (string), type (one of: content_generation, code_generation, code_review, summarization, qa, analysis, formatting), dependsOn (array of ids, empty if independent), estimatedComplexity (1, 2, or 3 where 1=trivial, 2=moderate, 3=requires expert reasoning). Return no other text, no markdown, no explanation.`;

const validSubtaskTypes = new Set<SubtaskType>([
  'content_generation',
  'code_generation',
  'code_review',
  'summarization',
  'qa',
  'analysis',
  'formatting',
]);

/** Returns a heuristic single-subtask fallback for simple prompts. */
const createSimpleSubtask = (prompt: string): Subtask[] => {
  const type: SubtaskType = /code|function|typescript|javascript|bug|refactor/i.test(prompt)
    ? 'code_generation'
    : /summarize|summary/i.test(prompt)
      ? 'summarization'
      : /format|json|html|table/i.test(prompt)
        ? 'formatting'
        : /analy[sz]e|plan|architecture/i.test(prompt)
          ? 'analysis'
          : 'qa';

  return [
    {
      id: crypto.randomUUID(),
      description: prompt,
      type,
      dependsOn: [],
      estimatedComplexity: prompt.length < 240 ? 1 : 2,
    },
  ];
};

/** Validates and normalizes LLM-produced subtask JSON. */
const normalizeSubtasks = (value: unknown): Subtask[] => {
  if (!Array.isArray(value)) {
    throw new Error('Decomposer did not return an array');
  }

  return value.map((item) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof item.id !== 'string' ||
      typeof item.description !== 'string' ||
      !validSubtaskTypes.has(item.type as SubtaskType) ||
      !Array.isArray(item.dependsOn) ||
      ![1, 2, 3].includes(item.estimatedComplexity as 1 | 2 | 3)
    ) {
      throw new Error('Invalid subtask structure returned by decomposer');
    }

    return {
      id: item.id,
      description: item.description,
      type: item.type as SubtaskType,
      dependsOn: item.dependsOn.filter((dep: unknown): dep is string => typeof dep === 'string'),
      estimatedComplexity: item.estimatedComplexity as 1 | 2 | 3,
    } satisfies Subtask;
  });
};

/** Decomposes a user prompt into structured subtasks using Gemini Flash when needed. */
export const decomposePrompt = async (prompt: string): Promise<Subtask[]> => {
  const estimatedTokens = Math.ceil(prompt.length / 4);
  const looksSimple =
    estimatedTokens < 80 &&
    !/[{};<>`\n]/.test(prompt) &&
    !/\b(and|then|after|compare|plan|analyze|review)\b/i.test(prompt);

  if (looksSimple) {
    return createSimpleSubtask(prompt);
  }

  const result = await callModel(modelRegistry['gemini-flash'], prompt, decompositionSystemPrompt);
  const subtasks = normalizeSubtasks(JSON.parse(result.text));
  return subtasks.length > 0 ? subtasks : createSimpleSubtask(prompt);
};
