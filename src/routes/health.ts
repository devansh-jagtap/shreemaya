import { Elysia } from 'elysia';
import { modelRegistry } from '../models/registry';

const envMap: Record<string, string> = {
  'gemini-flash': 'GOOGLE_GENERATIVE_AI_API_KEY',
  'mistral-7b': 'MISTRAL_API_KEY',
  'claude-sonnet': 'ANTHROPIC_API_KEY',
  'claude-opus': 'ANTHROPIC_API_KEY',
  'gpt-4o-mini': 'OPENAI_API_KEY',
};

/** Registers the API health endpoint. */
export const healthRoutes = new Elysia().get('/api/health', () => ({
  status: 'ok',
  version: '1.0.0',
  models: Object.fromEntries(
    Object.keys(modelRegistry).map((modelId) => [
      modelId,
      process.env[envMap[modelId]] ? 'available' : 'missing_key',
    ]),
  ),
  timestamp: new Date().toISOString(),
}));
