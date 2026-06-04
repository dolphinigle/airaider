import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The web GUI shares ALL game logic with the CLI via core/; only web/ is presentation.
// Load the OpenAI key from ../.env (the same file the CLI reads) and expose it to the
// browser as VITE_OPENAI_API_KEY so `npm run web` calls the real model with no extra setup.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '..', ''); // '' prefix → load ALL vars (incl. non-VITE) from ../.env
  const key = env.VITE_OPENAI_API_KEY || env.OPENAI_API_KEY || '';
  return {
    root: '.',
    plugins: [react()],
    define: { 'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(key) },
    server: { port: 5173 },
  };
});
