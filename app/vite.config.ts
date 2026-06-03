import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The web GUI shares ALL game logic with the CLI via core/; only web/ is presentation.
export default defineConfig({
  root: '.',
  plugins: [react()],
  server: { port: 5173 },
});
