import { serve } from '@hono/node-server';
import 'dotenv/config'; // Load environment variables from .env
import { app } from './index';

const port = Number(process.env.PORT) || 5000;

console.log(`Starting local server on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
