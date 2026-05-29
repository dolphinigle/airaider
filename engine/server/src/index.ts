// PROTO-GUI v0.1: Fastify HTTP API for airaider. Wraps the prototype's
// pure TS gameplay modules behind a single dispatch endpoint plus a few
// read routes. AI testability is the headline requirement — every command
// is one HTTP POST returning a full JSON state delta.

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerRoutes } from './routes.js';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '127.0.0.1';

async function main(): Promise<void> {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL ?? 'info' },
  });

  await app.register(cors, { origin: true });
  await registerRoutes(app);

  await app.listen({ port: PORT, host: HOST });
  app.log.info(`airaider-server listening on http://${HOST}:${PORT}`);
}

main().catch((err) => {
  console.error('fatal:', err);
  process.exit(1);
});
