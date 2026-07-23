/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static, fully client-side. base:'./' so dist/ deploys as-is to
// Netlify / Vercel / GitHub Pages without path rewrites.
export default defineConfig({
  // Absolute base so assets resolve from root at any route depth (BrowserRouter + SEO URLs).
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
  },
});
