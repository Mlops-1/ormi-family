import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tailwindcss()],
  assetsInclude: ['**/*.riv'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://13.209.98.82:8000',
        changeOrigin: true,
      },
      '/user/info': {
        target: 'http://13.209.98.82:8000',
        changeOrigin: true,
      },
      '/docs': {
        target: 'http://13.209.98.82:8000',
        changeOrigin: true,
      },
      '/openapi.json': {
        target: 'http://13.209.98.82:8000',
        changeOrigin: true,
      },
      '/dashboard': {
        target: 'http://13.209.98.82:8000',
        changeOrigin: true,
      },
      '/spot': {
        target: 'http://13.209.98.82:8000',
        changeOrigin: true,
      },
      '/favorites': {
        target: 'http://13.209.98.82:8000',
        changeOrigin: true,
      },
    },
  },
});
