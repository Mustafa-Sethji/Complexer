import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Keep the frontend and API as separate processes. Vite forwards API requests
// to Express, avoiding the fragile approach of mounting Express inside Vite.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
});
