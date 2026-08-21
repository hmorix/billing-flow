import { getRequestListener } from '@hono/node-server';
import { app } from '../backend/src/index';

export const config = {
  runtime: 'nodejs',
};

export default getRequestListener(app.fetch);
