import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // overridable, so a second instance can run beside one you are playing instead of fighting it
    // for the port. Pair with AIRAIDER_SAVE and it clobbers nothing.
    port: Number(process.env.WEB_PORT ?? 5273),
    proxy: { '/api': process.env.API_URL ?? 'http://127.0.0.1:3210' },
  },
});
