import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: '탐라는가족',
        short_name: '탐라는가족',
        description: '제주 여행 앱, 탐라는가족',
        theme_color: '#FF8A00',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
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
      '/prod': {
        target: 'https://tmqr6uurv7.execute-api.ap-northeast-2.amazonaws.com',
        changeOrigin: true,
      },
      '/favorites': {
        target: 'http://13.209.98.82:8000',
        changeOrigin: true,
      },
    },
  },
});
