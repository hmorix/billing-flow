import dns from 'node:dns';
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

import { handle } from 'hono/vercel';
import { app } from '../backend/src/index';

export const config = {
  runtime: 'nodejs',
};

export default handle(app);

