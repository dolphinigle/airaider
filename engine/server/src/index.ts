// PROTO-GUI v0.5: Fastify HTTP API for airaider. Wraps the prototype's
// pure TS gameplay modules behind a single dispatch endpoint plus a few
// read routes. AI testability is the headline requirement — every command
// is one HTTP POST returning a full JSON state delta.

// Load .env from the airaider repo root (two levels above engine/server/src),
// so `npm run gui` from the repo root picks it up even though the workspace
// script chdirs into engine/server/.
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '../../../.env') });

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerRoutes } from './routes.js';
import { getScenarioLLM } from './llm.js';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '127.0.0.1';

async function main(): Promise<void> {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL ?? 'info' },
  });

  await app.register(cors, { origin: true });
  await registerRoutes(app);

  // Eagerly init LLM so the "[llm] using OpenAI…" / "[llm] OPENAI_API_KEY not set" log
  // shows on boot, not on the first End Day.
  getScenarioLLM();

  await app.listen({ port: PORT, host: HOST });
  app.log.info(`airaider-server listening on http://${HOST}:${PORT}`);
}

main().catch((err) => {
  console.error('fatal:', err);
  process.exit(1);
});
