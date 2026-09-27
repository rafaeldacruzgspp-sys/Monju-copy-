import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Publicado em https://<usuario>.github.io/Monju-copy-/
  base: '/Monju-copy-/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      workbox: {
        // Fontes: só o subconjunto latino, para funcionar offline sem baixar os demais.
        globPatterns: ['**/*.{js,css,html,png,svg}', '**/fraunces-latin-full-normal-*.woff2', '**/nunito-latin-wght-normal-*.woff2'],
      },
      manifest: {
        name: 'Monju Pessoal',
        short_name: 'Monju',
        description: 'Acompanhamento do tratamento com GLP-1',
        lang: 'pt-BR',
        theme_color: '#2f7d3b',
        background_color: '#0f1a12',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 1500 },
  test: {
    environment: 'node',
  },
});
