import { Elysia } from 'elysia';
import { healthRoutes } from './routes/health';
import { modelRoutes } from './routes/models';
import { orchestrateRoutes } from './routes/orchestrate';

const app = new Elysia()
  .use(healthRoutes)
  .use(modelRoutes)
  .use(orchestrateRoutes)
  .get('/', () => ({
    name: 'NeuralMesh',
    status: 'ready',
  }));

const port = Number(process.env.PORT ?? 3000);

app.listen(port);

console.log(`🧠 NeuralMesh listening on http://localhost:${port}`);
