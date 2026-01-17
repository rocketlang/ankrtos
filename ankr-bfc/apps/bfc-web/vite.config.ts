/**
 * BFC Web - Vite Configuration
 * Ports are auto-configured from @ankr-bfc/config
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Import centralized port configuration
import { PORTS } from '@ankr-bfc/config';

const API_PORT = PORTS.bfc.api;
const WEB_PORT = PORTS.bfc.web;

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: WEB_PORT,
    host: true,
    proxy: {
      '/graphql': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
        ws: true,
      },
      '/api': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
      },
      '/health': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
      },
    },
  },

  preview: {
    port: WEB_PORT,
  },

  define: {
    // Inject ports at build time for fallbacks
    '__BFC_API_PORT__': API_PORT,
    '__BFC_WEB_PORT__': WEB_PORT,
  },
});
