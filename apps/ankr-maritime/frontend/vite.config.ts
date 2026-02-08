import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3008,
    host: true,
    strictPort: false,
    hmr: {
      clientPort: 443,
    },
    proxy: {
      '/graphql': {
        target: 'http://localhost:4051',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:4051',
        changeOrigin: true,
      },
    },
    // Custom middleware to disable host checking
    middlewareMode: false,
  },
  preview: {
    host: true,
    port: 3008,
    strictPort: false,
  },
});
