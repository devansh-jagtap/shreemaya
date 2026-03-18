import { Elysia } from 'elysia';
import { listModels } from '../models/registry';

/** Registers the model-registry listing endpoint. */
export const modelRoutes = new Elysia().get('/api/models', () => listModels());
