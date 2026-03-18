import { Elysia, t } from 'elysia';
import { orchestratePrompt } from '../orchestrator';
import type { OrchestrationOptions } from '../types';

const requestSchema = t.Object({
  prompt: t.String({ minLength: 1, maxLength: 8000 }),
  options: t.Optional(
    t.Object({
      quality: t.Optional(t.Union([t.Literal('auto'), t.Literal('max'), t.Literal('min')])),
      budget: t.Optional(t.Union([t.Literal('auto'), t.Literal('strict')])),
      stream: t.Optional(t.Boolean()),
      includeMetadata: t.Optional(t.Boolean()),
    }),
  ),
});

interface OrchestrateBody {
  prompt: string;
  options?: OrchestrationOptions;
}

interface RouteContext {
  body: OrchestrateBody;
  error: (status: number, payload: unknown) => unknown;
}

/** Registers the prompt orchestration endpoint. */
export const orchestrateRoutes = new Elysia().post(
  '/api/orchestrate',
  async ({ body, error }: RouteContext) => {
    try {
      const result = await orchestratePrompt(body.prompt, {
        quality: body.options?.quality ?? 'auto',
        budget: body.options?.budget ?? 'auto',
        stream: false,
        includeMetadata: body.options?.includeMetadata ?? true,
      });

      return {
        success: true,
        response: result.response,
        metadata:
          body.options?.includeMetadata === false
            ? undefined
            : {
                subtasks: result.subtasks.map((subtask) => ({
                  id: subtask.id,
                  description: subtask.description,
                  type: subtask.type,
                  modelUsed: subtask.modelUsed,
                  tier: subtask.tier,
                  durationMs: subtask.durationMs,
                })),
                cost: result.cost,
                totalDurationMs: result.totalDurationMs,
                decomposedInto: result.decomposedInto,
              },
      };
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unknown orchestration error';
      const code = message.includes('decompos')
        ? 'DECOMPOSITION_FAILED'
        : message.includes('aggregate')
          ? 'AGGREGATION_FAILED'
          : message.includes('model')
            ? 'ALL_MODELS_FAILED'
            : 'INVALID_INPUT';

      return error(500, {
        success: false,
        error: message,
        code,
      });
    }
  },
  { body: requestSchema },
);
