import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El proxy hace que /api sea "mismo origen" en desarrollo,
// así la cookie HTTP-Only viaja sin problemas de SameSite.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
