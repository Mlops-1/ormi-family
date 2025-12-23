import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode`
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/',
    plugins: [
      TanStackRouterVite(),
      react(),
      tailwindcss(),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            VITE_TMAP_APP_KEY: env.VITE_TMAP_APP_KEY || '',
          },
        },
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'vite.svg'],
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000,
        },
        manifest: {
          name: '탐라는가족',
          short_name: '탐라는가족',
          description: '제주 여행 앱, 탐라는가족',
          theme_color: '#FF8A00',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          id: '/',
          icons: [
            {
              src: 'icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
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
        '/user': {
          target: 'http://13.209.98.82:8000',
          changeOrigin: true,
        },
        '/spot': {
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
        '/bot/agent': {
          target: 'https://shkzgaiq8b.execute-api.ap-northeast-2.amazonaws.com',
          changeOrigin: true,
        },
        '/favorites': {
          target: 'http://13.209.98.82:8000',
          changeOrigin: true,
        },
      },
    },
  };
});
