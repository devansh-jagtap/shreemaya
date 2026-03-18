# NeuralMesh

NeuralMesh is a Bun + Elysia API that automatically decomposes a user prompt into subtasks, routes each task to the most cost-effective model, and returns one unified answer. It is designed as an orchestration-first backend where users never pick a model manually.

## How routing works

NeuralMesh classifies each subtask into one of three tiers: `cheap`, `mid`, or `premium`. Simple summarization, QA, and formatting tasks go to low-cost models first, generation tasks route to mid-tier models, and complex analysis or code review tasks route to premium reasoning models, with quality and budget overrides applied before execution.

## Setup

1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in your provider keys.
3. Install dependencies:
   ```bash
   bun install
   ```
4. Start the development server:
   ```bash
   bun run dev
   ```

## Example request

```bash
curl -X POST http://localhost:3000/api/orchestrate \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "Analyze the tradeoffs of Bun vs Node for a TypeScript API and give me a recommendation.",
    "options": {
      "quality": "auto",
      "budget": "auto",
      "includeMetadata": true
    }
  }'
```

## Example response

```json
{
  "success": true,
  "response": "Bun is a strong fit when startup performance and an all-in-one toolchain matter most...",
  "metadata": {
    "subtasks": [
      {
        "id": "6f7d8d38-97a0-4f10-87db-3c5d7f7c9424",
        "description": "Analyze Bun strengths for TypeScript APIs.",
        "type": "analysis",
        "modelUsed": "claude-opus",
        "tier": "premium",
        "durationMs": 2130
      }
    ],
    "cost": {
      "subtasks": [
        {
          "id": "6f7d8d38-97a0-4f10-87db-3c5d7f7c9424",
          "modelUsed": "claude-opus",
          "tier": "premium",
          "inputTokens": 420,
          "outputTokens": 260,
          "costUSD": 0.0258
        }
      ],
      "totalInputTokens": 420,
      "totalOutputTokens": 260,
      "totalCostUSD": 0.0258,
      "estimatedSingleModelCostUSD": 0.0258,
      "savedUSD": 0,
      "savingsPercent": 0
    },
    "totalDurationMs": 2314,
    "decomposedInto": 1
  }
}
```

## Cost savings example

A prompt decomposed into cheap QA plus mid-tier synthesis might cost a fraction of running every step on Claude Opus. For example, if orchestration costs `$0.012` and a full Claude Opus pass would cost `$0.038`, NeuralMesh saves `$0.026` or roughly `68.4%`.

## Extending the registry

To add a new model, create a new entry in `src/models/registry.ts` with its provider, exact AI SDK model string, tier, pricing, context size, strengths, and rate limit. Once it exists in the registry, update `src/orchestrator/router.ts` if you want that model to be chosen as a primary or fallback target for a tier.
