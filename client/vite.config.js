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
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            if (!res.headersSent && res.writeHead) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'No se pudo conectar con el backend en el puerto 4000' }));
            }
          });
        },
      },
    },
  },
});
