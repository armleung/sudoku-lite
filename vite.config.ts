/// <reference types="vitest/config" />
import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {VitePWA} from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages subpath — critical for PWA installability (service worker scope).
  base: '/sudoku-lite/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-180.png'],
      manifest: {
        name: 'Sudoku Lite',
        short_name: 'Sudoku',
        description: 'Play Sudoku offline. Installable, no ads, no accounts.',
        lang: 'en',
        start_url: '/sudoku-lite/',
        scope: '/sudoku-lite/',
        display: 'standalone',
        background_color: '#1F2937',
        theme_color: '#1F2937',
        icons: [
          {
            src: '/sudoku-lite/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/sudoku-lite/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: '/sudoku-lite/index.html',
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
