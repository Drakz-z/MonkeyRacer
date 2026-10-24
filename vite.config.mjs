import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/MonkeyRacer/',
  plugins: [react()],
  server: {
    host: true, // Listen on 0.0.0.0 for mobile phone testing
    port: 5173
  },
});
