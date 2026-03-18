/** Shared domain types for the NeuralMesh orchestration API. */
export type ModelTier = 'cheap' | 'mid' | 'premium';

/** Supported subtask categories. */
export type SubtaskType =
  | 'content_generation'
  | 'code_generation'
  | 'code_review'
  | 'summarization'
  | 'qa'
  | 'analysis'
  | 'formatting';

/** Registry metadata for a supported LLM. */
export interface ModelConfig {
  id: string;
  provider: 'google' | 'anthropic' | 'mistral' | 'openai';
  modelString: string;
  tier: ModelTier;
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
  maxContextTokens: number;
  strengths: string[];
  rateLimit: number;
}

/** Decomposed execution unit derived from a user prompt. */
export interface Subtask {
  id: string;
  description: string;
  type: SubtaskType;
  dependsOn: string[];
  estimatedComplexity: 1 | 2 | 3;
  context?: string;
}

/** Normalized request options for orchestration. */
export interface OrchestrationOptions {
  quality?: 'auto' | 'max' | 'min';
  budget?: 'auto' | 'strict';
  stream?: boolean;
  includeMetadata?: boolean;
}

/** Result from a single model invocation. */
export interface ModelCallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
  durationMs: number;
}

/** Completed subtask result with execution metadata. */
export interface SubtaskExecutionResult extends ModelCallResult {
  id: string;
  description: string;
  type: SubtaskType;
  tier: ModelTier;
}

/** Per-subtask cost summary. */
export interface CostBreakdownItem {
  id: string;
  modelUsed: string;
  tier: ModelTier;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
}

/** Total orchestration cost report. */
export interface CostBreakdown {
  subtasks: CostBreakdownItem[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUSD: number;
  estimatedSingleModelCostUSD: number;
  savedUSD: number;
  savingsPercent: number;
}

/** Final orchestrator response shape. */
export interface OrchestrationResult {
  response: string;
  subtasks: SubtaskExecutionResult[];
  cost: CostBreakdown;
  totalDurationMs: number;
  decomposedInto: number;
}
